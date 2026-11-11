'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { request } from '@/lib/client';
import { meetingPath } from '@/lib/meeting-links';
type Recent = { id: string; title: string; created: number; ended: boolean };
export function History({
  personId,
  sessionLoading = false,
}: {
  personId?: string;
  sessionLoading?: boolean;
}) {
  const [items, setItems] = useState<Recent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setItems([]);
    setError('');
    if (!personId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    request<{ meetings: Recent[] }>('/api/meetings')
      .then((r) => {
        if (active) setItems(r.meetings);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [personId, attempt]);
  return (
    <section className="history-section" id="recent" aria-labelledby="recent-heading">
      <div className="section-heading">
        <h2 id="recent-heading">Recent meetings</h2>
        <span className="history-caption">Your meeting history</span>
      </div>
      {sessionLoading || loading ? (
        <p className="history-empty" role="status">
          Loading meetings…
        </p>
      ) : error ? (
        <div className="history-empty">
          <p role="alert">{error}</p>
          <button className="button secondary small" onClick={() => setAttempt((v) => v + 1)}>
            Try again
          </button>
        </div>
      ) : items.length ? (
        <div className="history-list">
          {items.slice(0, 6).map((item) => (
            <article className="history-row" key={item.id}>
              <span className="history-icon">
                <Clock size={19} />
              </span>
              <div className="history-info">
                <h3>{item.title}</h3>
                <p>
                  <time dateTime={new Date(Number(item.created)).toISOString()}>
                    {new Date(Number(item.created)).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                  <span>·</span>
                  {item.ended ? 'Ended' : 'Available to join'}
                </p>
              </div>
              <Link
                className="history-action"
                aria-label={`${item.ended ? 'View recap for' : 'Join'} ${item.title}`}
                href={meetingPath(item.id, item.ended)}
              >
                {item.ended ? 'View recap' : 'Join'}
                <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="history-empty">
          <Clock size={28} />
          <h3>No meetings yet</h3>
          <p>Your meetings and saved notes will appear here.</p>
        </div>
      )}
      <p className="history-note">
        {personId
          ? 'Open a recap to view notes, feedback, and download a summary.'
          : 'Start as a guest, or sign in to keep your history across devices.'}
      </p>
    </section>
  );
}
