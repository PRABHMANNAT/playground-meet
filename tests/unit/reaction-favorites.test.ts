import { existsSync } from 'node:fs';
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
