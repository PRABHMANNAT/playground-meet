import { parseBrowserUrl } from './browser-url';

export const maxSearchResults = 6;
export const maxSearchQuery = 240;
export type BrowserSearch = {
  query: string;
  results: { title: string; url: string; snippet: string }[];
};

function extractText(parts: unknown, limit: number) {
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.value === 'string' ? part.value : ''))
    .join('')
    .trim()
    .slice(0, limit);
}

export async function searchWeb(query: string, signal: AbortSignal): Promise<BrowserSearch> {
  const url = new URL('https://api.mwmbl.org/search/');
  url.searchParams.set('s', query);
  const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('Search unavailable');
  const hits: unknown = await response.json();
  if (!Array.isArray(hits)) throw new Error('Unexpected search response');
  const results: BrowserSearch['results'] = [];
  for (const hit of hits) {
    const target = typeof hit?.url === 'string' && parseBrowserUrl(hit.url);
    if (!target || results.some((result) => result.url === target.href)) continue;
    results.push({
      title: extractText(hit.title, 240) || target.hostname,
      url: target.href,
      snippet: extractText(hit.extract, 320),
    });
    if (results.length === maxSearchResults) break;
  }
  return { query, results };
}
