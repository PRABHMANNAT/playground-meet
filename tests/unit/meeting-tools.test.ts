import { expect, it, vi } from 'vitest';
import { bookmarks } from '../../src/lib/actions/bookmarks';
import { timer } from '../../src/lib/actions/timer';
import { timerSeconds } from '../../src/lib/meeting-timer';
import { summary } from '../../src/lib/summary';
import { context } from './fixtures';

it('uses a shared deadline, freezes on pause and resumes from the saved time', async () => {
  const c = context();
  const clock = vi.spyOn(Date, 'now');
  try {
    clock.mockReturnValue(1000);
    await timer(c, { type: 'timer', seconds: 60 });
    clock.mockReturnValue(4100);
    await timer(c, { type: 'timer-control', operation: 'pause' });
    expect(timerSeconds(c.room.state.timer, 64000)).toBe(57);
    clock.mockReturnValue(64000);
    await timer(c, { type: 'timer-control', operation: 'resume' });
    await timer(c, { type: 'timer-control', operation: 'resume' });
    expect(timerSeconds(c.room.state.timer, 66000)).toBe(55);
    expect(timerSeconds(c.room.state.timer, 121000)).toBe(0);
    await timer(c, { type: 'timer', seconds: 0 });
    expect(c.room.state.timer.endsAt).toBe(0);
  } finally {
    clock.mockRestore();
  }
});

it('retains one timestamp per bookmark across retries and checks who can remove it', async () => {
  const c = context();
  const action = { type: 'bookmark', id: crypto.randomUUID(), label: 'Design approved' } as const;
  await bookmarks(c, action);
  await bookmarks(c, action);
  expect(c.room.state.bookmarks).toHaveLength(1);
  expect(
    summary({ meeting: c.room, me: c.person, events: [], members: [], serverTime: Date.now() }),
  ).toContain('Design approved — Guest');
  const remove = { type: 'remove-bookmark', id: action.id } as const;
  await expect(bookmarks({ ...c, person: { ...c.person, id: 'other' } }, remove)).rejects.toThrow();
  await bookmarks({ ...c, person: { ...c.person, id: c.room.host } }, remove);
  expect(c.room.state.bookmarks).toHaveLength(0);
});
