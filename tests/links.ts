import assert from 'node:assert/strict';
import { Client, base } from './helpers/client';
import { meetingPath, meetingInviteUrl, parseMeetingLink } from '../src/lib/meeting-links';

async function main() {
  const host = new Client(),
    guest = new Client();
  await host.call('/api/session', { name: 'Invite link host' });
  const { id } = await host.call('/api/meetings', {
    title: 'Invitation link verification',
    lobby: true,
  });
  const invite = meetingInviteUrl(id, base);
  assert.ok(new URL(invite).pathname.startsWith('/playground-meet/'));
  assert.equal(parseMeetingLink(invite), id);
  for (const path of [
    '/',
    '/privacy',
    '/auth/playground',
    meetingPath(id),
    meetingPath(id, true),
  ]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
  }
  for (const suffix of ['', '/recap']) {
    const response = await fetch(`${base}/room/${id}${suffix}?from=invite`, { redirect: 'manual' });
    assert.equal(response.status, 308);
    assert.equal(
      new URL(response.headers.get('location')!, base).pathname,
      meetingPath(id, Boolean(suffix)),
    );
    assert.equal(new URL(response.headers.get('location')!, base).search, '?from=invite');
  }
  const info = await guest.call(`/api/meetings/${id}`);
  assert.equal(info.title, 'Invitation link verification');
  const person = (await guest.call('/api/session', { name: 'Invite link guest' })).person;
  assert.equal((await guest.call(`/api/meetings/${id}/join`, {})).status, 'waiting');
  await host.call(`/api/meetings/${id}/actions`, { type: 'admit', memberId: person.id });
  assert.equal((await guest.call(`/api/meetings/${id}/join`, {})).status, 'admitted');
  assert.ok(
    (await host.call('/api/meetings')).meetings.some(
      (meeting: { id: string }) => meeting.id === id,
    ),
  );
  await host.call(`/api/meetings/${id}/actions`, { type: 'end' });
  assert.ok((await guest.call(`/api/meetings/${id}/summary`)).markdown);
  const invalid = await fetch(`${base}/playground-meet/not-a-code`);
  assert.equal(invalid.status, 404);
  console.log(
    'PASS create → canonical invite → guest preview → waiting room → admission → history → recap/summary; legacy redirects and page routes',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
