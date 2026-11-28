import { expect, test, vi } from 'vitest';
import { browser } from '../../src/lib/actions/browser';
import { maxSearchResults, searchWeb } from '../../src/lib/browser-search';
import { actionInput } from '../../src/lib/schemas';
import { context } from './fixtures';

const share = {
  type: 'browser-search' as const,
  query: 'Space',
  results: [{ url: 'https://example.com/', title: 'Space', snippet: 'An introduction.' }],
};

test('publishing stores a snapshot and only its presenter or host can withdraw the current share', async () => {
  const ctx = context();
  await browser(ctx, share);
  const first = ctx.room.state.browserSearch!;
  expect(first).toMatchObject({
    query: share.query,
    results: share.results,
    sharedBy: ctx.person.id,
  });
  const viewer = { ...ctx, person: { ...ctx.person, id: 'viewer' } };
  await expect(
    browser(viewer, { type: 'browser-stop-search', shareId: first.id }),
  ).rejects.toMatchObject({ status: 403 });
  await browser(ctx, share);
  await expect(
    browser(ctx, { type: 'browser-stop-search', shareId: first.id }),
  ).rejects.toMatchObject({ status: 409 });
  await browser(
    { ...ctx, person: { ...ctx.person, id: ctx.room.host } },
    { type: 'browser-stop-search', shareId: ctx.room.state.browserSearch!.id },
  );
  expect(ctx.room.state.browserSearch).toBeNull();
});

test('shared search payloads require bounded results and public HTTPS links', () => {
  expect(actionInput.safeParse(share).success).toBe(true);
  for (const results of [
    [],
    Array(maxSearchResults + 1).fill(share.results[0]),
    [{ ...share.results[0], url: 'http://localhost:3000' }],
  ]) {
    expect(actionInput.safeParse({ ...share, results }).success).toBe(false);
  }
});

test('web results retain provider order, join text fragments and skip duplicate or private URLs', async () => {
  const hit = {
    url: 'https://example.com/',
    title: [{ value: 'Near' }, { value: ' Earth' }],
    extract: [{ value: 'Space' }],
  };
  const fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(Response.json([null, { ...hit, url: 'https://127.0.0.1' }, hit, hit]));
  try {
    const result = await searchWeb('space & time', new AbortController().signal);
    expect(result.results).toEqual([{ url: hit.url, title: 'Near Earth', snippet: 'Space' }]);
    expect(String(fetch.mock.calls[0][0])).toBe('https://api.mwmbl.org/search/?s=space+%26+time');
  } finally {
    fetch.mockRestore();
  }
});
