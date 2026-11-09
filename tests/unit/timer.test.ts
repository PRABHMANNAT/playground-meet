import { test, expect, vi } from 'vitest';
import { timer } from '../../src/lib/actions/timer';
import { context } from './fixtures';
test('focus deadlines are derived from server time and can be stopped', async () => {
  const c = context();
  vi.spyOn(Date, 'now').mockReturnValue(1000000);
  await timer(c, { type: 'timer', seconds: 300 });
  expect(c.room.state.timer.endsAt).toBe(1300000);
  await timer(c, { type: 'timer', seconds: 0 });
  expect(c.room.state.timer.endsAt).toBe(0);
  vi.restoreAllMocks();
});
