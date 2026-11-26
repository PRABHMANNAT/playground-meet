import type { Handler } from './context';
import type { DB } from '../db';
import { invariant } from '../errors';

export async function checkChatRecipient(
  db: DB,
  room: string,
  sender: string,
  recipient?: string | null,
) {
  if (recipient == null) return;
  invariant(recipient !== sender, 400, 'Choose another participant.');
  const { rows } = await db.query(
    "SELECT 1 FROM members WHERE room=$1 AND person=$2 AND status='admitted'",
    [room, recipient],
  );
  invariant(rows.length, 400, 'This participant is unavailable.');
}

export const chat: Handler = async ({ db, room, person }, action) => {
  if (action.type === 'chat') await checkChatRecipient(db, room.id, person.id, action.recipient);
};
