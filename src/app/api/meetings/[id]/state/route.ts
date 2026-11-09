import { api } from '@/lib/http';
import { requirePerson } from '@/lib/session';
import { snapshot } from '@/lib/snapshot';
import { authorize } from '@/lib/authorization';
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const p = await requirePerson();
    const room = await authorize(id, p, false, true);
    const tag = `"${room.revision}"`;
    if (req.headers.get('if-none-match') === tag)
      return new Response(null, {
        status: 304,
        headers: { ETag: tag, 'Cache-Control': 'private, no-cache' },
      });
    const data = await snapshot(id, p);
    return Response.json(data, {
      headers: { ETag: `"${data.meeting.revision}"`, 'Cache-Control': 'private, no-cache' },
    });
  } catch (e) {
    return api(async () => {
      throw e;
    });
  }
}
