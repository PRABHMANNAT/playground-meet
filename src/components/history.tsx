'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, FileText, Video } from 'lucide-react';
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
      <h2 id="recent-heading">Recent meetings</h2>
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
              <span className="history-icon" aria-hidden="true">
                {item.ended ? <FileText size={18} /> : <Video size={18} />}
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
          <span className="history-empty-icon" aria-hidden="true">
            <Video size={25} strokeWidth={1.7} />
            <span className="history-empty-badge">
              <Clock size={12} strokeWidth={2} />
            </span>
          </span>
          <div>
            <h3>No meetings yet</h3>
            <p>Start or join a meeting to see it here.</p>
          </div>
        </div>
      )}
      {!personId && !sessionLoading && (
        <p className="history-note">Sign in to keep your meeting history across devices.</p>
      )}
    </section>
  );
}
