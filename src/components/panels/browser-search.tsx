'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, Globe, Search, Share2 } from 'lucide-react';
import { resolveBrowserInput } from '@/lib/browser-destination';
import { maxSearchQuery, searchWeb, type BrowserSearch } from '@/lib/browser-search';
import { parseBrowserUrl } from '@/lib/browser-url';
import type { PanelProps } from './types';

type Preview = { search: BrowserSearch } | { url: string };

export function BrowserSearchPanel({
  data,
  host,
  send,
  address,
  setAddress,
  renderPage,
  visible,
}: PanelProps & {
  address: string;
  setAddress: (address: string) => void;
  renderPage: (url: string) => ReactNode;
  visible: boolean;
}) {
  const shared = data.meeting.state.browserSearch;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [privateFor, setPrivateFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const current = useRef<AbortController | null>(null);
  useEffect(() => () => current.current?.abort(), []);
  useEffect(() => {
    if (!visible) setPrivateFor(null);
  }, [visible]);
  const showShared = !!shared && privateFor !== shared.id;
  const query = address.trim();
  const destination = resolveBrowserInput(query);
  const isSearch = destination?.kind === 'search';

  async function browse() {
    current.current?.abort();
    current.current = null;
    setError('');
    setBusy(false);
    if (!destination) return;
    setPrivateFor(shared?.id ?? null);
    setPreview(null);
    if (!isSearch) {
      const page = parseBrowserUrl(destination.url);
      if (page) setPreview({ url: page.href });
      else setError('Enter a public HTTPS address to preview a website in Meet.');
      return;
    }
    if (query.length > maxSearchQuery) {
      setError(`Keep your search under ${maxSearchQuery + 1} characters.`);
      return;
    }
    const controller = new AbortController();
    current.current = controller;
    setBusy(true);
    try {
      const search = await searchWeb(
        query,
        AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
      );
      if (!controller.signal.aborted) setPreview({ search });
    } catch {
      if (!controller.signal.aborted) setError('Search is unavailable. Try again.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function publish(search: BrowserSearch) {
    setSending(true);
    try {
      if (await send({ type: 'browser-search', ...search })) setPrivateFor(null);
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="browser-search-panel" aria-label="Search in Meet">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void browse();
        }}
      >
        <label htmlFor="browser-launch-address">Website or search</label>
        <div className="browser-query-field">
          <input
            id="browser-launch-address"
            value={address}
            maxLength={2000}
            placeholder="Enter an address or search the web"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setAddress(event.target.value)}
          />
          <button className="button primary small" disabled={!destination}>
            <Search size={15} /> {isSearch || !query ? 'Search' : 'Preview'}
          </button>
        </div>
      </form>
      {query && !destination && (
        <p className="error-message" role="alert">
          Enter a website address or search words.
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p className="panel-helper" role="status">
          Searching the web…
        </p>
      )}
      {shared && !showShared && (
        <button className="text-button" onClick={() => setPrivateFor(null)}>
          View shared search
        </button>
      )}
      {showShared && shared ? (
        <SearchList
          key={shared.id}
          search={shared}
          by={shared.name}
          renderPage={renderPage}
          visible={visible}
          actions={
            <>
              {(host || shared.sharedBy === data.me.id) && (
                <button
                  className="text-button"
                  disabled={sending}
                  onClick={async () => {
                    setSending(true);
                    try {
                      await send({ type: 'browser-stop-search', shareId: shared.id });
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  Stop sharing
                </button>
              )}
              {preview && (
                <button className="text-button" onClick={() => setPrivateFor(shared.id)}>
                  My preview
                </button>
              )}
            </>
          }
        />
      ) : (
        preview &&
        ('search' in preview ? (
          <SearchList
            key={preview.search.query}
            search={preview.search}
            renderPage={renderPage}
            visible={visible}
            actions={
              preview.search.results.length > 0 && (
                <button
                  className="button primary small"
                  disabled={sending}
                  onClick={() => void publish(preview.search)}
                >
                  <Share2 size={14} /> Share to all
                </button>
              )
            }
          />
        ) : (
          visible && renderPage(preview.url)
        ))
      )}
    </section>
  );
}

function SearchList({
  search,
  by,
  actions,
  renderPage,
  visible,
}: {
  search: BrowserSearch;
  by?: string;
  actions: ReactNode;
  renderPage: (url: string) => ReactNode;
  visible: boolean;
}) {
  const [page, setPage] = useState<string | null>(null);
  return (
    <section
      className="search-sheet"
      aria-label={by ? 'Shared search results' : 'Private search results'}
    >
      <header>
        <small>{by ? 'Shared by ' + by : 'Only you'} · Mwmbl</small>
        <h3>{search.query}</h3>
        <div className="browser-launch-actions">{actions}</div>
      </header>
      {page ? (
        <>
          <button className="text-button" onClick={() => setPage(null)}>
            <ArrowLeft size={14} /> Back to results
          </button>
          {visible && renderPage(page)}
        </>
      ) : search.results.length ? (
        <ol>
          {search.results.map((result) => (
            <li key={result.url}>
              <button className="search-hit" onClick={() => setPage(result.url)}>
                <small>
                  <Globe size={12} />
                  {new URL(result.url).hostname}
                </small>
                <strong>
                  {result.title} <ChevronRight size={13} />
                </strong>
                {result.snippet && <span>{result.snippet}</span>}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="panel-helper">No results. Try a different search.</p>
      )}
    </section>
  );
}
