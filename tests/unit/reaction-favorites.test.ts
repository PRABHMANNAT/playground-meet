import { expect, it } from 'vitest';
import { defaultFavorites, readFavorites } from '../../src/lib/reaction-library';
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
