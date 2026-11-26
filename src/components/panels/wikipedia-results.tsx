'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

type Result = { pageid: number; title: string };

export function WikipediaResults({ query, open }: { query: string; open: (url: string) => void }) {
  const [results, setResults] = useState<Result[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    let current = true;
    async function search() {
      try {
        const params = new URLSearchParams({
          action: 'query',
          list: 'search',
          srsearch: query,
          srlimit: '6',
          srprop: '',
          format: 'json',
          origin: '*',
        });
        const response = await fetch('https://en.wikipedia.org/w/api.php?' + params, {
          signal: controller.signal,
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        });
        if (!response.ok) throw new Error('Search unavailable');
        const payload = await response.json();
        if (!Array.isArray(payload.query?.search)) throw new Error('Invalid results');
        if (current) setResults(payload.query.search);
      } catch {
        if (current) setFailed(true);
      } finally {
        window.clearTimeout(timer);
      }
    }
    void search();
    return () => {
      current = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (failed)
    return (
      <p role="alert" className="error-message">
        Wikipedia search is unavailable. Reload to retry or use Search web.
      </p>
    );
  if (!results)
    return (
      <p className="panel-helper" role="status">
        Searching Wikipedia…
      </p>
    );
  return (
    <section aria-label="Wikipedia search results" className="stack browser-results">
      <h3>Wikipedia results</h3>
      {results.length === 0 && <p className="panel-helper">No results found.</p>}
      {results.map(({ pageid, title }) => (
        <button
          key={pageid}
          className="button secondary"
          onClick={() =>
            open('https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replaceAll(' ', '_')))
          }
        >
          <span>{title}</span>
          <Globe size={16} />
        </button>
      ))}
    </section>
  );
}
