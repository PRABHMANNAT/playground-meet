'use client';
import { useEffect, useState } from 'react';
import { Download, Star, ArrowLeft, Check, PhoneOff, StickyNote, Flag } from 'lucide-react';
import { request, downloadSummary } from '@/lib/client';
import { ActionList, DecisionList } from './panels/outcomes';
import { LocalRecordingList } from './local-recording-list';
import { Header } from './header';
import { useToast } from './providers';
import type { Snapshot } from '@/lib/types';
import { finalCaptionWindow, transcriptHighlights } from '@/lib/transcript';
import { duration } from '@/lib/format';
export function Recap({ id }: { id: string }) {
  const [data, setData] = useState<Snapshot | null>(null),
    [error, setError] = useState(''),
    [rating, setRating] = useState(0),
    [saved, setSaved] = useState(false),
    [saving, setSaving] = useState(false);
  const toast = useToast();
  const [downloadStatus, setDownloadStatus] = useState('');
  useEffect(() => {
    if (!data || new URLSearchParams(location.search).get('notes') !== 'download') return;
    const url = new URL(location.href);
    const finish = () => {
      url.searchParams.delete('notes');
      history.replaceState(history.state, '', url);
    };
    const wait = Math.max(
      0,
      (data.meeting.state.transcriptClosedAt ?? 0) + finalCaptionWindow - data.serverTime,
    );
    setDownloadStatus(wait ? 'Finalizing meeting notes…' : 'Preparing meeting notes…');
    const timer = setTimeout(() => {
      finish();
      downloadSummary(id)
        .then(() => setDownloadStatus('Meeting notes download started.'))
        .catch(() =>
          setDownloadStatus('Automatic download failed. Use Download summary to try again.'),
        );
    }, wait);
    return () => clearTimeout(timer);
  }, [id, data]);
  useEffect(() => {
    request<Snapshot>(`/api/meetings/${id}/state`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <div className="meeting-entry recap-page">
      <Header />
      <main className="recap" id="main">
        <div className="recap-hero">
          <span className="recap-icon" aria-hidden="true">
            <PhoneOff size={24} strokeWidth={1.6} />
          </span>
          <h1>Meeting recap</h1>
        </div>
        {error ? (
          <p role="alert" className="error-message">
            {error}
          </p>
        ) : !data ? (
          <p className="empty-state">Loading meeting notes…</p>
        ) : (
          <>
            {downloadStatus && (
              <p role="status" className="panel-helper">
                {downloadStatus}
              </p>
            )}
            <div className="recap-actions">
              <button
                className="button primary"
                onClick={() => downloadSummary(id).catch((e) => toast(e.message))}
              >
                <Download size={16} /> Download summary
              </button>
              {!!data.meeting.state.strokes.length && (
                <button
                  className="button secondary"
                  onClick={async () => {
                    try {
                      const { downloadBoardPdf } = await import('@/lib/board-pdf');
                      await downloadBoardPdf(data.meeting.state.strokes, id, data.meeting.title);
                    } catch (error) {
                      toast(error instanceof Error ? error.message : 'Whiteboard export failed.');
                    }
                  }}
                >
                  <Download size={16} />
                  Whiteboard PDF
                </button>
              )}
              <a className="button secondary" href="/">
                <ArrowLeft size={16} /> Back to meetings
              </a>
            </div>
            <LocalRecordingList scope={id + '/' + data.me.id} />
            {!!transcriptHighlights(data.events).length && (
              <section className="recap-card">
                <h2>Discussion highlights</h2>
                {transcriptHighlights(data.events).map((e) => (
                  <p key={e.id}>
                    <strong>{e.name}</strong> · {String(e.payload.text)}
                  </p>
                ))}
              </section>
            )}
            {!!data.meeting.state.actionItems?.length && (
              <section className="recap-card">
                <h2>Action items</h2>
                <ActionList items={data.meeting.state.actionItems} />
              </section>
            )}
            {!!data.meeting.state.decisions?.length && (
              <section className="recap-card">
                <h2>Decision log</h2>
                <DecisionList decisions={data.meeting.state.decisions} />
              </section>
            )}
            <section className="recap-card recap-rating" aria-labelledby="recap-rating-heading">
              <h2 id="recap-rating-heading">Rate this meeting</h2>
              <form
                className="recap-feedback-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (saving || saved) return;
                  if (!rating) {
                    toast('Choose a rating first.');
                    return;
                  }
                  const f = new FormData(e.currentTarget);
                  setSaving(true);
                  try {
                    await request(`/api/meetings/${id}/actions`, {
                      type: 'rating',
                      rating,
                      text: String(f.get('feedback')),
                    });
                    setSaved(true);
                  } catch (e) {
                    toast((e as Error).message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <div className="stars" role="group" aria-label="Meeting rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      aria-label={`Rate ${n} out of 5`}
                      aria-pressed={rating === n}
                      disabled={saving}
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
                <label className="recap-feedback-field">
                  <span>
                    Feedback <span className="recap-feedback-optional">Optional</span>
                  </span>
                  <textarea
                    name="feedback"
                    maxLength={1000}
                    placeholder="What worked well? What could be better?"
                    rows={3}
                    disabled={saving}
                    onChange={() => setSaved(false)}
                  />
                </label>
                <div className="recap-feedback-footer">
                  {saved ? (
                    <p className="recap-feedback-saved" role="status">
                      <Check size={16} aria-hidden="true" /> Feedback saved
                    </p>
                  ) : (
                    <button className="button primary recap-submit" disabled={saving}>
                      {saving ? 'Saving…' : 'Share feedback'}
                    </button>
                  )}
                </div>
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
