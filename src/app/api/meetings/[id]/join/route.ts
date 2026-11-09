import { api, sameOrigin } from '@/lib/http';
import { requirePerson } from '@/lib/session';
import { transaction } from '@/lib/db';
import { getRoom } from '@/lib/authorization';
import { invariant } from '@/lib/errors';
import { limit } from '@/lib/rate-limit';
import type { Meeting } from '@/lib/types';
export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  api(async () => {
    sameOrigin(req);
    const p = await requirePerson();
    const { id } = await params;
    await getRoom(id);
    await limit('join:' + p.id, 30);
    return transaction(async (db) => {
      const {
        rows: [r],
      } = await db.query<Meeting>('SELECT * FROM rooms WHERE id=$1 FOR UPDATE', [id]);
      invariant(!r.ended, 410, 'This meeting has ended.');
      const {
        rows: [m],
      } = await db.query<{ status: string }>(
        'SELECT status FROM members WHERE room=$1 AND person=$2',
        [id, p.id],
      );
      invariant(m?.status !== 'denied', 403, 'The host has declined your request.');
      if (m?.status === 'admitted') return { status: 'admitted' };
      invariant(!r.locked, 423, 'This meeting is locked.');
      const {
        rows: [count],
      } = await db.query<{ total: string }>('SELECT COUNT(*) AS total FROM members WHERE room=$1', [
        id,
      ]);
      invariant(m || Number(count.total) < 25, 409, 'This room has reached its 25-person limit.');
      const status = r.lobby ? 'waiting' : 'admitted';
      await db.query(
        'INSERT INTO members(room,person,status,joined) VALUES($1,$2,$3,$4) ON CONFLICT(room,person) DO NOTHING',
        [id, p.id, status, Date.now()],
      );
      await db.query('UPDATE rooms SET revision=revision+1 WHERE id=$1', [id]);
      return { status: m?.status || status };
    });
  });
