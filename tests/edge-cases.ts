import assert from 'node:assert/strict';
import { Client, base } from './helpers/client';
async function main() {
  const host = new Client(),
    guest = new Client();
  await host.call('/api/session', { name: 'Edge host' });
  const { id } = await host.call('/api/meetings', { title: 'Edge cases', lobby: true });
  const path = '/api/meetings/' + id;
  const first = await fetch(base + path + '/state', { headers: { Cookie: host.cookie } });
  const tag = first.headers.get('etag');
  assert.ok(tag);
  const unchanged = await fetch(base + path + '/state', {
    headers: { Cookie: host.cookie, 'If-None-Match': tag! },
  });
  assert.equal(unchanged.status, 304);
  const gp = (await guest.call('/api/session', { name: 'Edge guest' })).person;
  await guest.call(path + '/join', {});
  const changed = await fetch(base + path + '/state', {
    headers: { Cookie: host.cookie, 'If-None-Match': tag! },
  });
  assert.equal(changed.status, 200);
  await host.call(path + '/actions', { type: 'admit', memberId: gp.id });
  const guestState = await fetch(base + path + '/state', { headers: { Cookie: guest.cookie } });
  const guestTag = guestState.headers.get('etag')!;
  await host.call(path + '/actions', { type: 'remove', memberId: gp.id });
  const denied = await fetch(base + path + '/state', {
    headers: { Cookie: guest.cookie, 'If-None-Match': guestTag },
  });
  assert.equal(denied.status, 403);
  console.log('PASS ETag invalidation and authorization before cache validation');
  const registration = new Client();
  const guestIdentity = (await registration.call('/api/session', { name: 'Upgrade me' })).person.id;
  await registration.call('/api/auth', {
    mode: 'register',
    email: `upgrade-${Date.now()}@example.test`,
    password: 'a suitably long upgrade password',
    name: 'Persistent tester',
  });
  assert.equal((await registration.call('/api/session')).person.id, guestIdentity);
  console.log('PASS guest-to-account ownership preservation');
  for (let n = 0; n < 9; n++)
    await host.call('/api/meetings', { title: 'Rate limit test', lobby: true });
  await host.call('/api/meetings', { title: 'Blocked by limit', lobby: true }, 429);
  console.log('PASS persistent room creation rate limit');
  await host.call(path + '/actions', { type: 'end' });
  console.log('All edge-case checks passed.');
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
