import { api } from '@/lib/http';
import { requirePerson } from '@/lib/session';
import { authorize } from '@/lib/authorization';
import { query } from '@/lib/db';

export const GET = (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  api(async () => {
    const { id } = await params;
    const room = await authorize(id, await requirePerson(), false, true);
    const rows = await query<{ created: string | number; name: string; text: string }>(
      "SELECT created, name, payload->>'text' AS text FROM events WHERE room=$1 AND kind='transcript' ORDER BY created, id",
      [id],
    );
    return {
      title: room.title,
      started: room.created,
      lines: rows.map((row) => ({ at: Number(row.created), speaker: row.name, text: row.text })),
    };
  });
