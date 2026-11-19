import { z } from 'zod';
import { api, body, sameOrigin } from '@/lib/http';
import { requirePerson } from '@/lib/session';
import { authorize } from '@/lib/authorization';
import { invariant } from '@/lib/errors';
import { roomService } from '@/lib/livekit';
import { limit } from '@/lib/rate-limit';

export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  api(async () => {
    sameOrigin(req);
    const person = await requirePerson();
    const { id } = await params;
    const { active, sid } = z
      .object({ active: z.boolean(), sid: z.string().min(1).max(100) })
      .parse(await body(req));
    await authorize(id, person, false, !active);
    await limit('record-status:' + person.id, 60);
    const service = roomService();
    const participant = await service.getParticipant(id, person.id);
    invariant(participant.sid === sid, 409, 'Your meeting connection has changed.');
    await service.updateParticipant(id, person.id, {
      attributes: { localRecording: active ? 'on' : '' },
    });
    return { ok: true };
  });
