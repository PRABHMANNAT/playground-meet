import { expect, test } from 'vitest';
import { meetingPath, meetingInviteUrl, parseMeetingLink } from '../../src/lib/meeting-links';

const id = 'abcdef-123456-fedcba';
test('all generated meeting and recap URLs include playground-meet on any host', () => {
  expect(meetingPath(id)).toBe(`/playground-meet/${id}`);
  expect(meetingPath(id, true)).toBe(`/playground-meet/${id}/recap`);
  for (const origin of [
    'http://localhost:3000',
    'https://preview.vercel.app',
    'https://meet.example.com',
  ]) {
    const invite = meetingInviteUrl(id, `${origin}/room/${id}/recap?secret=discard#fragment`);
    expect(invite).toBe(`${origin}/playground-meet/${id}`);
    expect(parseMeetingLink(invite)).toBe(id);
  }
  expect(() => meetingPath('../privacy')).toThrow();
});

test('joining accepts shared invites, recap links, legacy links and bare codes', () => {
  for (const input of [
    id,
    ` ${id} `,
    `/playground-meet/${id}`,
    `/room/${id}`,
    `https://meet.example.com/playground-meet/${id}/?from=invite#preview`,
    `https://old.example.com/room/${id}/recap`,
    `/playground-meet/${id}/recap`,
  ]) {
    expect(parseMeetingLink(input)).toBe(id);
  }
});

test('unrelated URLs, malformed codes and unsafe schemes cannot become meeting links', () => {
  for (const input of [
    '',
    'https://example.com/privacy',
    `https://example.com/other/${id}`,
    `https://example.com/playground-meet/${id}/unknown`,
    `javascript:alert(1)`,
    `ftp://example.com/room/${id}`,
    '/playground-meet/invalid',
    `//evil.example/room/${id}`,
  ]) {
    expect(parseMeetingLink(input)).toBe('');
  }
});
