import stickerPacks from './sticker-packs.json';
import photoPacks from './photo-stickers.json';
import technologyPacks from './technology-stickers.json';
import studioStickers from './studio-stickers.json';
export const reactionPacks = {
  ...photoPacks,
  'Studio stickers': {
    jensen: 'Jensen Huang approves',
    elon: 'Elon Musk eyebrow raise',
    laughing: 'Laughing terminal',
    ship: 'Ship it',
    hotfix: 'Hotfix',
    build: 'Build passed',
    ...studioStickers,
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
  if (!Object.hasOwn(reactionNames, id) || ['ship', 'build', 'hotfix'].includes(id)) return null;
  if (id.startsWith('photo-')) return '/reactions/photos/' + id + '.webp';
  if (Object.hasOwn(studioStickers, id)) return '/reactions/studio/' + id + '.webp';
  if (
    Object.hasOwn(technologyPacks['Hardware & tech'], id) ||
    Object.hasOwn(technologyPacks['Developer logos'], id)
  )
    return '/reactions/tech-3d/' + id + '.webp';
  if (id.startsWith('go-') || id.startsWith('fl-')) return '/reactions/packs/' + id + '.webp';
  return '/reactions/' + id + (defaultFavorites.includes(id) ? '.webp' : '.svg');
}
