'use client';
import { useState } from 'react';
import { BarChart3, Plus } from 'lucide-react';
import type { PanelProps } from './types';
export function PollsPanel({ data, send, host }: PanelProps) {
  const [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <>
      {data.meeting.state.polls.length === 0 && !creating && (
        <div className="empty-state">
          <BarChart3 size={30} />
          Let’s find out what everyone thinks.
        </div>
      )}
      {data.meeting.state.polls.map((p) => {
        const votes = Object.values(p.votes);
        return (
          <article className="poll-card" key={p.id}>
            <h3>{p.question}</h3>
            {p.options.map((option, i) => {
              const count = votes.filter((v) => v === i).length;
              return (
                <button
                  className="poll-option"
                  style={
                    {
                      '--percent': `${votes.length ? (count / votes.length) * 100 : 0}%`,
                    } as React.CSSProperties
                  }
                  key={i}
                  disabled={p.closed}
                  aria-pressed={p.votes[data.me.id] === i}
                  onClick={() => send({ type: 'vote', pollId: p.id, option: i })}
                >
                  <span>
                    {option}
                    <b>{count}</b>
                  </span>
                </button>
              );
            })}
            <div className="poll-meta">
              <span>
                {votes.length} votes · {p.closed ? 'Closed' : 'Live'}
              </span>
              {host && !p.closed && (
                <button
                  className="text-button"
                  onClick={() => send({ type: 'close-poll', pollId: p.id })}
                >
                  Close poll
                </button>
              )}
            </div>
          </article>
        );
      })}
      {host &&
        (creating ? (
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const f = new FormData(e.currentTarget);
              if (
                await send({
                  type: 'poll',
                  question: String(f.get('question')),
                  options: String(f.get('options'))
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              )
                setCreating(false);
              setBusy(false);
            }}
          >
            <label>
              Question
              <input
                name="question"
                required
                maxLength={200}
                placeholder="Which direction feels right?"
              />
            </label>
            <label>
              Options, one per line
              <textarea
                name="options"
                required
                rows={4}
                placeholder={'Option one\nOption two'}
                maxLength={600}
              />
            </label>
            <p className="panel-helper">Add 2–6 options. Everyone gets one vote.</p>
            <button className="button primary" disabled={busy}>
              Launch poll
            </button>
            <button className="text-button" type="button" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button className="button secondary full" onClick={() => setCreating(true)}>
            <Plus size={15} /> Create a poll
          </button>
        ))}
    </>
  );
}
