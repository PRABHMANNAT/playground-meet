import assert from 'node:assert/strict';
import { Client, base } from './helpers/client';
import type { Snapshot } from '../src/lib/types';

export async function verifyDirectChat() {
  const host = new Client(),
    sender = new Client(),
    viewer = new Client(),
    outside = new Client();
  const [, a, b, c] = await Promise.all(
    [host, sender, viewer, outside].map((client, index) =>
      client.call('/api/session', { name: 'Chat tester ' + index }),
    ),
  );
  const { id } = await host.call('/api/meetings', {
    title: 'Direct chat verification',
    lobby: false,
  });
  const room = '/api/meetings/' + id;
  try {
    for (const client of [sender, viewer]) await client.call(room + '/join', {});
    const recipient = b.person.id;
    const chat = (message: object, status = 200) =>
      sender.call(room + '/actions', { type: 'chat', ...message }, status);
    await chat({ text: 'Room-wide hello' });
    await chat({ text: 'Direct hello', recipient });
    await chat({ sticker: 'photo-donald-trump-poker-face', recipient });
    await chat({
      location: { label: 'Sydney Opera House', latitude: -33.8572, longitude: 151.2153 },
      recipient,
    });
    await chat({ text: 'Invalid', recipient: c.person.id }, 400);
    await chat({ text: 'Invalid', recipient: a.person.id }, 400);
    await chat({ location: { label: 'Invalid', latitude: 999, longitude: 0 } }, 400);

    const uploads = room + '/attachments';
    const bytes = new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0]);
    const metadata = { name: 'Direct preview.gif', size: bytes.length };
    await sender.call(uploads, { ...metadata, recipient: c.person.id }, 400);
    const { file } = await sender.call(uploads, { ...metadata, recipient });
    const fileUrl = base + uploads + '/' + file;
    const upload = await fetch(fileUrl, {
      method: 'PUT',
      headers: { Origin: base, Cookie: sender.cookie, 'X-File-Offset': '0' },
      body: bytes,
    });
    assert.equal(upload.status, 200);
    for (const client of [sender, viewer, host]) {
      const state: Snapshot = await client.call(room + '/state');
      assert.ok(state.events.some((e) => e.payload.text === 'Room-wide hello'));
      const privateEvents = state.events.filter((e) => e.payload.recipient === recipient);
      assert.equal(privateEvents.length, client === host ? 0 : 4);
      if (client === host) {
        for (const value of [
          'Direct hello',
          'Sydney Opera House',
          'photo-donald-trump-poker-face',
          file,
        ])
          assert.ok(!JSON.stringify(state).includes(value));
      }
      for (const [url, method] of [
        [fileUrl, 'GET'],
        [fileUrl, 'HEAD'],
        [fileUrl + '?preview=1', 'GET'],
      ]) {
        const headers = { Cookie: client.cookie };
        const response = await fetch(url, { method, headers });
        assert.equal(response.status, client === host ? 404 : 200);
        if (method === 'GET' && client !== host)
          assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
      }
      const range = await fetch(fileUrl, {
        headers: { Cookie: client.cookie, Range: 'bytes=0-2' },
      });
      assert.equal(range.status, client === host ? 404 : 206);
    }
    const summary = await host.call(room + '/summary');
    assert.ok(!summary.markdown.includes('Direct hello'));
    await outside.call(room + '/state', undefined, 403);
    console.log(
      'PASS public and direct text, stickers, locations, recipient validation, private file metadata, previews, ranges and downloads',
    );
  } finally {
    await host.call(room + '/actions', { type: 'end' });
  }
}
