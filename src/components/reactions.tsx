'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Library, Check, Rocket, Flame, Terminal, X } from 'lucide-react';
import {
  defaultFavorites,
  reactionNames,
  reactionPacks,
  readFavorites,
  legacyReactions,
} from '@/lib/reaction-library';
import type { Event } from '@/lib/types';
function ReactionIcon({ emoji, size = 36 }: { emoji: string; size?: number }) {
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
        <Icon size={size * 0.63} />
      </span>
    );
  }
  if (!Object.hasOwn(reactionNames, emoji)) return null;
  const portrait = defaultFavorites.includes(emoji);
  return (
    <img
      alt=""
      width={size}
      height={size}
      className={portrait ? 'emoji-art' : 'logo-sticker'}
      src={'/reactions/' + emoji + (portrait ? '.webp' : '.svg')}
    />
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
      className="reactions-menu sticker-picker"
      aria-label="Reaction picker"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="sticker-heading">
        <strong>{library ? 'Reaction library' : 'Quick reactions'}</strong>
        <button type="button" aria-label="Close reactions" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      {library ? (
        <>
          <p>Pin up to six favorites · {favorites.length}/6</p>
          <div className="sticker-library">
            {Object.entries(reactionPacks).map(([pack, items]) => (
              <div key={pack}>
                <h3>{pack}</h3>
                <div className="sticker-grid">
                  {Object.entries(items).map(([id, name]) => (
                    <button
                      key={id}
                      title={name}
                      aria-label={name}
                      aria-pressed={favorites.includes(id)}
                      disabled={!favorites.includes(id) && favorites.length >= 6}
                      onClick={() => toggle(id)}
                    >
                      <ReactionIcon emoji={id} />
                      <small>{name}</small>
                      {favorites.includes(id) && <Check className="pin-check" size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="library-switch" onClick={() => setLibrary(false)}>
            Done
          </button>
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
                <ReactionIcon emoji={id} />
              </button>
            ))}
          </div>
          <button className="library-switch" onClick={() => setLibrary(true)}>
            <Library size={16} /> Reaction library
          </button>
        </>
      )}
    </section>
  );
}
export function Reactions({ events, now }: { events: Event[]; now: number }) {
  return (
    <div aria-live="polite" aria-label="Meeting reactions">
      <AnimatePresence>
        {events
          .filter((e) => e.kind === 'reaction' && now - e.created < 4000)
          .map((e) => (
            <motion.div
              className="reaction-rain"
              key={e.id}
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -150, opacity: 1, scale: 1.2 }}
              exit={{ y: -220, opacity: 0 }}
              transition={{ duration: 1.6 }}
              style={{ left: `${25 + (e.id % 50)}%` }}
              title={e.name}
            >
              <span role="img" aria-label={e.name + ' reacted ' + e.payload.emoji}>
                <ReactionIcon emoji={String(e.payload.emoji)} size={34} />
              </span>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
