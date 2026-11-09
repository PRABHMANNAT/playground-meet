'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Video,
  PenTool,
  MessageSquare,
  Layers,
  ShieldCheck,
  Command,
} from 'lucide-react';
import { Header } from './header';
import { Account } from './account';
import { MeetingForm } from './meeting-form';
import { HeroArt } from './hero-art';
import { History } from './history';
import { request } from '@/lib/client';
import type { Person } from '@/lib/types';
export function Home() {
  const [person, setPerson] = useState<Person | null>(null);
  useEffect(() => {
    request<{ person: Person | null }>('/api/session')
      .then((r) => setPerson(r.person))
      .catch(() => {});
  }, []);
  return (
    <>
      <Header action={<Account person={person} onChange={setPerson} />} />
      <main id="main" className="home-main">
        <section className="hero">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="eyebrow hero-eyebrow">
              <span className="pulse-dot" /> A MEETING OF GREAT MINDS{' '}
              <span className="new-badge">MEET</span>
            </div>
            <h1>
              Good ideas start
              <br />
              with a{' '}
              <span className="underlined">
                conversation
                <svg viewBox="0 0 450 18" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 12Q210-5 445 9M25 17Q230 4 410 14" />
                </svg>
              </span>
              <span className="coral">.</span>
            </h1>
            <p className="hero-description">
              Your people. Your ideas. One beautiful space.
              <br />
              Meet, make, and move things forward — together.
            </p>
            <MeetingForm person={person} onChange={setPerson} />
            <div className="hero-promise">
              <span>
                <Video size={14} /> HD conversations
              </span>
              <span>
                <ShieldCheck size={14} /> Private by design
              </span>
              <span>No downloads. Just you.</span>
            </div>
          </motion.div>
          <HeroArt />
        </section>
        <section className="toolkit" id="toolkit">
          <div className="toolkit-intro">
            <span className="eyebrow">MORE THAN A MEETING</span>
            <h2>
              Built for the
              <br />
              <em>“let’s try it.”</em>
            </h2>
          </div>
          {[
            {
              icon: PenTool,
              title: 'Think out loud.',
              body: 'A shared whiteboard for ideas that don’t fit in a chat.',
              label: 'WHITEBOARD',
            },
            {
              icon: MessageSquare,
              title: 'Make feedback count.',
              body: 'Live polls, shared notes, and moments worth keeping.',
              label: 'COLLABORATION',
            },
            {
              icon: Layers,
              title: 'Build better, together.',
              body: 'Product reviews with one-click bug and idea reporting.',
              label: 'PLAYGROUND DNA',
            },
          ].map(({ icon: Icon, title, body, label }) => (
            <article className="toolkit-card" key={label}>
              <div className="toolkit-card-top">
                <Icon size={21} />
                <ArrowUpRight size={16} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
              <span className="eyebrow">{label}</span>
            </article>
          ))}
        </section>
        <History personId={person?.id} />
        <div className="home-bottom">
          <span>
            <Command size={14} /> Less switching tabs. More making things happen.
          </span>
          <span className="eyebrow">A LITTLE MORE HUMAN. A LOT MORE PLAYGROUND.</span>
        </div>
      </main>
      <footer className="footer">
        <span>© {new Date().getFullYear()} Playground</span>
        <a href="/privacy">Privacy</a>
        <a href="https://tryplayground.net" target="_blank" rel="noreferrer">
          Part of the Playground universe <ArrowUpRight size={13} />
        </a>
      </footer>
    </>
  );
}
