import { test, expect } from 'vitest';
import { actionInput, credentials, roomInput, safeUrl } from '../../src/lib/schemas';
test('invalid review protocols never become clickable product links', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,evil', 'http://example.com'])
    expect(safeUrl.safeParse(url).success).toBe(false);
  expect(safeUrl.safeParse('https://example.com').success).toBe(true);
});
test('unbounded or unknown commands cannot enter room state', () => {
  for (const command of [
    { type: 'admin' },
    { type: 'chat', text: 'x'.repeat(2001) },
    { type: 'reaction', emoji: '💣' },
    { type: 'rating', rating: 6, text: '' },
    { type: 'timer', seconds: -1 },
    { type: 'timer', seconds: 3601 },
  ])
    expect(actionInput.safeParse(command).success).toBe(false);
});
test('shared browser accepts only public-looking HTTPS URLs or a stop request', () => {
  for (const url of [
    'javascript:alert(1)',
    'http://example.com',
    'https://localhost',
    'https://app.local',
    'https://127.0.0.1/',
    'https://0x7f000001',
    'https://[::1]/',
    'https://name:password@example.com/',
    'https://example.com:8443/',
  ])
    expect(actionInput.safeParse({ type: 'browser', url }).success).toBe(false);
  expect(actionInput.parse({ type: 'browser', url: 'https://example.com' })).toEqual({
    type: 'browser',
    url: 'https://example.com/',
  });
  expect(actionInput.parse({ type: 'browser', url: null })).toEqual({ type: 'browser', url: null });
});
test('account and room creation enforce usable limits', () => {
  expect(credentials.safeParse({ email: 'bad', password: 'short' }).success).toBe(false);
  expect(roomInput.safeParse({ title: '   ' }).success).toBe(false);
  expect(roomInput.parse({ title: '  Test  ' }).title).toBe('Test');
});
