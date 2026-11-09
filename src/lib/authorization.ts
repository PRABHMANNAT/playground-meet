import { query } from './db';
import { invariant } from './errors';
import { validMeetingId } from './ids';
import type { Meeting, Member, Person } from './types';
export async function getRoom(id: string) {
  invariant(validMeetingId(id), 404, 'Meeting not found.');
  const [room] = await query<Meeting>('SELECT * FROM rooms WHERE id=$1', [id]);
  invariant(room, 404, 'Meeting not found.');
  return { ...room, created: Number(room.created) };
}
export async function authorize(id: string, person: Person, host = false, allowEnded = false) {
  const room = await getRoom(id);
  invariant(allowEnded || !room.ended, 410, 'This meeting has ended.');
  const [member] = await query<Member>(
    'SELECT person AS id,status,hand,joined FROM members WHERE room=$1 AND person=$2',
    [id, person.id],
  );
  invariant(member?.status === 'admitted', 403, 'The host must admit you first.');
  invariant(!host || room.host === person.id, 403, 'Only the host can do that.');
  return room;
}
