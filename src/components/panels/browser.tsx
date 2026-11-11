'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, Globe, Plus, Search, Share2, X } from 'lucide-react';
import { maxBrowserUrl, parseBrowserUrl } from '@/lib/browser-url';
import { BrowserAnnotations } from './browser-annotations';
import type { PanelProps } from './types';

type SearchResult = { pageid: number; title: string };
const looksLikeAddress = /^(?:[a-z][\w+.-]*:|[^\s/]+\.[^\s/]+)/i;

const maxTabs = 5;

export function BrowserPanel(props: PanelProps) {
  const [tabs, setTabs] = useState([{ id: 1, title: 'New tab' }]);
  const [selected, setSelected] = useState(1);
  const nextId = useRef(2);

  function closeTab(id: number) {
    const index = tabs.findIndex((tab) => tab.id === id);
    if (tabs.length === 1) return;
    if (selected === id) setSelected(tabs[index + 1]?.id ?? tabs[index - 1].id);
    setTabs((items) => items.filter((item) => item.id !== id));
  }

  return (
    <div className="stack browser-panel">
      <div className="browser-tabs" role="group" aria-label="Browser tabs">
        {tabs.map(({ id, title }) => (
          <div className="browser-tab" key={id} data-selected={selected === id}>
            <button
              type="button"
              aria-pressed={selected === id}
              title={title}
              onClick={() => setSelected(id)}
            >
              <Globe size={14} /> <span>{title}</span>
            </button>
            {tabs.length > 1 && (
              <button
                type="button"
                className="browser-tab-close"
                aria-label={'Close ' + title + ' tab'}
                onClick={() => closeTab(id)}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="icon-button"
          aria-label="Add browser tab"
          title={tabs.length >= maxTabs ? 'Maximum 5 tabs' : 'Add browser tab'}
          disabled={tabs.length >= maxTabs}
          onClick={() => {
            const id = nextId.current++;
            setTabs((items) => [...items, { id, title: 'New tab' }]);
            setSelected(id);
          }}
        >
          <Plus size={17} />
        </button>
      </div>
      {tabs.map(({ id }) => (
        <div key={id} hidden={selected !== id}>
          <BrowserTab
            {...props}
            onTitle={(title) => {
              setTabs((items) => items.map((item) => (item.id === id ? { ...item, title } : item)));
            }}
          />
        </div>
      ))}
    </div>
  );
}

function BrowserTab({
  data,
  host,
  send,
  onTitle,
}: PanelProps & { onTitle: (title: string) => void }) {
  const inputId = useId();
  const [address, setAddress] = useState('');
  const [preview, setPreview] = useState<{ url: string; shared: boolean } | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [sharing, setSharing] = useState(false);
  const activeSearch = useRef<AbortController | null>(null);
  const shared = data.meeting.state.browser;
  const current = preview && (!preview.shared || preview.url === shared?.url) ? preview.url : '';
  const target = parseBrowserUrl(current);
  const query = address.trim();
  const activeShare = shared && target?.href === shared.url ? shared : null;
  const canManageShare = host || shared?.sharedBy === data.me.id;
  const frame = target && (
    <iframe
      key={target.href}
      title={'Preview of ' + target.hostname}
      src={target.href}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
    />
  );
  useEffect(() => () => activeSearch.current?.abort(), []);

  function openPage(url: string, fromShare = false) {
    activeSearch.current?.abort();
    setSearching(false);
    setResults(null);
    setError('');
    setAddress(url);
    onTitle(new URL(url).hostname);
    setPreview({ url, shared: fromShare });
  }

  async function openOrSearch() {
    setError('');
    setResults(null);
    activeSearch.current?.abort();
    if (looksLikeAddress.test(query) && (!/\s/.test(query) || /^[a-z][\w+.-]*:/i.test(query))) {
      const url = parseBrowserUrl(/^[a-z][\w+.-]*:/i.test(query) ? query : `https://${query}`);
      if (url) openPage(url.href);
      else setError('Enter a public HTTPS page URL.');
      return;
    }

    setPreview(null);
    onTitle(query);
    const controller = new AbortController();
    activeSearch.current = controller;
    setSearching(true);
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
      const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.query?.search)) throw new Error('Search failed');
      if (!controller.signal.aborted) setResults(payload.query.search);
    } catch {
      if (!controller.signal.aborted) setError('Wikipedia search is unavailable. Try web search.');
    } finally {
      if (activeSearch.current === controller) setSearching(false);
    }
  }

  async function share(url: string | null) {
    setSharing(true);
    try {
      await send({ type: 'browser', url });
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="stack">
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (query) void openOrSearch();
        }}
      >
        <label htmlFor={inputId}>Page address or search</label>
        <div className="browser-address">
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={maxBrowserUrl}
            placeholder="example.com or a search topic"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
          <button className="button primary" disabled={!query || searching}>
            <Search size={15} /> {searching ? 'Searching…' : 'Go'}
          </button>
        </div>
        <div className="browser-row">
          <p className="panel-helper">Search Wikipedia here, or search the web in a new tab.</p>
          {query && (
            <a
              className="text-button"
              href={`https://duckduckgo.com/?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Search web <ExternalLink size={13} />
            </a>
          )}
        </div>
      </form>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {shared && (
        <section className="browser-shared" aria-label="Shared page">
          <div className="browser-shared-info">
            <strong>Shared by {shared.name}</strong>
            <span title={shared.url}>{shared.url}</span>
          </div>
          <div className="browser-row">
            <button className="button secondary small" onClick={() => openPage(shared.url, true)}>
              View page
            </button>
            {canManageShare && (
              <button
                className="button secondary small"
                disabled={sharing}
                onClick={() => void share(null)}
              >
                Stop sharing
              </button>
            )}
          </div>
        </section>
      )}
      {results && (
        <section aria-label="Wikipedia search results" className="stack browser-results">
          <h3>Wikipedia results</h3>
          {results.length === 0 && <p className="panel-helper">No results found.</p>}
          {results.map(({ pageid, title }) => (
            <button
              key={pageid}
              className="button secondary"
              onClick={() => openPage(`https://en.wikipedia.org/?curid=${pageid}`)}
            >
              <span>{title}</span>
              <Globe size={16} />
            </button>
          ))}
        </section>
      )}
      {target ? (
        <section className="stack browser-preview" aria-label="Page preview">
          <div className="browser-row browser-preview-toolbar">
            <strong title={target.href}>{target.hostname}</strong>
            <div className="browser-row">
              <a
                className="button secondary small"
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in tab <ExternalLink size={14} />
              </a>
              <button
                className="button primary small"
                disabled={sharing || !!activeShare?.id}
                onClick={() => void share(target.href)}
              >
                <Share2 size={14} /> {activeShare?.id ? 'Shared' : 'Share page'}
              </button>
            </div>
          </div>
          {activeShare?.id ? (
            <BrowserAnnotations
              key={activeShare.id}
              shareId={activeShare.id}
              strokes={activeShare.annotations ?? []}
              canClear={canManageShare}
              send={send}
            >
              {frame}
            </BrowserAnnotations>
          ) : (
            frame
          )}
          <p className="panel-helper">
            If the preview is blocked, open the page in a tab. To show your clicks and scrolling,
            use Screen share. Annotations mark the preview area, so keep the same scroll position.
          </p>
        </section>
      ) : (
        !results &&
        !searching &&
        !shared && (
          <p className="panel-helper browser-empty">
            <Globe size={20} /> Open a page, then share it with the meeting.
          </p>
        )
      )}
    </div>
  );
}
