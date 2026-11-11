'use client';
import { AnimatePresence, motion } from 'motion/react';
import { Hand, Heart, PartyPopper, ThumbsUp, Lightbulb, Laugh } from 'lucide-react';
import type { Event } from '@/lib/types';
export const emojis = ['👏', '❤️', '🎉', '👍', '💡', '😂'] as const;
const icons = [Hand, Heart, PartyPopper, ThumbsUp, Lightbulb, Laugh] as const;

export function ReactionIcon({ emoji, size = 20 }: { emoji: string; size?: number }) {
  const Icon = icons[emojis.findIndex((value) => value === emoji)];
  return Icon ? <Icon size={size} aria-hidden="true" /> : null;
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
