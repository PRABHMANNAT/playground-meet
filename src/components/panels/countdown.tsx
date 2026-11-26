'use client';
import { useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { duration } from '@/lib/format';
import { timerSeconds } from '@/lib/meeting-timer';
import type { Action } from '@/lib/schemas';
import type { PanelProps } from './types';

export function CountdownPanel({ data, host, send, now }: PanelProps & { now: number }) {
  const timer = data.meeting.state.timer;
  const [minutes, setMinutes] = useState(
    String(Math.max(1, Math.round((timer.duration || 300) / 60))),
  );
  const [busy, setBusy] = useState(false);
  const remaining = timerSeconds(timer, now + (data.clockOffset ?? 0));
  const paused = !!timer.pausedSeconds;
  const running = !!timer.endsAt && remaining > 0;
  const finished = !!timer.endsAt && !remaining;
  const valid = Number.isInteger(Number(minutes)) && Number(minutes) >= 1 && Number(minutes) <= 60;
  async function update(action: Action) {
    setBusy(true);
    try {
      await send(action);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack timebox-panel">
      <div className="timebox-face">
        <span role="status">
          {paused ? 'Paused' : running ? 'Counting down' : finished ? 'Time’s up' : 'Ready'}
        </span>
        <strong role="timer" aria-label="Time remaining">
          {duration(
            paused || running || finished
              ? remaining
              : host && valid
                ? Number(minutes) * 60
                : timer.duration || 300,
          )}
        </strong>
      </div>
      {host ? (
        running || paused ? (
          <div className="field-row">
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                void update({ type: 'timer-control', operation: paused ? 'resume' : 'pause' })
              }
            >
              {paused ? <Play size={15} /> : <Pause size={15} />} {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void update({ type: 'timer', seconds: 0 })}
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              if (valid && !busy) void update({ type: 'timer', seconds: Number(minutes) * 60 });
            }}
          >
            <label>
              Duration in minutes
              <input
                type="number"
                min="1"
                max="60"
                step="1"
                required
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </label>
            <button className="button primary" disabled={!valid || busy}>
              <Play size={15} /> Start countdown
            </button>
          </form>
        )
      ) : (
        <p className="panel-helper">The host controls the countdown for everyone.</p>
      )}
    </div>
  );
}
