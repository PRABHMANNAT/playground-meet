'use client';
import { useState } from 'react';
import { ChartNoAxesColumn, Check, Plus } from 'lucide-react';
import { PollComposer } from './poll-composer';
import type { PanelProps } from './types';
import type { Poll } from '@/lib/types';

function Ballot({ poll, data, send, host }: PanelProps & { poll: Poll }) {
  const [pending, setPending] = useState(false);
  const votes = Object.values(poll.votes);
  const selected = poll.votes[data.me.id];
  return (
    <article className="ballot">
      <header>
        <span className="poll-state" data-live={!poll.closed}>
          {poll.closed ? 'Closed' : 'Open'}
        </span>
        <span>
          {votes.length} {votes.length === 1 ? 'vote' : 'votes'}
        </span>
      </header>
      <h3>{poll.question}</h3>
      <div className="ballot-options" role="group" aria-label={poll.question}>
        {poll.options.map((answer, i) => {
          const count = votes.filter((v) => v === i).length;
          const percent = votes.length ? Math.round((count * 100) / votes.length) : 0;
          return (
            <button
              key={i}
              disabled={poll.closed || pending}
              aria-pressed={selected === i}
              aria-label={
                answer + ', ' + count + (count === 1 ? ' vote, ' : ' votes, ') + percent + '%'
              }
              onClick={async () => {
                if (selected === i) return;
                setPending(true);
                try {
                  await send({ type: 'vote', pollId: poll.id, option: i });
                } finally {
                  setPending(false);
                }
              }}
            >
              <span className="ballot-fill" style={{ width: percent + '%' }} aria-hidden="true" />
              <span className="ballot-mark">
                {selected === i ? <Check size={13} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="ballot-answer">{answer}</span>
              <span className="ballot-percent">{percent}%</span>
            </button>
          );
        })}
      </div>
      <footer>
        <span>
          {poll.closed
            ? 'Final results'
            : selected === undefined
              ? 'Choose one answer'
              : 'Your vote is counted'}
        </span>
        {host && !poll.closed && (
          <button
            disabled={pending}
            className="text-button"
            onClick={async () => {
              setPending(true);
              try {
                await send({ type: 'close-poll', pollId: poll.id });
              } finally {
                setPending(false);
              }
            }}
          >
            Close poll
          </button>
        )}
      </footer>
    </article>
  );
}
export function PollsPanel(props: PanelProps) {
  const [creating, setCreating] = useState(false);
  const polls = props.data.meeting.state.polls;
  return (
    <div className="poll-desk">
      {creating ? (
        <PollComposer send={props.send} done={() => setCreating(false)} />
      ) : (
        <>
          {!polls.length && (
            <div className="poll-empty">
              <ChartNoAxesColumn size={28} strokeWidth={1.5} />
              <h3>No polls yet</h3>
              <p>
                {props.host
                  ? 'Ask a question and collect a vote from everyone.'
                  : 'The host’s polls will appear here.'}
              </p>
            </div>
          )}
          {props.host && (
            <button className="button primary" onClick={() => setCreating(true)}>
              <Plus size={15} /> Create a poll
            </button>
          )}
        </>
      )}
      {[...polls].reverse().map((poll) => (
        <Ballot key={poll.id} poll={poll} {...props} />
      ))}
    </div>
  );
}
