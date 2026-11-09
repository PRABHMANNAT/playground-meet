import type { Handler } from './context';
export const rating: Handler = async ({ db, room, person }) => {
  await db.query('DELETE FROM events WHERE room=$1 AND actor=$2 AND kind=$3', [
    room.id,
    person.id,
    'rating',
  ]);
};
