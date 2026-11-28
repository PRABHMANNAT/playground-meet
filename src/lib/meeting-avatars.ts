const collections = [
  { id: 'vibrent', label: 'Vibrant', count: 27 },
  { id: '3d', label: '3D', count: 5 },
  { id: 'memo', label: 'Memo', count: 35 },
  { id: 'notion', label: 'Sketch', count: 15 },
  { id: 'teams', label: 'Teams', count: 9 },
  { id: 'toon', label: 'Toon', count: 10 },
  { id: 'upstream', label: 'Upstream', count: 22 },
] as const;

export type MeetingAvatar = `${(typeof collections)[number]['id']}_${number}`;
export const meetingAvatarAttribute = 'meetingAvatar';

export const avatarCollections = collections.map(({ id, label, count }) => ({
  id,
  label,
  options: Array.from({ length: count }, (_, index) => ({
    id: `${id}_${index + 1}` as MeetingAvatar,
    label: `${label} ${index + 1}`,
  })),
}));

const avatarIds = new Set<string>(
  avatarCollections.flatMap(({ options }) => options.map(({ id }) => id)),
);

export function isMeetingAvatar(value: unknown): value is MeetingAvatar {
  return typeof value === 'string' && avatarIds.has(value);
}

export function meetingAvatarSrc(avatar: MeetingAvatar) {
  return `/meeting-avatars/${avatar}.png`;
}
