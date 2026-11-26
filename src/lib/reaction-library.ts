import stickerPacks from './sticker-packs.json';
import retiredStickers from './retired-stickers.json';
import photoPacks from './photo-stickers.json';
import technologyPacks from './technology-stickers.json';
import studioGroups from './studio-stickers.json';
export { studioGroups };
const illustratedMemes = {
  'meme-on-mute': "You're on mute",
  'meme-could-be-email': 'Could’ve been an email',
  'meme-one-last-slide': 'One last slide…',
  'meme-wifi-froze': 'I think you froze',
  'meme-screen-share': 'See my screen?',
  'meme-taking-notes': 'Taking notes!',
  'meme-hard-stop': 'Hard stop!',
  'meme-ship-it': 'Ship it!',
};
export const reactionPacks = {
  'Studio stickers': {
    ...studioGroups['Tech figures'],
    ...studioGroups['World leaders'],
  },
  ...photoPacks,
  'Meeting memes': {
    ...illustratedMemes,
    ...photoPacks['Meeting memes'],
    laughing: 'Laughing terminal',
    ship: 'Ship it',
    hotfix: 'Hotfix',
    build: 'Build passed',
  },
  ...stickerPacks,
  ...technologyPacks,
} as const;
export const reactionNames: Record<string, string> = Object.assign(
  {},
  ...Object.values(reactionPacks),
);
export const defaultFavorites = ['jensen', 'elon', 'laughing'];
export const legacyReactions = ['👏', '❤️', '🎉', '👍', '💡', '😂'];
export function stickerLabel(id: string) {
  if (Object.hasOwn(reactionNames, id)) return reactionNames[id];
  if (Object.hasOwn(retiredStickers, id))
    return retiredStickers[id as keyof typeof retiredStickers];
  return id;
}
export function validReaction(value: string) {
  return Object.hasOwn(reactionNames, value) || legacyReactions.includes(value);
}
export function readFavorites(raw: string | null): string[] {
  if (!raw) return defaultFavorites;
  try {
    const items: unknown = JSON.parse(raw);
    if (Array.isArray(items))
      return [
        ...new Set(
          items.filter(
            (id): id is string => typeof id === 'string' && Object.hasOwn(reactionNames, id),
          ),
        ),
      ].slice(0, 6);
  } catch {
    /* Use the defaults for unreadable preferences. */
  }
  return defaultFavorites;
}

export function stickerImage(id: string) {
  // Previously sent stickers remain readable after their pack leaves the library.
  if (Object.hasOwn(retiredStickers, id)) return '/reactions/packs/' + id + '.webp';
  if (!Object.hasOwn(reactionNames, id) || ['ship', 'build', 'hotfix'].includes(id)) return null;
  if (id.startsWith('photo-')) return '/reactions/photos/' + id + '.webp';
  if (Object.hasOwn(illustratedMemes, id)) return '/reactions/memes/' + id + '.webp';
  if (id.startsWith('studio-')) return '/reactions/studio/' + id + '.webp';
  if (
    Object.hasOwn(technologyPacks['Hardware & tech'], id) ||
    Object.hasOwn(technologyPacks['Developer logos'], id)
  )
    return '/reactions/tech-3d/' + id + '.webp';
  if (id.startsWith('fl-')) return '/reactions/packs/' + id + '.webp';
  return '/reactions/' + id + (defaultFavorites.includes(id) ? '.webp' : '.svg');
}
