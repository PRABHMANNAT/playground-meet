import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { base, Client } from './helpers/client';
import { attachmentChunkBytes, maxAttachmentBytes } from '../src/lib/attachments';
import { defaultFavorites, reactionNames } from '../src/lib/reaction-library';

async function main() {
  const host = new Client(),
    guest = new Client();
  await host.call('/api/session', { name: 'File test host' });
  const { person } = await guest.call('/api/session', { name: 'File test guest' });
  const { id } = await host.call('/api/meetings', {
    title: 'Attachment verification',
    lobby: true,
  });
  const room = '/api/meetings/' + id;
  const uploads = room + '/attachments';
  const bytes = randomBytes(attachmentChunkBytes + 17);
  const metadata = { name: 'Résumé 📄.pdf', size: bytes.length };
  const { file } = await host.call(uploads, metadata);
  const url = base + uploads + '/' + file;
  await host.call(uploads, { name: 'folder/doc.pdf', size: 10 }, 400);
  await host.call(uploads, { name: 'large.docx', size: maxAttachmentBytes + 1 }, 413);
  await host.call(uploads, { name: 'limit.docx', size: maxAttachmentBytes });
  await guest.call(room + '/join', {});
  await guest.call(uploads, metadata, 403);
  assert.equal((await fetch(url, { headers: { Cookie: guest.cookie } })).status, 403);
  await host.call(room + '/actions', { type: 'admit', memberId: person.id });
  async function part(offset: number, chunk: Buffer, client = host) {
    return fetch(url, {
      method: 'PUT',
      headers: { Origin: base, Cookie: client.cookie, 'X-File-Offset': String(offset) },
      body: new Uint8Array(chunk),
    });
  }
  const first = bytes.subarray(0, attachmentChunkBytes),
    last = bytes.subarray(attachmentChunkBytes);
  assert.equal((await part(0, first, guest)).status, 404);
  assert.equal((await part(attachmentChunkBytes, last)).status, 409);
  assert.equal((await part(0, first)).status, 200);
  assert.equal((await fetch(url, { headers: { Cookie: guest.cookie } })).status, 404);
  assert.equal((await part(attachmentChunkBytes, last)).status, 200);
  assert.equal((await part(attachmentChunkBytes, last)).status, 200);
  const download = await fetch(url, { headers: { Cookie: guest.cookie } });
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition')!, /^attachment;/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
  for (const emoji of [...defaultFavorites, 'nvidia', 'docker'])
    await host.call(room + '/actions', { type: 'reaction', emoji });
  const snapshot = await guest.call(room + '/state');
  assert.equal(snapshot.events.filter((e: { kind: string }) => e.kind === 'attachment').length, 1);
  assert.ok(
    snapshot.events.some(
      (e: { kind: string; payload: { emoji: string } }) =>
        e.kind === 'reaction' && e.payload.emoji === 'docker',
    ),
  );
  for (const id of Object.keys(reactionNames).filter(
    (id) => !['ship', 'hotfix', 'build'].includes(id),
  )) {
    assert.equal(
      (await fetch(base + '/reactions/' + id + (defaultFavorites.includes(id) ? '.webp' : '.svg')))
        .status,
      200,
      id,
    );
  }
  await host.call(room + '/actions', { type: 'end' });
  console.log(
    'PASS file limits, access, multi-chunk transfer, retry, downloads, reactions and artwork',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
