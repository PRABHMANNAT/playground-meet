'use client';
import { useEffect, useState } from 'react';
import { Download, Star, ArrowLeft, Check, PhoneOff, StickyNote, Flag } from 'lucide-react';
import { request, downloadSummary } from '@/lib/client';
import { Header } from './header';
import { useToast } from './providers';
import type { Snapshot } from '@/lib/types';
import { duration } from '@/lib/format';
export function Recap({ id }: { id: string }) {
  const [data, setData] = useState<Snapshot | null>(null),
    [error, setError] = useState(''),
    [rating, setRating] = useState(0),
    [saved, setSaved] = useState(false);
  const toast = useToast();
  useEffect(() => {
    request<Snapshot>(`/api/meetings/${id}/state`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <div className="meeting-entry">
      <Header />
      <main className="recap" id="main">
        <div className="recap-hero">
          <span className="recap-icon" aria-hidden="true">
            <PhoneOff size={24} strokeWidth={1.6} />
          </span>
          <h1>Meeting recap</h1>
          {data && <p>{data.meeting.title}</p>}
        </div>
        {error ? (
          <p role="alert" className="error-message">
            {error}
          </p>
        ) : !data ? (
          <p className="empty-state">Loading meeting notes…</p>
        ) : (
          <>
            <div className="recap-actions">
              <button
                className="button primary"
                onClick={() => downloadSummary(id).catch((e) => toast(e.message))}
              >
                <Download size={16} /> Download summary
              </button>
              <a className="button secondary" href="/">
                <ArrowLeft size={16} /> Back to meetings
              </a>
            </div>
            <section className="recap-card">
              <h2>
                <Star size={18} aria-hidden="true" /> Rate this meeting
              </h2>
              <form
                className="stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!rating) {
                    toast('Choose a rating first.');
                    return;
                  }
                  const f = new FormData(e.currentTarget);
                  try {
                    await request(`/api/meetings/${id}/actions`, {
                      type: 'rating',
                      rating,
                      text: String(f.get('feedback')),
                    });
                    setSaved(true);
                  } catch (e) {
                    toast((e as Error).message);
                  }
                }}
              >
                <div className="stars" role="group" aria-label="Meeting rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      aria-label={`Rate ${n} out of 5`}
                      aria-pressed={rating === n}
                      className={n <= rating ? 'selected' : ''}
                      key={n}
                      onClick={() => {
                        setRating(n);
                        setSaved(false);
                      }}
                    >
                      <Star fill={n <= rating ? 'currentColor' : 'none'} size={23} />
                    </button>
                  ))}
                </div>
                <textarea
                  aria-label="Meeting feedback"
                  name="feedback"
                  maxLength={1000}
                  placeholder="Add feedback (optional)"
                  rows={3}
                />
                <button className="button secondary" disabled={saved}>
                  {saved ? (
                    <>
                      <Check size={16} /> Feedback saved
                    </>
                  ) : (
                    'Share feedback'
                  )}
                </button>
              </form>
            </section>
            <section className="recap-card">
              <h2>
                <StickyNote size={18} aria-hidden="true" /> Shared notes
              </h2>
              <p className="recap-notes">
                {data.meeting.state.notes || 'No notes were saved in this meeting.'}
              </p>
            </section>
            <section className="recap-card">
              <h2>
                <Flag size={18} aria-hidden="true" /> Feedback markers
              </h2>
              {data.events
                .filter((e) => e.kind === 'marker')
                .map((e) => (
                  <article className="marker" key={e.id}>
                    <header>
                      <span>
                        {String(e.payload.kind)} · {e.name}
                      </span>
                      <span>{duration((e.created - data.meeting.created) / 1000)}</span>
                    </header>
                    <p>{String(e.payload.text)}</p>
                  </article>
                ))}
              {!data.events.some((e) => e.kind === 'marker') && (
                <p className="panel-helper">No feedback markers yet.</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
