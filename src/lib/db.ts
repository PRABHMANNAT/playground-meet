import { Pool } from 'pg';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { schema } from './schema';
import { HttpError } from './errors';
export type DB = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
};
type Store = { db: DB; transaction: <T>(fn: (db: DB) => Promise<T>) => Promise<T> };
const globalStore = globalThis as typeof globalThis & { meetStore?: Promise<Store> };
async function initialize(): Promise<Store> {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
    // Concurrent cold starts must not race CREATE TABLE/INDEX catalog writes.
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(72465001)');
        await client.query(schema);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      await pool.end();
      throw error;
    }
    pool.on('error', () => console.error('An idle database connection failed.'));
    return {
      db: pool,
      transaction: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn(client);
          await client.query('COMMIT');
          return result;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      },
    };
  }
  if (process.env.VERCEL === '1')
    throw new HttpError(503, 'Database is not configured. Set DATABASE_URL in Vercel.');
  const { PGlite } = await import('@electric-sql/pglite');
  const path = resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH || '.data/meet');
  await mkdir(path, { recursive: true });
  const db = new PGlite(path);
  await db.exec(schema);
  return { db, transaction: (fn) => db.transaction((tx) => fn(tx as DB)) };
}
export const store = () =>
  (globalStore.meetStore ??= initialize().catch((error) => {
    globalStore.meetStore = undefined;
    throw error;
  }));
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await (await store()).db.query<T>(sql, params)).rows;
}
export async function transaction<T>(fn: (db: DB) => Promise<T>) {
  return (await store()).transaction(fn);
}
