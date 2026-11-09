import type { Handler } from './context';
export const hand: Handler = async ({ db, room, person }, a) => {
  if (a.type !== 'hand') return;
  await db.query('UPDATE members SET hand=$1 WHERE room=$2 AND person=$3', [
    a.raised,
    room.id,
    person.id,
  ]);
};
