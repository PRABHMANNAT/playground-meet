'use client';
import { useEffect, useState } from 'react';
import { Timer, Square } from 'lucide-react';
import { duration } from '@/lib/format';
import type { PanelProps } from './types';
export function TimerPanel({ data, send, host }: PanelProps) {
  const [now, setNow] = useState(Date.now());
  const offset = data.clockOffset || 0;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  const t = data.meeting.state.timer;
  const remaining = t.endsAt ? Math.max(0, (t.endsAt - now - offset) / 1000) : t.duration;
  return (
    <div className="stack">
      <div className="timer-display">
        <Timer size={25} style={{ margin: 'auto' }} />
        <strong>{duration(remaining)}</strong>
        <p>
          {t.endsAt
            ? remaining > 0
              ? 'Focus timer is running.'
              : 'Timer finished.'
            : 'Choose a duration to start.'}
        </p>
      </div>
      {host ? (
        <>
          <div className="timer-presets">
            {[5, 10, 25].map((minutes) => (
              <button
                className="button secondary"
                key={minutes}
                onClick={() => send({ type: 'timer', seconds: minutes * 60 })}
              >
                {minutes} min
              </button>
            ))}
          </div>
          <button className="button secondary" onClick={() => send({ type: 'timer', seconds: 0 })}>
            <Square size={14} /> Stop timer
          </button>
        </>
      ) : (
        <p className="panel-helper">The host can start a focus timer for everyone.</p>
      )}
    </div>
  );
}
