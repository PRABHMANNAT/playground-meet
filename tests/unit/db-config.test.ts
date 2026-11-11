import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as typeof globalThis & { meetStore?: unknown }).meetStore;
});
test('Vercel requires persistent Postgres and permits retry after initialization failure', async () => {
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('DATABASE_URL', '');
  const { store } = await import('../../src/lib/db');
  await expect(store()).rejects.toMatchObject({ status: 503 });
  expect((globalThis as typeof globalThis & { meetStore?: unknown }).meetStore).toBeUndefined();
  await expect(store()).rejects.toThrow('DATABASE_URL');
});
