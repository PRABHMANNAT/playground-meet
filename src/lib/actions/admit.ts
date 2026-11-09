import type { Handler } from './context';
import { invariant } from '../errors';
export const admit: Handler = async ({ db, room }, a) => {
  if (a.type !== 'admit') return;
  const result = await db.query(
    'UPDATE members SET status=$1 WHERE room=$2 AND person=$3 AND status=$4 RETURNING person',
    ['admitted', room.id, a.memberId, 'waiting'],
  );
  invariant(result.rows.length, 409, 'This participant is no longer waiting.');
};
