import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import photoPacks from '../../src/lib/photo-stickers.json';
import { actionInput } from '../../src/lib/schemas';
import { expect, it } from 'vitest';
import {
  defaultFavorites,
  readFavorites,
  reactionNames,
  reactionPacks,
  stickerImage,
  stickerLabel,
  studioGroups,
} from '../../src/lib/reaction-library';
it('shows three defaults and restores at most six unique library items', () => {
  expect(readFavorites(null)).toEqual(defaultFavorites);
  expect(readFavorites('broken')).toEqual(defaultFavorites);
  expect(readFavorites('[]')).toEqual([]);
  expect(
    readFavorites(
      JSON.stringify([
        'jensen',
        'jensen',
        'constructor',
        'bad',
        'elon',
        'laughing',
        'ship',
        'hotfix',
        'build',
        'docker',
      ]),
    ),
  ).toEqual(['jensen', 'elon', 'laughing', 'ship', 'hotfix', 'build']);
});

it('keeps pinned logo IDs and ships transparent WebP artwork for the expanded packs', () => {
  expect(Object.keys(reactionPacks['Hardware & tech'])).toHaveLength(105);
  expect(Object.keys(reactionPacks['Developer logos'])).toHaveLength(111);
  for (const id of [
    'github',
    'gitlab',
    'docker',
    'python',
    'react',
    'rust',
    'linux',
    'typescript',
    'figma',
    'vercel',
    'kubernetes',
  ]) {
    expect(readFavorites(JSON.stringify([id]))).toEqual([id]);
    expect(stickerImage(id)).toBe('/reactions/tech-3d/' + id + '.webp');
  }
  const hashes = new Set<string>();
  for (const id of Object.keys(reactionNames)) {
    const path = stickerImage(id);
    if (!path) continue;
    const bytes = readFileSync('public' + path);
    expect(bytes.toString('ascii', 8, 12), id).toBe('WEBP');
    // Lossy WebP carries transparency in ALPH. Lossless WebP uses bit 28 of its image header.
    const alpha =
      bytes.includes(Buffer.from('ALPH')) ||
      (bytes.toString('ascii', 12, 16) === 'VP8L' && !!(bytes[24] & 0x10));
    if (!Object.hasOwn(photoPacks['City postcards'], id)) expect(alpha, id).toBe(true);
    if (path.includes('/tech-3d/')) hashes.add(createHash('sha256').update(bytes).digest('hex'));
  }
  expect(hashes.size).toBe(216);
});

it('ships 80 tech avatars and 20 world leader avatars with distinct artwork', () => {
  expect(Object.keys(studioGroups['Tech figures'])).toHaveLength(80);
  expect(Object.keys(studioGroups['World leaders'])).toHaveLength(20);
  const ids = Object.keys(reactionPacks['Studio stickers']);
  expect(ids).toHaveLength(100);
  const hashes = new Set<string>();
  for (const id of ids) {
    expect(actionInput.safeParse({ type: 'chat', sticker: id }).success, id).toBe(true);
    hashes.add(
      createHash('sha256')
        .update(readFileSync('public' + stickerImage(id)))
        .digest('hex'),
    );
  }
  expect(hashes.size).toBe(100);
  for (const id of ['laughing', 'ship', 'hotfix', 'build']) {
    expect(reactionPacks['Meeting memes']).toHaveProperty(id);
    expect(readFavorites(JSON.stringify([id]))).toEqual([id]);
  }
});

it('ships at least 250 selectable reactions with matching artwork and valid event IDs', () => {
  const ids = Object.keys(reactionNames);
  expect(ids.length).toBeGreaterThanOrEqual(250);
  for (const id of ids) {
    expect(actionInput.safeParse({ type: 'reaction', emoji: id }).success, id).toBe(true);
    const image = stickerImage(id);
    if (image) expect(existsSync('public' + image), image).toBe(true);
  }
});

it('ships the expanded city and people packs with distinct credited photos usable in chat and reactions', () => {
  const credits = readFileSync('public/reactions/photos/credits.html', 'utf8');
  const ids = Object.values(photoPacks).flatMap(Object.keys);
  const hashes = new Set<string>();
  expect(Object.keys(photoPacks['City postcards'])).toHaveLength(58);
  expect(Object.keys(photoPacks['People & punchlines'])).toHaveLength(53);
  expect(ids).toHaveLength(168);
  for (const sticker of ids) {
    expect(credits).toContain('id="' + sticker + '"');
    expect(actionInput.safeParse({ type: 'chat', sticker }).success).toBe(true);
    hashes.add(
      createHash('sha256')
        .update(readFileSync('public' + stickerImage(sticker)))
        .digest('hex'),
    );
  }
  expect(hashes.size).toBe(168);
});

it('retires Gopher memes from selection and sending while rendering existing messages', () => {
  expect(Object.hasOwn(reactionPacks, 'Gopher memes')).toBe(false);
  expect(Object.keys(reactionNames).some((id) => id.startsWith('go-'))).toBe(false);
  expect(readFavorites('["go-gamer","elon"]')).toEqual(['elon']);
  expect(actionInput.safeParse({ type: 'chat', sticker: 'go-gamer' }).success).toBe(false);
  expect(actionInput.safeParse({ type: 'reaction', emoji: 'go-gamer' }).success).toBe(false);
  expect(stickerLabel('go-gamer')).toBe('One more level');
  expect(existsSync('public' + stickerImage('go-gamer'))).toBe(true);
});
