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
