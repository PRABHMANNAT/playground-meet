import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import photoPacks from '../../src/lib/photo-stickers.json';
import { actionInput } from '../../src/lib/schemas';
import { expect, it } from 'vitest';
import {
  defaultFavorites,
  readFavorites,
  reactionNames,
  stickerImage,
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

it('ships at least 250 selectable reactions with matching artwork and valid event IDs', () => {
  const ids = Object.keys(reactionNames);
  expect(ids.length).toBeGreaterThanOrEqual(250);
  for (const id of ids) {
    expect(actionInput.safeParse({ type: 'reaction', emoji: id }).success, id).toBe(true);
    const image = stickerImage(id);
    if (image) expect(existsSync('public' + image), image).toBe(true);
  }
});

it('ships 100 distinct credited photo stickers usable in chat and reactions', () => {
  const credits = readFileSync('public/reactions/photos/credits.html', 'utf8');
  const ids = Object.values(photoPacks).flatMap(Object.keys);
  const hashes = new Set<string>();
  expect(ids).toHaveLength(100);
  for (const sticker of ids) {
    expect(credits).toContain('id="' + sticker + '"');
    expect(actionInput.safeParse({ type: 'chat', sticker }).success).toBe(true);
    hashes.add(
      createHash('sha256')
        .update(readFileSync('public' + stickerImage(sticker)))
        .digest('hex'),
    );
  }
  expect(hashes.size).toBe(100);
});
