import { attachmentChunkBytes } from '@/lib/attachments';
import { attachmentRange, previewMime } from '@/lib/attachment-preview';
import { authorize } from '@/lib/authorization';
import { query, transaction } from '@/lib/db';
import { invariant } from '@/lib/errors';
import { api, sameOrigin } from '@/lib/http';
import { readBytes } from '@/lib/read-body';
import { requirePerson } from '@/lib/session';
import { checkChatRecipient } from '@/lib/actions/chat';

type Context = { params: Promise<{ id: string; file: string }> };
type Attachment = {
  filename: string;
  size: number;
  received: number;
  ready: boolean;
  recipient: string | null;
};

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
        await checkChatRecipient(db, id, person.id, entry.recipient);
        const header =
          offset === 0
            ? bytes
            : (
                await db.query<{ header: Uint8Array }>(
                  'SELECT substring(content from 1 for 256) AS header FROM attachment_chunks WHERE file_id=$1 AND start_byte=0',
                  [file],
                )
              ).rows[0].header;
        const preview = previewMime(header, entry.filename)?.split('/')[0] ?? null;
        await db.query(
          'INSERT INTO events(room,kind,actor,name,payload,created) VALUES($1,$2,$3,$4,$5,$6)',
          [
            id,
            'attachment',
            person.id,
            person.name,
            JSON.stringify({
              file,
              filename: entry.filename,
              size: entry.size,
              preview,
              recipient: entry.recipient ?? undefined,
            }),
            Date.now(),
          ],
        );
        await db.query('UPDATE rooms SET revision=revision+1 WHERE id=$1', [id]);
      }
      return { received };
    });
  });

function serveAttachment(req: Request, { params }: Context) {
  return api(async () => {
    const person = await requirePerson();
    const { id, file } = await params;
    await authorize(id, person);
    const preview = new URL(req.url).searchParams.get('preview') === '1';
    const [entry] = await query<Attachment & { header: Uint8Array }>(
      `SELECT filename,size, CASE WHEN $3 THEN
        (SELECT substring(content from 1 for 256) FROM attachment_chunks WHERE file_id=$1 AND start_byte=0)
        END AS header FROM attachments WHERE id=$1 AND room=$2 AND ready
        AND (recipient IS NULL OR owner=$4 OR recipient=$4)`,
      [file, id, preview, person.id],
    );
    invariant(entry, 404, 'File not found.');
    const mime = preview ? previewMime(entry.header, entry.filename) : 'application/octet-stream';
    invariant(mime, 415, 'This file has no inline preview.');
    const ranged = req.headers.get('range');
    const range = attachmentRange(ranged, entry.size);
    const headers = new Headers({
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition':
        (preview ? 'inline' : 'attachment') +
        "; filename*=UTF-8''" +
        encodeURIComponent(entry.filename).replace(
          /['()*]/g,
          (c) => '%' + c.charCodeAt(0).toString(16),
        ),
    });
    if (!range) {
      headers.set('Content-Range', `bytes */${entry.size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set('Content-Length', String(range.end - range.start + 1));
    if (ranged) headers.set('Content-Range', `bytes ${range.start}-${range.end}/${entry.size}`);
    const init = { status: ranged ? 206 : 200, headers };
    if (req.method === 'HEAD') return new Response(null, init);
    let offset = range.start;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const chunkStart = Math.floor(offset / attachmentChunkBytes) * attachmentChunkBytes;
        const [part] = await query<{ content: Uint8Array }>(
          'SELECT content FROM attachment_chunks WHERE file_id=$1 AND start_byte=$2',
          [file, chunkStart],
        );
        if (!part) throw new Error('Missing file chunk.');
        const bytes = part.content.subarray(offset - chunkStart, range.end - chunkStart + 1);
        controller.enqueue(bytes);
        offset += bytes.length;
        if (offset > range.end) controller.close();
      },
    });
    return new Response(stream, init);
  });
}
export const GET = serveAttachment;
export const HEAD = serveAttachment;
