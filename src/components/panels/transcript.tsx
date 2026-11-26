'use client';
import { useEffect, useRef, useState } from 'react';
import { AudioLines, Captions, LoaderCircle, Square } from 'lucide-react';
import { duration } from '@/lib/format';
import type { TranscriptControls } from '@/hooks/use-transcript';
import type { Snapshot } from '@/lib/types';

export function TranscriptPanel({ data, speech }: { data: Snapshot; speech: TranscriptControls }) {
  const [follow, setFollow] = useState(true);
  const scroll = useRef<HTMLDivElement>(null);
  const entries = data.events
    .filter((e) => e.kind === 'transcript')
    .sort((a, b) => a.created - b.created || a.id - b.id);
  const last = entries.at(-1)?.id;
  useEffect(() => {
    if (follow && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [last, speech.draft, follow]);
  const active = speech.status !== 'off';
  const status = {
    off: 'Your microphone is excluded',
    loading: 'Loading English speech model…',
    saving: 'Saving final words…',
    on: speech.muted ? 'Paused · microphone muted' : 'Listening to your microphone',
  }[speech.status];
  return (
    <div className="transcript-panel">
      <section className="transcript-controls">
        <div className="transcript-status">
          <AudioLines size={18} />
          <strong>{status}</strong>
        </div>
        <p>
          Your device transcribes your microphone in English. Everyone in the meeting can read and
          download the captions.
        </p>
        <label className="transcript-engine">
          <span>Recognition mode</span>
          <select
            value={speech.engine}
            disabled={active}
            onChange={(e) => speech.setEngine(e.target.value === 'vosk' ? 'vosk' : 'whisper')}
          >
            <option value="whisper">Whisper · caption by phrase</option>
            <option value="vosk">Lite · live word preview</option>
          </select>
        </label>
        {!active && (
          <p>
            {speech.engine === 'whisper'
              ? 'About 96 MiB on first use. Captions appear after a pause.'
              : 'Smaller English model for slower devices.'}
          </p>
        )}
        <button
          className="button primary"
          disabled={speech.status === 'saving'}
          onClick={active ? speech.stop : speech.start}
        >
          {speech.status === 'loading' || speech.status === 'saving' ? (
            <LoaderCircle className="spin" size={15} />
          ) : active ? (
            <Square size={13} />
          ) : (
            <Captions size={16} />
          )}
          {speech.status === 'loading'
            ? 'Cancel'
            : active
              ? 'Stop my transcript'
              : 'Include my microphone'}
        </button>
        {speech.error && (
          <div role="alert">
            {speech.error}{' '}
            {speech.hasUnsaved && (
              <button className="text-button" onClick={speech.retry}>
                Retry save
              </button>
            )}
          </div>
        )}
      </section>
      <div className="transcript-heading">
        <h3>Room transcript</h3>
        <button aria-pressed={follow} onClick={() => setFollow(!follow)}>
          {follow ? 'Following live' : 'Follow live'}
        </button>
      </div>
      <div
        ref={scroll}
        className="transcript-feed"
        role="log"
        aria-label="Speaker captions"
        aria-live="polite"
      >
        {!entries.length && !speech.draft && (
          <p className="panel-helper">
            Captions appear here when someone includes their microphone and speaks.
          </p>
        )}
        {entries.map((e) => (
          <article key={e.id}>
            <header>
              <strong>{e.name}</strong>
              <time>{duration((e.created - data.meeting.created) / 1000)}</time>
            </header>
            <p>{String(e.payload.text)}</p>
          </article>
        ))}
        {speech.draft && (
          <article className="transcript-draft">
            <header>
              <strong>You</strong>
              <small>Transcribing…</small>
            </header>
            <p>{speech.draft}</p>
          </article>
        )}
      </div>
    </div>
  );
}
