'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Link2,
  MonitorUp,
  Plus,
  RefreshCw,
  Search,
  Share2,
  X,
} from 'lucide-react';
import { browserDestination } from '@/lib/browser-destination';
import { maxBrowserUrl, parseBrowserUrl } from '@/lib/browser-url';
import type { SharedState } from '@/lib/types';
import { BrowserAnnotations } from './browser-annotations';
import { WikipediaResults } from './wikipedia-results';
import type { PanelProps } from './types';

const maxTabs = 5;
export type BrowserTabId = number | 'shared';
export type BrowserControls = {
  selected: BrowserTabId;
  select: (id: BrowserTabId) => void;
  presenting: boolean;
  present: (surface?: 'window' | 'browser') => Promise<void>;
};
type SharedPage = NonNullable<SharedState['browser']>;
type Destination = { kind: 'page' | 'search'; value: string };
type Tab = { id: number; history: Destination[]; index: number };

function newTab(id: number): Tab {
  return { id, history: [], index: -1 };
}

function tabTitle(tab: Tab) {
  const entry = tab.history[tab.index];
  if (!entry) return 'New tab';
  return entry.kind === 'page' ? new URL(entry.value).hostname : entry.value;
}

export function BrowserPanel({
  data,
  host,
  send,
  controls,
  visible,
}: PanelProps & {
  controls: BrowserControls;
  visible: boolean;
}) {
  const [tabs, setTabs] = useState<Tab[]>(() => [newTab(1)]);
  const [pending, setPending] = useState(false);
  const [choosingTab, setChoosingTab] = useState(false);
  const [address, setAddress] = useState('');
  const [showLinks, setShowLinks] = useState(false);
  const destination = browserDestination(address);
  const [windows, setWindows] = useState(false);
  const [preferWindow, setPreferWindow] = useState(false);
  useEffect(() => { setWindows(/Windows/i.test(navigator.userAgent)); }, []);
  const nextId = useRef(2);
  const lastPersonal = useRef(1);
  const shared = data.meeting.state.browser;
  const { selected, select, presenting, present } = controls;
  const hasSharedPage = !!shared;
  const following = selected === 'shared' && hasSharedPage;
  const returnTab = tabs.some((tab) => tab.id === lastPersonal.current)
    ? lastPersonal.current
    : tabs[0].id;
  const selectedId = selected === 'shared' && !hasSharedPage ? returnTab : selected;
  const canStop = host || shared?.sharedBy === data.me.id;

  useEffect(() => {
    if (selected !== 'shared') lastPersonal.current = selected;
    else if (!hasSharedPage) select(returnTab);
  }, [selected, hasSharedPage, returnTab, select]);

  useEffect(() => {
    if (visible && selected === 'shared' && hasSharedPage) setShowLinks(true);
  }, [visible, selected, hasSharedPage]);

  function closeTab(id: number) {
    const index = tabs.findIndex((tab) => tab.id === id);
    if (tabs.length === 1) return;
    if (selectedId === id) select(tabs[index + 1]?.id ?? tabs[index - 1].id);
    setTabs((items) => items.filter((item) => item.id !== id));
  }

  async function share(url: string | null) {
    setPending(true);
    try {
      await send({ type: 'browser', url });
    } finally {
      setPending(false);
    }
  }

  function updateTab(id: number, update: (tab: Tab) => Tab) {
    setTabs((items) => items.map((tab) => (tab.id === id ? update(tab) : tab)));
  }

  return (
    <div className="stack browser-panel">
      <section className="browser-launch" aria-label="Browser window">
        <form onSubmit={e => {
          e.preventDefault();
          setPreferWindow(false);
          if (destination) window.open(destination, '_blank', 'noopener,noreferrer,popup,width=1100,height=760');
        }}>
          <label htmlFor="browser-launch-address">Website or search</label>
          <input id="browser-launch-address" value={address} maxLength={2000} placeholder="Enter an address or search the web" autoComplete="off" spellCheck={false} onChange={e => setAddress(e.target.value)}/>
          {address.trim() && !destination && <small role="alert">Enter an HTTP or HTTPS address, or search words.</small>}
          <div className="browser-launch-actions">
            <button className="button secondary" disabled={!destination}><ExternalLink size={15}/> Open window</button>
            {windows && <button type="button" className="button secondary" disabled={!destination} onClick={() => {
              if (!destination) return;
              setPreferWindow(true);
              window.location.href = 'meet-helium://open/?url=' + encodeURIComponent(destination);
            }}>Open in Helium</button>}
          </div>
          <details className="helium-help"><summary>Browse with ad blocking</summary>
            <p>{windows ? <>Set up the <a href="https://github.com/PRABHMANNAT/playground-meet#helium-browser" target="_blank" rel="noreferrer">Windows launcher</a> to open links directly in Helium.</> : <>Open the meeting in <a href="https://helium.computer/" target="_blank" rel="noreferrer">Helium</a> to use its built-in ad blocker.</>}</p>
          </details>
        </form>
        <div className="browser-broadcast">
          <div><MonitorUp size={20}/><h3>{presenting ? 'Presenting to everyone' : 'Present to everyone'}</h3></div>
          <p>{presenting ? 'The meeting can see your selected tab or window.' : preferWindow ? 'Select the Helium window in the sharing picker.' : 'Choose a tab or window. Everyone sees the page as you browse.'}</p>
          <button className="button primary" disabled={choosingTab} onClick={async () => {
            setChoosingTab(true);
            try { await present(preferWindow ? 'window' : 'browser'); } finally { setChoosingTab(false); }
          }}>{presenting ? 'Stop presenting' : 'Choose tab or window'}</button>
        </div>
      </section>
      <button className="browser-link-tools" aria-expanded={showLinks} onClick={() => setShowLinks(!showLinks)}><Link2 size={16}/> Links & annotations <span>{showLinks ? '−' : '+'}</span></button>
      {showLinks && <div className="stack">
      <div className="browser-tabs" role="group" aria-label="Browser tabs">
        {shared && (
          <div className="browser-tab" data-selected={following}>
            <button type="button" aria-pressed={following} onClick={() => select('shared')}>
              <Share2 size={14} /> <span>Shared page</span>
            </button>
          </div>
        )}
        {tabs.map((tab) => {
          const title = tabTitle(tab);
          return (
            <div className="browser-tab" key={tab.id} data-selected={selectedId === tab.id}>
              <button
                type="button"
                aria-pressed={selectedId === tab.id}
                title={title}
                onClick={() => select(tab.id)}
              >
                <Globe size={14} /> <span>{title}</span>
              </button>
              {tabs.length > 1 && (
                <button
                  type="button"
                  className="browser-tab-close"
                  aria-label={'Close ' + title + ' tab'}
                  onClick={() => closeTab(tab.id)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="icon-button"
          aria-label="Add browser tab"
          title={tabs.length >= maxTabs ? 'Maximum 5 personal tabs' : 'Add browser tab'}
          disabled={tabs.length >= maxTabs}
          onClick={() => {
            const id = nextId.current++;
            setTabs((items) => [...items, newTab(id)]);
            select(id);
          }}
        >
          <Plus size={17} />
        </button>
      </div>
      {following && shared && visible && (
        <section className="stack" aria-label="Shared page">
          <div className="browser-shared">
            <div className="browser-shared-info">
              <strong>Shared by {shared.name}</strong>
              <span title={shared.url}>{shared.url}</span>
            </div>
            {canStop && (
              <button
                className="button secondary small"
                disabled={pending}
                onClick={() => void share(null)}
              >
                Stop sharing page
              </button>
            )}
          </div>
          <PagePreview
            key={shared.id ?? shared.url}
            url={shared.url}
            shared={shared}
            canClear={canStop}
            send={send}
          />
        </section>
      )}
      {tabs.map((tab) => (
        <div key={tab.id} hidden={selectedId !== tab.id}>
          <PersonalTab
            tab={tab}
            navigate={(next) =>
              updateTab(tab.id, (item) => {
                const history = [...item.history.slice(0, item.index + 1), next].slice(-50);
                return { ...item, history, index: history.length - 1 };
              })
            }
            move={(offset) =>
              updateTab(tab.id, (item) => ({
                ...item,
                index: Math.max(0, Math.min(item.index + offset, item.history.length - 1)),
              }))
            }
            shared={shared}
            share={share}
            pending={pending}
            follow={() => select('shared')}
          />
        </div>
      ))}
      </div>}
    </div>
  );
}

function PersonalTab({
  tab,
  navigate,
  move,
  shared,
  share,
  pending,
  follow,
}: {
  tab: Tab;
  navigate: (next: Destination) => void;
  move: (offset: number) => void;
  shared: SharedState['browser'];
  share: (url: string) => Promise<void>;
  pending: boolean;
  follow: () => void;
}) {
  const inputId = useId();
  const entry = tab.history[tab.index];
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const address = draft ?? entry?.value ?? '';
  const query = address.trim();

  function open(next: Destination) {
    setDraft(null);
    setError('');
    if (next.kind === entry?.kind && next.value === entry.value) setRevision((r) => r + 1);
    else navigate(next);
  }

  function step(offset: number) {
    setDraft(null);
    setError('');
    move(offset);
  }

  function submit() {
    if (!query) return;
    const hasScheme = /^[a-z][\w+.-]*:/i.test(query);
    if (hasScheme || /^[^\s/]+\.[^\s/]+(?:\/\S*)?$/.test(query)) {
      const url = parseBrowserUrl(hasScheme ? query : 'https://' + query);
      if (url) open({ kind: 'page', value: url.href });
      else setError('Enter a public HTTPS page URL.');
    } else open({ kind: 'search', value: query });
  }

  return (
    <div className="stack">
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
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
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="button primary" disabled={!query}>
            <Search size={15} /> Go
          </button>
        </div>
        <div className="browser-row" role="group" aria-label="Page navigation">
          <button
            type="button"
            className="icon-button"
            aria-label="Back"
            title="Back"
            disabled={tab.index <= 0}
            onClick={() => step(-1)}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Forward"
            title="Forward"
            disabled={tab.index >= tab.history.length - 1}
            onClick={() => step(1)}
          >
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Reload"
            title="Reload"
            disabled={!entry}
            onClick={() => entry && open(entry)}
          >
            <RefreshCw size={16} />
          </button>
          {query && (
            <a
              className="text-button"
              href={'https://duckduckgo.com/?q=' + encodeURIComponent(query)}
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
      {entry?.kind === 'search' && (
        <WikipediaResults
          key={entry.value + ':' + revision}
          query={entry.value}
          open={(url) => open({ kind: 'page', value: url })}
        />
      )}
      {entry?.kind === 'page' && (
        <PagePreview
          key={entry.value + ':' + revision}
          url={entry.value}
          action={
            shared?.url === entry.value ? (
              <button className="button secondary small" onClick={follow}>
                <Share2 size={14} /> View shared page
              </button>
            ) : (
              <button
                className="button primary small"
                disabled={pending}
                onClick={() => void share(entry.value)}
              >
                <Share2 size={14} /> Share page
              </button>
            )
          }
        />
      )}
      {!entry && (
        <p className="panel-helper browser-empty">
          <Globe size={20} /> Enter a public HTTPS address or search Wikipedia.
        </p>
      )}
    </div>
  );
}

function PagePreview({
  url,
  shared,
  canClear = false,
  send,
  action,
}: {
  url: string;
  shared?: SharedPage;
  canClear?: boolean;
  send?: PanelProps['send'];
  action?: React.ReactNode;
}) {
  const target = parseBrowserUrl(url);
  if (!target) return <p className="error-message">This page address is unavailable.</p>;
  const externalOnly =
    ['github.com', 'www.github.com'].includes(target.hostname) ||
    (['google.com', 'www.google.com'].includes(target.hostname) &&
      ['/', '/search', '/webhp'].includes(target.pathname));
  const frame = (
    <iframe
      title={'Preview of ' + target.hostname}
      src={target.href}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
    />
  );
  return (
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
          {action}
        </div>
      </div>
      {externalOnly ? (
        <p className="panel-helper browser-empty">
          Open this site in a tab. To show it to everyone, use Present a browser tab.
        </p>
      ) : (
        <>
          {shared?.id && send ? (
            <BrowserAnnotations
              shareId={shared.id}
              strokes={shared.annotations ?? []}
              canClear={canClear}
              send={send}
            >
              {frame}
            </BrowserAnnotations>
          ) : (
            frame
          )}
          <p className="panel-helper">
            If the preview is blank, use Open in tab. For annotations, keep the same scroll
            position.
          </p>
        </>
      )}
    </section>
  );
}
