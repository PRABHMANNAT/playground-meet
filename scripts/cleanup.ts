import { query } from '../src/lib/db';
async function main() {
  const now = Date.now();
  const days = Number(process.env.RETENTION_DAYS || 30);
  if (!Number.isFinite(days) || days < 1)
    throw new Error('RETENTION_DAYS must be at least one day');
  const rooms = await query<{ id: string }>(
    'SELECT id FROM rooms WHERE ended=TRUE AND created<$1',
    [now - days * 86400000],
  );
  if (!process.argv.includes('--apply')) {
    console.log(
      `Dry run: ${rooms.length} ended meetings older than ${days} days. Add --apply to delete them and their collaboration data.`,
    );
    return;
  }
  await query('DELETE FROM rooms WHERE ended=TRUE AND created<$1', [now - days * 86400000]);
  await query('DELETE FROM sessions WHERE expires<$1', [now]);
  await query('DELETE FROM sso_nonces WHERE expires<$1', [now]);
  await query('DELETE FROM rate_limits WHERE reset<$1', [now]);
  console.log('Expired sessions, nonces, counters and eligible ended meetings deleted.');
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
