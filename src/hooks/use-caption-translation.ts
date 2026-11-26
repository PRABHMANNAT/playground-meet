'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event } from '@/lib/types';

export const captionLanguages = {
  en: 'English (original)',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
  pt: 'Portuguese',
  zh: 'Chinese (Simplified)',
} as const;
export type CaptionLanguage = keyof typeof captionLanguages;

export function useCaptionTranslation(events: Event[] | undefined) {
  const [language, selectLanguage] = useState<CaptionLanguage>('en');
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'off' | 'loading' | 'ready' | 'error'>('off');
  const [lines, setLines] = useState<Record<number, string>>({});
  const [live, setLive] = useState<{ speaker: string; text: string } | null>(null);
  const entries = useMemo(
    () =>
      (events ?? [])
        .filter((e) => e.kind === 'transcript')
        .sort((a, b) => a.created - b.created || a.id - b.id),
    [events],
  );
  const latest = useRef(entries);
  const pump = useRef<(() => void) | null>(null);
  function setLanguage(next: CaptionLanguage) {
    setLive(null);
    setLines({});
    selectLanguage(next);
  }

  useEffect(() => {
    latest.current = entries;
    pump.current?.();
  }, [entries]);

  useEffect(() => {
    setLines({});
    setLive(null);
    if (language === 'en') {
      setStatus('off');
      return;
    }
    setStatus('loading');
    let worker: Worker;
    try {
      worker = new Worker('/speech/translation-worker.js', { type: 'module' });
    } catch {
      setStatus('error');
      return;
    }
    let ready = false,
      busy = false,
      closed = false;
    let timer: ReturnType<typeof setTimeout>;
    let hideCaption: ReturnType<typeof setTimeout>;
    const existing = new Set(latest.current.map((e) => e.id));
    const finished = new Map<number, string>();
    function stop() {
      closed = true;
      clearTimeout(timer);
      clearTimeout(hideCaption);
      pump.current = null;
      worker.terminate();
    }
    function fail() {
      if (closed) return;
      stop();
      setStatus('error');
      setLive(null);
    }
    function next() {
      if (!ready || busy || closed) return;
      const current = latest.current;
      // Recent speech has priority when opening the panel mid-meeting.
      const entry =
        current.find((e) => !existing.has(e.id) && !finished.has(e.id)) ??
        current.findLast((e) => !finished.has(e.id));
      if (!entry) return;
      busy = true;
      timer = setTimeout(fail, 45000);
      worker.postMessage({ type: 'translate', id: entry.id, text: String(entry.payload.text) });
    }
    pump.current = next;
    worker.onerror = fail;
    worker.onmessage = ({ data }) => {
      if (closed) return;
      clearTimeout(timer);
      if (data.type === 'ready') {
        ready = true;
        setStatus('ready');
      } else if (data.type === 'caption') {
        busy = false;
        finished.set(data.id, data.text);
        const caption = latest.current.find((e) => e.id === data.id);
        if (caption && !existing.has(caption.id)) {
          clearTimeout(hideCaption);
          setLive({ speaker: caption.name, text: data.text });
          hideCaption = setTimeout(() => setLive(null), 12000);
        }
        const retained = new Set(latest.current.map((e) => e.id));
        for (const id of finished.keys()) if (!retained.has(id)) finished.delete(id);
        setLines(Object.fromEntries(finished));
      } else {
        fail();
        return;
      }
      next();
    };
    timer = setTimeout(fail, 240000);
    worker.postMessage({ type: 'load', language });
    return stop;
  }, [language, attempt]);

  return {
    language,
    setLanguage,
    status,
    entries,
    lines,
    live,
    retry: () => setAttempt((n) => n + 1),
  };
}
export type CaptionTranslation = ReturnType<typeof useCaptionTranslation>;
