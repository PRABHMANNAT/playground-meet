import { api, sameOrigin } from '@/lib/http';
import { requirePerson } from '@/lib/session';
import { getRoom } from '@/lib/authorization';
import { transaction } from '@/lib/db';
import { invariant } from '@/lib/errors';
import type { Meeting } from '@/lib/types';
import { mediaToken } from '@/lib/livekit';
import { limit } from '@/lib/rate-limit';
export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  api(async () => {
    sameOrigin(req);
    const p = await requirePerson();
    const { id } = await params;
    await limit('token:' + p.id, 30);
    await getRoom(id);
    return transaction(async (db) => {
      const {
        rows: [room],
      } = await db.query<Meeting>('SELECT * FROM rooms WHERE id=$1 FOR UPDATE', [id]);
      invariant(!room.ended, 410, 'This meeting has ended.');
      const {
        rows: [member],
      } = await db.query<{ status: string }>(
        'SELECT status FROM members WHERE room=$1 AND person=$2',
        [id, p.id],
      );
      invariant(member?.status === 'admitted', 403, 'The host must admit you first.');
      return mediaToken(id, p.id, p.name);
    });
  });
