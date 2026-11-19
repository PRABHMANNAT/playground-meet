import { attachmentChunkBytes } from '@/lib/attachments';
import { authorize } from '@/lib/authorization';
import { query, transaction } from '@/lib/db';
import { invariant } from '@/lib/errors';
import { api, sameOrigin } from '@/lib/http';
import { readBytes } from '@/lib/read-body';
import { requirePerson } from '@/lib/session';

type Context = { params: Promise<{ id: string; file: string }> };
type Attachment = { filename: string; size: number; received: number; ready: boolean };

export const PUT = (req: Request, { params }: Context) =>
  api(async () => {
    sameOrigin(req);
    const person = await requirePerson();
    const { id, file } = await params;
    await authorize(id, person);
    const offset = Number(req.headers.get('x-file-offset') ?? -1);
    invariant(
      Number.isSafeInteger(offset) && offset >= 0 && offset % attachmentChunkBytes === 0,
      400,
      'Invalid file offset.',
    );
    const bytes = await readBytes(req, attachmentChunkBytes);
    return transaction(async (db) => {
      const {
        rows: [access],
      } = await db.query(
        "SELECT r.id FROM rooms r JOIN members m ON m.room=r.id WHERE r.id=$1 AND m.person=$2 AND m.status='admitted' AND NOT r.ended FOR UPDATE OF r",
        [id, person.id],
      );
      invariant(access, 403, 'Access to this meeting has ended.');
      const {
        rows: [entry],
      } = await db.query<Attachment>(
        'SELECT * FROM attachments WHERE id=$1 AND room=$2 AND owner=$3 FOR UPDATE',
        [file, id, person.id],
      );
      invariant(entry, 404, 'Upload not found.');
      invariant(
        offset < entry.size && bytes.length === Math.min(attachmentChunkBytes, entry.size - offset),
        400,
        'Incomplete file chunk.',
      );
      if (offset < entry.received) return { received: entry.received };
      invariant(offset === entry.received, 409, 'File chunks must arrive in order.');
      const received = offset + bytes.length;
      const ready = received === entry.size;
      await db.query(
        'INSERT INTO attachment_chunks(file_id, start_byte, content) VALUES($1,$2,$3)',
        [file, offset, bytes],
      );
      await db.query('UPDATE attachments SET received=$1, ready=$2 WHERE id=$3', [
        received,
        ready,
        file,
      ]);
      if (ready) {
        await db.query(
          'INSERT INTO events(room,kind,actor,name,payload,created) VALUES($1,$2,$3,$4,$5,$6)',
          [
            id,
            'attachment',
            person.id,
            person.name,
            JSON.stringify({ file, filename: entry.filename, size: entry.size }),
            Date.now(),
          ],
        );
        await db.query('UPDATE rooms SET revision=revision+1 WHERE id=$1', [id]);
      }
      return { received };
    });
  });

export const GET = (_req: Request, { params }: Context) =>
  api(async () => {
    const person = await requirePerson();
    const { id, file } = await params;
    await authorize(id, person);
    const [entry] = await query<Attachment>(
      'SELECT filename,size FROM attachments WHERE id=$1 AND room=$2 AND ready',
      [file, id],
    );
    invariant(entry, 404, 'File not found.');
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const [part] = await query<{ content: Uint8Array }>(
          'SELECT content FROM attachment_chunks WHERE file_id=$1 AND start_byte=$2',
          [file, offset],
        );
        if (!part) throw new Error('Missing file chunk.');
        controller.enqueue(part.content);
        offset += part.content.length;
        if (offset === entry.size) controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(entry.size),
        'Content-Disposition':
          "attachment; filename*=UTF-8''" +
          encodeURIComponent(entry.filename).replace(
            /['()*]/g,
            (c) => '%' + c.charCodeAt(0).toString(16),
          ),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  });
