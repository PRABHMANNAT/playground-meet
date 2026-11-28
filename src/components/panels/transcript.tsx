'use client';
import { useEffect, useRef, useState } from 'react';
import { AudioLines, Captions, LoaderCircle, Square } from 'lucide-react';
import { duration } from '@/lib/format';
import type { TranscriptControls } from '@/hooks/use-transcript';
import {
  captionLanguages,
  type CaptionLanguage,
  type CaptionTranslation,
} from '@/hooks/use-caption-translation';
import type { Snapshot } from '@/lib/types';

export function TranscriptPanel({
  data,
  speech,
  translation,
}: {
  data: Snapshot;
  speech: TranscriptControls;
  translation: CaptionTranslation;
}) {
  const [follow, setFollow] = useState(true);
  const scroll = useRef<HTMLDivElement>(null);
  const { entries, language, lines } = translation;
  const last = entries.at(-1)?.id;
  useEffect(() => {
    if (follow && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [last, lines, speech.draft, follow]);
  const active = speech.status !== 'off';
  const status = {
    off: 'Your microphone is excluded',
    loading: speech.fallback ? 'Loading Whisper fallback…' : 'Loading English speech model…',
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
            onChange={(e) => {
              const mode = e.target.value;
              if (mode === 'parakeet' || mode === 'whisper' || mode === 'vosk')
                speech.setEngine(mode);
            }}
          >
            <option value="parakeet">Automatic · NVIDIA Parakeet</option>
            <option value="whisper">Whisper · compatibility mode</option>
            <option value="vosk">Lite · live word preview</option>
          </select>
        </label>
        {!active && (
          <p>
            {
              {
                parakeet: 'About 142 MiB on first use. Switches to Whisper if Parakeet fails.',
                whisper: 'About 96 MiB on first use. Captions appear after a pause.',
                vosk: 'Smaller English model for slower devices.',
              }[speech.engine]
            }
          </p>
        )}
        {speech.fallback && speech.status === 'on' && (
          <p role="status">
            {speech.fallback === 'loading'
              ? 'Loading Whisper fallback…'
              : 'Using Whisper as a fallback.'}
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
      <div className="caption-language">
        <label className="transcript-engine">
          <span>Caption language for me</span>
          <select
            value={language}
            onChange={(e) => translation.setLanguage(e.target.value as CaptionLanguage)}
          >
            {Object.entries(captionLanguages).map(([code, name]) => (
              <option value={code} key={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {language === 'en' && (
          <small>Translation downloads a language pack on first use (about 107–114 MiB).</small>
        )}
        {translation.status === 'loading' && (
          <small role="status">Loading {captionLanguages[language]} on this device…</small>
        )}
        {translation.status === 'error' && (
          <p role="alert">
            Translation stopped.{' '}
            <button className="text-button" onClick={translation.retry}>
              Retry translation
            </button>
          </p>
        )}
      </div>
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
            {language !== 'en' && lines[e.id] && (
              <p className="translated-line" lang={language}>
                {lines[e.id]}
              </p>
            )}
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
