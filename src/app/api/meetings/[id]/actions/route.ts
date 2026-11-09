import { api, body, sameOrigin } from '@/lib/http';
import { requirePerson } from '@/lib/session';
import { actionInput } from '@/lib/schemas';
import { limit } from '@/lib/rate-limit';
import { dispatch } from '@/lib/dispatch';
export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  api(async () => {
    sameOrigin(req);
    const p = await requirePerson();
    await limit('actions:' + p.id, 180);
    return dispatch((await params).id, p, actionInput.parse(await body(req)));
  });
