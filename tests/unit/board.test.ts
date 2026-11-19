import { test, expect } from 'vitest';
import { stroke } from '../../src/lib/actions/stroke';
import { clearBoard } from '../../src/lib/actions/clear-board';
import { actionInput } from '../../src/lib/schemas';
import { context } from './fixtures';
test('retried strokes are idempotent and retain authenticated authorship', async () => {
  const c = context();
  const a = {
    type: 'stroke' as const,
    id: crypto.randomUUID(),
    color: '#FF7548' as const,
    points: [
      [0, 0],
      [1, 1],
    ] as [number, number][],
  };
  await stroke(c, a);
  await stroke(c, a);
  expect(c.room.state.strokes).toHaveLength(1);
  expect(c.room.state.strokes[0].author).toBe('guest');
  await clearBoard(c, { type: 'clear-board' });
  expect(c.room.state.strokes).toHaveLength(0);
});
test('non-normalized drawing coordinates are rejected', () => {
  expect(
    actionInput.safeParse({
      type: 'stroke',
      id: crypto.randomUUID(),
      color: '#FF7548',
      points: [
        [0, 0],
        [2, 1],
      ],
    }).success,
  ).toBe(false);
});

test('only the presenter or host can stop presenting, and the canvas survives stopping', async () => {
  const c = context();
  await stroke(c, { type: 'board-share', active: true });
  expect(c.room.state.boardPresenter).toEqual({ id: 'guest', name: 'Guest' });
  c.person = { id: 'other', name: 'Other', account: false };
  await expect(stroke(c, { type: 'board-share', active: false })).rejects.toThrow();
  c.person.id = c.room.host;
  await stroke(c, { type: 'board-share', active: false });
  expect(c.room.state.boardPresenter).toBeNull();
});
test('committed ink clears its preview, undo is scoped to the author, and clearing rejects stale drafts', async () => {
  const c = context(),
    id = crypto.randomUUID(),
    points: [number, number][] = [
      [0, 0],
      [1, 1],
    ];
  const mark = {
    type: 'stroke' as const,
    id,
    points,
    color: '#171717' as const,
    width: 4,
    wide: true,
    epoch: 0,
  };
  const preview = { type: 'board-preview' as const, id, points, width: 4, epoch: 0 };
  await stroke(c, preview);
  expect(c.room.state.boardPreviews?.guest.name).toBe('Guest');
  await stroke(c, mark);
  await stroke(c, preview);
  expect(c.room.state.boardPreviews?.guest).toBeUndefined();
  c.person.id = 'other';
  await expect(stroke(c, { type: 'board-undo', id })).rejects.toThrow();
  c.person.id = 'guest';
  await stroke(c, { type: 'board-undo', id });
  expect(c.room.state.strokes).toHaveLength(0);
  await clearBoard(c, { type: 'clear-board' });
  await expect(stroke(c, mark)).rejects.toThrow();
  await stroke(c, preview);
  expect(c.room.state.boardPreviews).toEqual({});
});
