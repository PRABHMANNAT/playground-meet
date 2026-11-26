'use client';
import type { CSSProperties } from 'react';
import { useEffect, useState, useRef } from 'react';
import { Library, Check, Search, Pin, ArrowLeft, Rocket, Flame, Terminal, X } from 'lucide-react';
import {
  defaultFavorites,
  reactionNames,
  reactionPacks,
  readFavorites,
  legacyReactions,
  stickerImage,
  studioGroups,
} from '@/lib/reaction-library';
import type { Event } from '@/lib/types';
const studioFilters = ['All', 'Tech figures', 'World leaders'] as const;
type StudioFilter = (typeof studioFilters)[number];
const searchAliases: Record<string, string> = {
  'studio-albanese-question': 'Australia Australian PM prime minister',
  'studio-putin-notes': 'Russia Russian president',
  'studio-mkbhd-camera': 'MKBHD',
  'studio-pichai-listening': 'Sunder Pichai Google CEO',
  'studio-pichai-map': 'Sunder Pichai Google CEO',
  'studio-arun-phone': 'Mrwhosetheboss',
  'studio-ijustine-unbox': 'iJustine',
  'studio-linus-sebastian-pc': 'Linus Tech Tips LTT',
};
function compact(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f\s._'’-]+/g, '');
}
export function ReactionIcon({ emoji, size = 36 }: { emoji: string; size?: number }) {
  if (legacyReactions.includes(emoji)) return <span aria-hidden="true">{emoji}</span>;
  const symbols = { ship: Rocket, hotfix: Flame, build: Terminal };
  if (Object.hasOwn(symbols, emoji)) {
    const Icon = symbols[emoji as keyof typeof symbols];
    return (
      <span
        aria-hidden="true"
        className={'tech-sticker ' + emoji}
        style={{ width: size, height: size }}
      >
        <Icon size={size * 0.79} />
      </span>
    );
  }
  const src = stickerImage(emoji);
  if (!src) return null;
  if (emoji.startsWith('photo-') || emoji.startsWith('meme-')) {
    const [subject, caption] = reactionNames[emoji].split(' · ');
    const postcard = Object.hasOwn(reactionPacks['City postcards'], emoji);
    return (
      <span
        className={postcard ? 'photo-sticker city-postcard' : 'photo-sticker'}
        style={{ '--sticker-size': size + 'px' } as CSSProperties}
      >
        <img src={src} alt={caption ? subject : ''} loading="lazy" decoding="async" />
        <b>{caption ?? subject}</b>
      </span>
    );
  }
  return (
    <img
      alt=""
      width={size}
      height={size}
      className={src.endsWith('.svg') ? 'logo-sticker' : 'emoji-art'}
      loading="lazy"
      src={src}
    />
  );
}
export function StickerLibrary({
  onSelect,
  favorites = [],
  editing = false,
}: {
  onSelect: (id: string) => void;
  favorites?: string[];
  editing?: boolean;
}) {
  const [pack, setPack] = useState('Studio stickers');
  const [search, setSearch] = useState('');
  const [studioFilter, setStudioFilter] = useState<StudioFilter>('All');
  const results = useRef<HTMLDivElement>(null);
  const packs: Record<string, Record<string, string>> = reactionPacks;
  const query = search.trim().toLowerCase();
  const needle = compact(query);
  const packItems =
    pack === 'Studio stickers' && studioFilter !== 'All' ? studioGroups[studioFilter] : packs[pack];
  const visible = Object.entries(query ? reactionNames : packItems).filter(([id, name]) => {
    const alias = name.startsWith('Jensen Huang') ? 'NVIDIA CEO' : (searchAliases[id] ?? '');
    return !query || compact(name + ' ' + id + ' ' + alias).includes(needle);
  });
  useEffect(() => {
    results.current?.scrollTo({ top: 0 });
  }, [pack, query, studioFilter]);
  return (
    <>
      <label className="sticker-search">
        <Search size={16} />
        <input
          aria-label="Search all stickers"
          placeholder={'Search ' + Object.keys(reactionNames).length + ' stickers'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="sticker-filter">
        <select
          aria-label="Sticker pack"
          value={pack}
          onChange={(e) => {
            setPack(e.target.value);
            setSearch('');
          }}
        >
          {Object.keys(packs).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <span>{editing ? favorites.length + '/6 pinned' : visible.length + ' stickers'}</span>
      </div>
      {pack === 'Studio stickers' && !query && (
        <div className="studio-filters" role="group" aria-label="Studio sticker categories">
          {studioFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={filter === studioFilter}
              onClick={() => setStudioFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      )}
      <div className="sticker-library" ref={results}>
        <div className={'sticker-grid' + (pack === 'Gopher memes' && !query ? ' meme-grid' : '')}>
          {visible.map(([id, name]) => {
            const pinned = favorites.includes(id);
            const captioned = id.startsWith('photo-') || id.startsWith('meme-');
            return (
              <button
                key={id}
                className={captioned ? 'photo-tile' : undefined}
                title={name}
                aria-label={(editing ? (pinned ? 'Unpin ' : 'Pin ') : 'Send ') + name}
                aria-pressed={editing ? pinned : undefined}
                disabled={editing && !pinned && favorites.length >= 6}
                onClick={() => onSelect(id)}
              >
                <ReactionIcon emoji={id} size={captioned ? 44 : 52} />
                {!query && pack === 'Gopher memes' && <small>{name}</small>}
                {pinned && <Check className="pin-check" size={12} />}
              </button>
            );
          })}
        </div>
        {!visible.length && <p className="sticker-no-results">No matching stickers</p>}
      </div>
      <a
        className="sticker-credits"
        href="/reactions/credits.html"
        target="_blank"
        rel="noreferrer"
      >
        Sticker credits
      </a>
    </>
  );
}
export function ReactionPicker({
  onSend,
  onClose,
}: {
  onSend: (id: string) => void;
  onClose: () => void;
}) {
  const [favorites, setFavorites] = useState(defaultFavorites);
  const [library, setLibrary] = useState(false);

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    panel.current?.focus();
  }, []);

  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Send a reaction"]',
    );

    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !panel.current?.contains(event.target) &&
        !trigger?.contains(event.target)
      )
        onClose();
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [onClose]);
  useEffect(() => {
    try {
      setFavorites(readFavorites(localStorage.getItem('meet-reactions-v1')));
    } catch {}
  }, []);
  function toggle(id: string) {
    const selected = favorites.includes(id);
    if (!selected && favorites.length >= 6) return;
    const next = selected ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem('meet-reactions-v1', JSON.stringify(next));
    } catch {}
  }
  return (
    <section
      ref={panel}
      tabIndex={-1}
      className={'reactions-menu sticker-picker' + (library ? ' expanded' : '')}
      aria-label="Reaction picker"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
          document
            .querySelector<HTMLButtonElement>('button[aria-label="Send a reaction"]')
            ?.focus();
        }
      }}
    >
      <div className="sticker-heading">
        {library && (
          <button
            aria-label="Back to quick reactions"
            onClick={() => {
              setLibrary(false);
              setEditing(false);
            }}
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <strong>{library ? 'Sticker library' : 'Quick reactions'}</strong>
        {library && (
          <button className="pin-mode" aria-pressed={editing} onClick={() => setEditing(!editing)}>
            <Pin size={13} />
            {editing ? 'Done' : 'Edit pins'}
          </button>
        )}
        <button aria-label="Close reactions" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      {library ? (
        <>
          <StickerLibrary
            favorites={favorites}
            editing={editing}
            onSelect={editing ? toggle : onSend}
          />
        </>
      ) : (
        <>
          <div className="sticker-quick">
            {favorites.map((id) => (
              <button
                key={id}
                title={reactionNames[id]}
                aria-label={'React with ' + reactionNames[id]}
                onClick={() => onSend(id)}
              >
                <ReactionIcon emoji={id} size={43} />
              </button>
            ))}
          </div>
          <button className="library-switch" onClick={() => setLibrary(true)}>
            <Library size={17} /> Browse stickers
          </button>
        </>
      )}
    </section>
  );
}
export function Reactions({ events, now }: { events: Event[]; now: number }) {
  return (
    <div className="sticker-flight-zone" aria-live="polite" aria-label="Meeting reactions">
      {events
        .filter((e) => e.kind === 'reaction' && now - e.created < 4800)
        .slice(-8)
        .map((e) => {
          const id = String(e.payload.emoji);
          return (
            <div
              key={e.id}
              className="sticker-flight"
              role="img"
              aria-label={e.name + ' reacted with ' + (reactionNames[id] ?? id)}
              style={
                {
                  left: 17 + ((e.id * 17) % 63) + '%',
                  '--drift': (e.id % 2 ? 20 : -20) + 'px',
                } as CSSProperties
              }
            >
              <div className="flight-art">
                <ReactionIcon emoji={id} size={58} />
              </div>
              <small>{e.name}</small>
            </div>
          );
        })}
    </div>
  );
}
