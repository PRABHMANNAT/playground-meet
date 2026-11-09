import {PGlite} from '@electric-sql/pglite';
import {Pool} from 'pg';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {schema} from './schema';
export type DB={query<T=Record<string,unknown>>(sql:string,params?:unknown[]):Promise<{rows:T[]}>};
type Store={db:DB;transaction:<T>(fn:(db:DB)=>Promise<T>)=>Promise<T>};
const globalStore=globalThis as typeof globalThis & {meetStore?:Promise<Store>};
async function initialize():Promise<Store>{
 if(process.env.DATABASE_URL){const pool=new Pool({connectionString:process.env.DATABASE_URL,max:8});await pool.query(schema);return {db:pool,transaction:async fn=>{const client=await pool.connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}};}
 const path=resolve(process.env.DATABASE_PATH||'.data/meet');await mkdir(path,{recursive:true});const db=new PGlite(path);await db.exec(schema);
 return {db,transaction:fn=>db.transaction(tx=>fn(tx as DB))};
}
export const store=()=>globalStore.meetStore??=(initialize());
export async function query<T=Record<string,unknown>>(sql:string,params:unknown[]=[]){return (await (await store()).db.query<T>(sql,params)).rows;}
export async function transaction<T>(fn:(db:DB)=>Promise<T>){return (await store()).transaction(fn);}
