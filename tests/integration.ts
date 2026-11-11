import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client, base } from './helpers/client';
async function main() {
  const host = new Client(),
    guest = new Client(),
    outsider = new Client();
  await outsider.call('/api/meetings', undefined, 401);
  const hp = (await host.call('/api/session', { name: 'Host integration' })).person;
  const gp = (await guest.call('/api/session', { name: 'Guest integration' })).person;
  await outsider.call('/api/session', { name: 'Outsider integration' });
  const { id } = await host.call('/api/meetings', { title: 'Integration: review', lobby: true });
  const path = '/api/meetings/' + id;
  const act = (client: Client, a: unknown, status = 200) =>
    client.call(path + '/actions', a, status);
  assert.equal((await guest.call(path + '/join', {})).status, 'waiting');
  await guest.call(path + '/token', {}, 403);
  await guest.call(path + '/state', undefined, 403);
  await outsider.call(path + '/summary', undefined, 403);
  await act(guest, { type: 'admit', memberId: gp.id }, 403);
  await act(guest, { type: 'browser', url: 'https://example.com/' }, 403);
  await act(host, { type: 'admit', memberId: gp.id });
  assert.ok((await guest.call(path + '/token', {})).token);
  console.log('PASS authentication, isolation, waiting room, host admission');
  await act(guest, { type: 'browser', url: 'https://example.com' });
  const page = (await host.call(path + '/state')).meeting.state.browser;
  assert.equal(page.url, 'https://example.com/');
  assert.equal(page.sharedBy, gp.id);
  assert.equal(page.name, gp.name);
  assert.ok(page.id);
  const browserStroke = {
    id: randomUUID(),
    points: [
      [0.1, 0.2],
      [0.2, 0.3],
    ],
  };
  const annotate = { type: 'browser-annotate', shareId: page.id, ...browserStroke };
  await act(outsider, annotate, 403);
  await act(host, annotate);
  await act(host, annotate);
  const marked = await guest.call(path + '/state');
  assert.deepEqual(marked.meeting.state.browser.annotations, [browserStroke]);
  assert.ok(
    marked.events
      .filter((e: any) => e.kind === 'browser-annotate')
      .every((e: any) => !e.payload.points),
  );
  await outsider.call(path + '/state', undefined, 403);
  await act(host, { type: 'browser', url: 'https://www.iana.org/domains/reserved' });
  await act(host, annotate, 409);
  const nextPage = (await guest.call(path + '/state')).meeting.state.browser;
  assert.deepEqual(nextPage.annotations, []);
  await act(guest, { ...annotate, shareId: nextPage.id });
  const clear = { type: 'browser-clear-annotations', shareId: nextPage.id };
  await act(guest, clear, 403);
  await act(host, clear);
  assert.deepEqual((await guest.call(path + '/state')).meeting.state.browser.annotations, []);
  await act(guest, { type: 'browser', url: null }, 403);
  await act(host, { type: 'browser', url: null });
  const cleared = await guest.call(path + '/state');
  assert.equal(cleared.meeting.state.browser, null);
  const browserEvents = cleared.events.filter((e: any) => e.kind === 'browser');
  assert.equal(browserEvents.length, 3);
  assert.ok(browserEvents.every((e: any) => !e.payload.url));
  console.log(
    'PASS shared browser updates, room isolation, annotation sync, permissions, and URL history',
  );
  await act(guest, { type: 'chat', text: 'Shared hello' });
  let snapshot = await host.call(path + '/state');
  assert.ok(snapshot.events.some((e: any) => e.payload.text === 'Shared hello'));
  await act(guest, { type: 'hand', raised: true });
  snapshot = await host.call(path + '/state');
  assert.equal(snapshot.members.find((m: any) => m.id === gp.id).hand, true);
  await act(guest, { type: 'reaction', emoji: '🎉' });
  console.log('PASS multi-user chat, reactions, hand state');
  await act(host, { type: 'notes', text: 'First editor', version: 0 });
  await act(guest, { type: 'notes', text: 'Stale edit', version: 0 }, 409);
  await act(guest, { type: 'notes', text: 'Merged notes', version: 1 });
  assert.equal((await host.call(path + '/state')).meeting.state.notes, 'Merged notes');
  console.log('PASS notes conflict detection and persistence');
  const simultaneous = await Promise.all(
    [host, guest].map((client, index) =>
      fetch(base + path + '/actions', {
        method: 'POST',
        headers: { Origin: base, Cookie: client.cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'notes', text: `Concurrent editor ${index}`, version: 2 }),
      }),
    ),
  );
  assert.deepEqual(simultaneous.map((r) => r.status).sort(), [200, 409]);
  const winningEditor = simultaneous.findIndex((r) => r.status === 200);
  assert.equal(
    (await host.call(path + '/state')).meeting.state.notes,
    `Concurrent editor ${winningEditor}`,
  );
  await act(host, { type: 'notes', text: 'Merged notes', version: 3 });
  console.log('PASS simultaneous edits cannot silently overwrite each other');
  await act(guest, { type: 'poll', question: 'Unauthorized?', options: ['A', 'B'] }, 403);
  await act(host, { type: 'poll', question: 'Ship?', options: ['Yes', 'No'] });
  snapshot = await guest.call(path + '/state');
  const poll = snapshot.meeting.state.polls[0];
  await act(guest, { type: 'vote', pollId: poll.id, option: 0 });
  await act(guest, { type: 'vote', pollId: poll.id, option: 1 });
  assert.deepEqual(
    Object.values((await host.call(path + '/state')).meeting.state.polls[0].votes),
    [1],
  );
  await act(host, { type: 'close-poll', pollId: poll.id });
  await act(guest, { type: 'vote', pollId: poll.id, option: 0 }, 409);
  console.log('PASS poll authorization, duplicate votes and closure');
  const stroke = {
    type: 'stroke',
    id: crypto.randomUUID(),
    color: '#FF7548',
    points: [
      [0.1, 0.1],
      [0.8, 0.9],
    ],
  };
  await act(guest, stroke);
  await act(guest, stroke);
  assert.equal((await host.call(path + '/state')).meeting.state.strokes.length, 1);
  await act(guest, { type: 'clear-board' }, 403);
  await act(host, { type: 'clear-board' });
  assert.equal((await guest.call(path + '/state')).meeting.state.strokes.length, 0);
  console.log('PASS shared whiteboard and host clearing');
  await act(host, { type: 'timer', seconds: 300 });
  assert.ok((await guest.call(path + '/state')).meeting.state.timer.endsAt > Date.now());
  await act(host, { type: 'review', url: 'javascript:alert(1)', task: 'bad' }, 400);
  await act(host, {
    type: 'review',
    url: 'https://tryplayground.net',
    task: 'Find the tester signup',
  });
  await act(guest, { type: 'marker', kind: 'bug', text: 'Signup button is unclear' });
  await act(guest, { type: 'rating', rating: 4, text: 'Useful review' });
  await act(guest, { type: 'rating', rating: 5, text: 'Updated feedback' });
  const markdown = (await host.call(path + '/summary')).markdown;
  assert.ok(markdown.includes('Merged notes'));
  assert.ok(markdown.includes('Signup button is unclear'));
  assert.ok(markdown.includes('5/5'));
  console.log('PASS review, feedback, timer and deterministic summary');
  await act(host, { type: 'lock', locked: true });
  await outsider.call(path + '/join', {}, 423);
  await act(guest, { type: 'end' }, 403);
  await act(host, { type: 'remove', memberId: gp.id });
  await guest.call(path + '/token', {}, 403);
  await guest.call(path + '/join', {}, 403);
  await guest.call(path + '/summary', undefined, 403);
  console.log('PASS locking, removal and authorization revocation');
  await act(host, { type: 'browser', url: 'https://example.com/' });
  await act(host, { type: 'end' });
  assert.equal((await host.call(path + '/state')).meeting.state.browser, null);
  await host.call(path + '/token', {}, 410);
  await act(host, { type: 'chat', text: 'after end' }, 410);
  await act(host, { type: 'rating', rating: 5, text: 'All done' });
  assert.ok((await host.call(path + '/summary')).markdown);
  console.log('PASS end-for-all and authorized post-call recap');
  const openRoom = (
    await host.call('/api/meetings', { title: 'Open admission check', lobby: false })
  ).id;
  assert.equal((await guest.call(`/api/meetings/${openRoom}/join`, {})).status, 'admitted');
  await host.call(`/api/meetings/${openRoom}/actions`, { type: 'lobby', enabled: true });
  assert.equal((await outsider.call(`/api/meetings/${openRoom}/join`, {})).status, 'waiting');
  await host.call(`/api/meetings/${openRoom}/actions`, { type: 'end' });
  console.log('PASS waiting room setting controls admission of new guests');
  const csrf = await fetch(base + '/api/meetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://evil.example',
      Cookie: host.cookie,
    },
    body: JSON.stringify({ title: 'Evil' }),
  });
  assert.equal(csrf.status, 403);
  console.log('PASS cross-origin write rejection');
  const account = new Client(),
    email = `integration-${Date.now()}@example.test`;
  await account.call('/api/auth', {
    mode: 'register',
    email,
    password: 'a strong integration password',
    name: 'Account tester',
  });
  const login = new Client();
  await login.call(
    '/api/auth',
    { mode: 'login', email, password: 'a wrong integration password' },
    401,
  );
  await login.call('/api/auth', {
    mode: 'login',
    email,
    password: 'a strong integration password',
  });
  assert.equal((await login.call('/api/session')).person.account, true);
  await login.call('/api/session', undefined, 200, 'DELETE');
  assert.equal((await login.call('/api/session')).person, null);
  console.log('PASS account authentication and revocation');
  console.log('All multi-user integration scenarios passed.');
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
