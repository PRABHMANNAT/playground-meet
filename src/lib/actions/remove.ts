import type { Handler } from './context';
import { invariant } from '../errors';
export const remove: Handler = async ({ db, room }, a) => {
  if (a.type !== 'remove') return;
  invariant(a.memberId !== room.host, 400, 'The host cannot remove themselves.');
  const result = await db.query(
    'UPDATE members SET status=$1 WHERE room=$2 AND person=$3 RETURNING person',
    ['denied', room.id, a.memberId],
  );
  invariant(result.rows.length, 404, 'Participant not found.');
};
