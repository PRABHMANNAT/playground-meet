'use client';
import { useEffect, useState } from 'react';
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
    <div className="home-page">
      <Header action={<Account person={person} onChange={setPerson} />} />
      <main id="main" className="home-main">
        <div className="home-heading">
          <h1>Meet with your team.</h1>
          <p>Start a video call or join one with a link.</p>
        </div>
        <div className="meetings-workspace">
          <MeetingForm person={person} onChange={setPerson} />
          <History personId={person?.id} sessionLoading={loading} />
        </div>
      </main>
      <footer className="footer">
        <span>Playground Meet</span>
        <a href="/privacy">Privacy</a>
        <a href="https://tryplayground.net" target="_blank" rel="noreferrer">
          Go to Playground ↗
        </a>
      </footer>
    </div>
  );
}
