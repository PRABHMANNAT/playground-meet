import stickerPacks from './sticker-packs.json';
export const reactionPacks = {
  'Studio stickers': {
    jensen: 'Jensen Huang approves',
    elon: 'Elon Musk eyebrow raise',
    laughing: 'Laughing terminal',
    ship: 'Ship it',
    hotfix: 'Hotfix',
    build: 'Build passed',
  },
  ...stickerPacks,
  'Hardware & tech': {
    nvidia: 'NVIDIA',
    tesla: 'Tesla',
    amd: 'AMD',
    intel: 'Intel',
    raspberrypi: 'Raspberry Pi',
  },
  'Developer logos': {
    github: 'GitHub',
    gitlab: 'GitLab',
    docker: 'Docker',
    python: 'Python',
    react: 'React',
    rust: 'Rust',
    linux: 'Linux',
    typescript: 'TypeScript',
    figma: 'Figma',
    vercel: 'Vercel',
    kubernetes: 'Kubernetes',
  },
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
  if (id.startsWith('go-') || id.startsWith('fl-')) return '/reactions/packs/' + id + '.webp';
  return '/reactions/' + id + (defaultFavorites.includes(id) ? '.webp' : '.svg');
}
