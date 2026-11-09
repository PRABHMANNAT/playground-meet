import { test, expect, vi } from 'vitest';
import { remove } from '../../src/lib/actions/remove';
import { admit } from '../../src/lib/actions/admit';
import { hostActions } from '../../src/lib/actions';
import { context } from './fixtures';
test('every destructive room command is host-only', () => {
  for (const action of [
    'admit',
    'remove',
    'mute',
    'end',
    'clear-board',
    'lock',
    'lobby',
    'timer',
    'review',
    'poll',
    'close-poll',
  ] as const)
    expect(hostActions.has(action)).toBe(true);
});
test('hosts cannot accidentally revoke their own membership', async () => {
  await expect(remove(context(), { type: 'remove', memberId: 'host' })).rejects.toThrow();
});
test('stale admission requests fail without inventing memberships', async () => {
  const c = context();
  c.db.query = vi.fn(async () => ({ rows: [] }));
  await expect(admit(c, { type: 'admit', memberId: 'unknown' })).rejects.toThrow();
});
