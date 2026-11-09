export function duration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((v) => v[0])
      .join('')
      .toUpperCase() || '?'
  );
}
export function parseMeetingLink(input: string) {
  const text = input.trim();
  try {
    return new URL(text).pathname.split('/').filter(Boolean).at(-1) || '';
  } catch {
    return text.replace(/^.*\/room\//, '').split(/[?#]/)[0];
  }
}
