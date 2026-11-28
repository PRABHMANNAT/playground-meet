'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { microphoneTranscriber } from '@/lib/local-speech';
import { neuralTranscriber } from '@/lib/neural-speech';
import { request } from '@/lib/client';

type Caption = { segment: string; text: string; spokenAt?: number };
export function useTranscript(id: string, track?: MediaStreamTrack, clockOffset = 0) {
  const [engine, setEngine] = useState<'parakeet' | 'whisper' | 'vosk'>('parakeet');
  const [fallback, setFallback] = useState<'loading' | 'ready'>();
  const [status, setStatus] = useState<'off' | 'loading' | 'on' | 'saving'>('off');
  const [draft, setDraft] = useState(''),
    [error, setError] = useState('');
  const session = useRef<ReturnType<typeof microphoneTranscriber> | null>(null);
  const pending = useRef(Promise.resolve());
  const failed = useRef<Caption[]>([]);
  const save = useCallback(
    async (line: Caption) => {
      await request(`/api/meetings/${id}/actions`, { type: 'transcript', ...line });
    },
    [id],
  );
  const retry = useCallback(async () => {
    await pending.current;
    for (const line of [...failed.current]) {
      try {
        await save(line);
        failed.current = failed.current.filter((entry) => entry.segment !== line.segment);
      } catch {
        break;
      }
    }
    setError(
      failed.current.length ? 'Some captions could not be saved. Retry before leaving.' : '',
    );
  }, [save]);
  const stop = useCallback(async () => {
    const active = session.current;
    if (active) {
      setStatus('saving');
      await active.stop();
      if (session.current === active) session.current = null;
      await pending.current;
      if (failed.current.length) await retry();
      setStatus('off');
      setDraft('');
      setFallback(undefined);
    }
  }, [retry]);
  async function start() {
    if (session.current) return;
    setStatus('loading');
    setError('');
    try {
      const onText = (text: string, started?: number) => {
        const line = {
          segment: crypto.randomUUID(),
          text,
          spokenAt: started === undefined ? undefined : Math.round(started + clockOffset),
        };
        pending.current = pending.current
          .then(() => save(line))
          .catch(() => {
            failed.current.push(line);
            setError('A caption could not be saved. Retry to include it in the notes.');
          });
      };
      const active =
        engine === 'vosk'
          ? microphoneTranscriber(onText, setDraft)
          : neuralTranscriber(
              engine,
              onText,
              (message) => {
                setError(message);
                void stop();
              },
              setFallback,
            );
      session.current = active;
      active.attach(track);
      await active.start();
      if (session.current === active) setStatus('on');
    } catch (e) {
      await stop();
      setStatus('off');
      setError(
        e instanceof Error ? e.message : 'Speech recognition is unavailable in this browser.',
      );
    }
  }
  useEffect(() => {
    session.current?.attach(track);
  }, [track]);
  useEffect(
    () => () => {
      void stop();
    },
    [stop],
  );
  return {
    engine,
    setEngine,
    fallback,
    status,
    draft,
    error,
    muted: !track,
    start,
    stop,
    retry,
    hasUnsaved: failed.current.length > 0,
  };
}
export type TranscriptControls = ReturnType<typeof useTranscript>;
