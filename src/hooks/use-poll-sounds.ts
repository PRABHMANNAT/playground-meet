'use client';
import { useEffect, useRef, useState } from 'react';
import type { Poll } from '@/lib/types';

const preference = 'meet-poll-sounds';
export function usePollSounds(polls: Poll[] | undefined, me: string | undefined) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(preference) !== 'off'; } catch { return true; }
  });
  const audio = useRef<AudioContext | null>(null);
  const previous = useRef<Poll[] | undefined>(undefined);
  useEffect(() => {
    if (!enabled || typeof AudioContext === 'undefined') return;
    const unlock = () => {
      try {
        const ctx = audio.current ??= new AudioContext();
        void ctx.resume().catch(() => {});
      } catch {}
    };
    window.addEventListener('pointerdown', unlock, { once:true });
    window.addEventListener('keydown', unlock, { once:true });
    if (navigator.userActivation?.isActive) unlock();
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (audio.current) void audio.current.close().catch(() => {});
      audio.current = null;
    };
  }, [enabled]);
  useEffect(() => {
    const before = previous.current;
    previous.current = polls;
    const ctx = audio.current;
    if (!before || !polls || !me || !enabled || ctx?.state !== 'running') return;
    let frequencies: number[] = [];
    for (const p of polls) {
      const old = before.find(item => item.id === p.id);
      if (!old) frequencies = [523, 659];
      else if (!old.closed && p.closed) frequencies = [523, 392];
      else if (p.votes[me] !== old.votes[me]) frequencies = [784];
    }
    frequencies.forEach((frequency, i) => {
      const start = ctx.currentTime + i * 0.09;
      const tone = ctx.createOscillator(), gain = ctx.createGain();
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.045, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      tone.connect(gain); gain.connect(ctx.destination);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
      tone.start(start); tone.stop(start + 0.15);
    });
  }, [polls, me, enabled]);
  return { enabled, toggle() {
    setEnabled(!enabled);
    try { localStorage.setItem(preference, enabled ? 'off' : 'on'); } catch {}
  }};
}
