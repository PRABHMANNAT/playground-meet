import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { attachmentProblem, maxAttachmentBytes } from '@/lib/attachments';
import { authorize } from '@/lib/authorization';
import { transaction } from '@/lib/db';
import { invariant } from '@/lib/errors';
import { api, body, sameOrigin } from '@/lib/http';
import { limit } from '@/lib/rate-limit';
import { requirePerson } from '@/lib/session';
import { chatRecipient } from '@/lib/schemas';
import { checkChatRecipient } from '@/lib/actions/chat';

export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  api(async () => {
    sameOrigin(req);
    const person = await requirePerson();
    const { id } = await params;
    await authorize(id, person);
    await limit('upload:' + person.id, 20);
    const { name, size, recipient } = z
      .object({ name: z.string(), size: z.number(), recipient: chatRecipient })
      .parse(await body(req));
    const problem = attachmentProblem(name, size);
    invariant(!problem, size > maxAttachmentBytes ? 413 : 400, problem);
    const file = randomUUID();
    await transaction(async (db) => {
      await checkChatRecipient(db, id, person.id, recipient);
      await db.query('DELETE FROM attachments WHERE NOT ready AND created < $1', [
        Date.now() - 86400000,
      ]);
      await db.query(
        'INSERT INTO attachments(id, room, owner, filename, size, created, recipient) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [file, id, person.id, name, size, Date.now(), recipient ?? null],
      );
    });
    return { file };
  });
