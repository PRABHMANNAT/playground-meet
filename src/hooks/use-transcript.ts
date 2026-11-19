'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { microphoneTranscriber } from '@/lib/local-speech';
import { request } from '@/lib/client';

export function useTranscript(id: string, track?: MediaStreamTrack) {
  const [status, setStatus] = useState<'off' | 'loading' | 'on' | 'saving'>('off');
  const [draft, setDraft] = useState(''),
    [error, setError] = useState('');
  const session = useRef<ReturnType<typeof microphoneTranscriber> | null>(null);
  const pending = useRef(Promise.resolve());
  const failed = useRef<Array<{ segment: string; text: string }>>([]);
  const save = useCallback(
    async (line: { segment: string; text: string }) => {
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
    }
  }, [retry]);
  async function start() {
    if (session.current) return;
    setStatus('loading');
    setError('');
    try {
      const active = microphoneTranscriber((text) => {
        const line = { segment: crypto.randomUUID(), text };
        pending.current = pending.current
          .then(() => save(line))
          .catch(() => {
            failed.current.push(line);
            setError('A caption could not be saved. Retry to include it in the notes.');
          });
      }, setDraft);
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
