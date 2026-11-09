'use client';
import { useEffect, useState } from 'react';
import { Video, ShieldCheck, ChevronDown } from 'lucide-react';
import { Header } from './header';
import { Account } from './account';
import { MeetingForm } from './meeting-form';
import { History } from './history';
import { request } from '@/lib/client';
import type { Person } from '@/lib/types';
export function Home() {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    request<{ person: Person | null }>('/api/session')
      .then((r) => {
        if (active) setPerson(r.person);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <Header action={<Account person={person} onChange={setPerson} />} />
      <main id="main" className="home-main">
        <div className="home-heading">
          <h1>Meet with your team.</h1>
          <p>Start a video call or join one with a link.</p>
        </div>
        <div className="meetings-workspace">
          <div className="start-column">
            <MeetingForm person={person} onChange={setPerson} />
            <p className="start-hint">
              <ShieldCheck size={15} />
              You control who joins your meeting.
            </p>
          </div>
          <History personId={person?.id} sessionLoading={loading} />
        </div>
        <section className="meeting-help" id="help" aria-labelledby="help-title">
          <div className="help-intro">
            <Video size={20} />
            <div>
              <h2 id="help-title">New to Meet?</h2>
              <p>No download needed. Everything runs in your browser.</p>
            </div>
          </div>
          <details>
            <summary>
              How do I invite people?
              <ChevronDown size={16} />
            </summary>
            <p>
              Create a meeting, then select “Copy invite link” on the preview screen. Share the link
              with your team. You can also invite people during the call.
            </p>
          </details>
          <details>
            <summary>
              Can I check my camera first?
              <ChevronDown size={16} />
            </summary>
            <p>
              Yes. Every meeting opens with a camera and microphone preview. You can also join with
              both turned off.
            </p>
          </details>
          <details>
            <summary>
              Where are notes and other tools?
              <ChevronDown size={16} />
            </summary>
            <p>
              In a meeting, open “Tools” for shared notes, the whiteboard, polls, a focus timer, and
              product reviews. Chat and People are always on the call toolbar.
            </p>
          </details>
        </section>
      </main>
      <footer className="footer">
        <span>Playground Meet</span>
        <a href="/privacy">Privacy</a>
        <a href="https://tryplayground.net" target="_blank" rel="noreferrer">
          Go to Playground ↗
        </a>
      </footer>
    </>
  );
}
