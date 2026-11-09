import { api, body, sameOrigin } from '@/lib/http';
import { requirePerson } from '@/lib/session';
import { roomInput } from '@/lib/schemas';
import { query, transaction } from '@/lib/db';
import { meetingId } from '@/lib/ids';
import { limit } from '@/lib/rate-limit';
import { emptyState } from '@/lib/types';
export const GET = () =>
  api(async () => {
    const p = await requirePerson();
    return {
      meetings: await query(
        'SELECT r.id,r.title,r.created,r.ended,r.host FROM rooms r JOIN members m ON m.room=r.id WHERE m.person=$1 AND m.status=$2 ORDER BY r.created DESC LIMIT 30',
        [p.id, 'admitted'],
      ),
    };
  });
export const POST = (req: Request) =>
  api(async () => {
    sameOrigin(req);
    const p = await requirePerson();
    await limit('create:' + p.id, 10);
    const input = roomInput.parse(await body(req));
    const id = meetingId(),
      now = Date.now();
    await transaction(async (db) => {
      await db.query(
        'INSERT INTO rooms(id,title,host,created,lobby,state) VALUES($1,$2,$3,$4,$5,$6)',
        [id, input.title, p.id, now, input.lobby, JSON.stringify(emptyState())],
      );
      await db.query('INSERT INTO members(room,person,status,joined) VALUES($1,$2,$3,$4)', [
        id,
        p.id,
        'admitted',
        now,
      ]);
    });
    return { id };
  });
