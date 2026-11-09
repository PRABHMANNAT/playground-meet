import type { CSSProperties } from 'react';

const palettes = [
  ['#dce5d7', '#3d5137'],
  ['#dce3ed', '#42536b'],
  ['#ebdfd2', '#70583e'],
  ['#e6dfe8', '#65516d'],
  ['#d7e6e3', '#365951'],
  ['#ece3d4', '#6c5c3e'],
  ['#e9dce0', '#6d4857'],
] as const;

/** Stable, local monograms: no profile images or external avatar service needed. */
export function Avatar({
  name,
  size = 'small',
  status,
}: {
  name: string;
  size?: 'small' | 'large';
  status?: 'online' | 'away';
}) {
  const normalized = name.trim() || 'Guest';
  const words = normalized.split(/\s+/u);
  const letters = (
    words.length > 1
      ? Array.from(words[0])[0] + Array.from(words.at(-1)!)[0]
      : Array.from(normalized).slice(0, 2).join('')
  ).toLocaleUpperCase();
  const hash = Array.from(normalized.toLowerCase()).reduce(
    (sum, letter) => Math.imul(sum ^ letter.codePointAt(0)!, 16777619) >>> 0,
    2166136261,
  );
  const [background, foreground] = palettes[hash % palettes.length];
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ '--avatar-bg': background, '--avatar-fg': foreground } as CSSProperties}
      aria-hidden="true"
    >
      <span>{letters}</span>
      {status && <i className={`avatar-status ${status}`} />}
    </span>
  );
}
