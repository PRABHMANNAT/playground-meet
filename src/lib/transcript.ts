import type { Event } from './types';

export const finalCaptionWindow = 8000;

// Prefer explicit agreements, dates and follow-ups. Quote the speaker's words verbatim.
export function transcriptHighlights(events: Event[], limit = 5) {
  const seen = new Set<string>();
  return events
    .filter((e) => {
      if (e.kind !== 'transcript') return false;
      const text = String(e.payload.text).trim().toLowerCase();
      if (text.split(/\s+/).length < 4 || seen.has(text)) return false;
      seen.add(text);
      return true;
    })
    .map((event) => {
      const text = String(event.payload.text);
      const score = [
        /\b(agreed?|decision|decided|approved?|confirmed?)\b/i,
        /\b(next|follow up|will|deadline|owner|by friday|due)\b/i,
        /\b(blocked|risk|issue|release|launch|ship|customer)\b/i,
      ].filter((pattern) => pattern.test(text)).length;
      return { event, score };
    })
    .sort((a, b) => b.score - a.score || a.event.id - b.event.id)
    .slice(0, limit)
    .map(({ event }) => event)
    .sort((a, b) => a.id - b.id);
}
