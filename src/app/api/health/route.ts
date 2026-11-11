import { query } from '@/lib/db';
import { mediaConfig } from '@/lib/livekit';
export async function GET() {
  try {
    await query('SELECT 1');
    let callingConfigured = false;
    try {
      mediaConfig();
      callingConfigured = true;
    } catch {
      /* Health stays available while media is being configured. */
    }
    return Response.json(
      {
        status: 'ok',
        callingConfigured,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
