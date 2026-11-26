'use client';
import { useState } from 'react';
import { BookmarkPlus, X } from 'lucide-react';
import { duration } from '@/lib/format';
import type { SharedState } from '@/lib/types';
import type { PanelProps } from './types';

export function BookmarkList({
  entries,
  start,
  canRemove,
  onRemove,
}: {
  entries: NonNullable<SharedState['bookmarks']>;
  start: number;
  canRemove?: (author: string) => boolean;
  onRemove?: (id: string) => void;
}) {
  return (
    <ol className="moment-list">
      {entries.map((mark) => (
        <li key={mark.id}>
          <time dateTime={new Date(mark.created).toISOString()}>
            {duration((mark.created - start) / 1000)}
          </time>
          <div>
            <strong>{mark.label}</strong>
            <small>{mark.name}</small>
          </div>
          {onRemove && canRemove?.(mark.author) && (
            <button
              className="icon-button"
              aria-label={'Remove bookmark ' + mark.label}
              onClick={() => onRemove(mark.id)}
            >
              <X size={14} />
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}

export function BookmarksPanel({ data, send, host }: PanelProps) {
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const entries = data.meeting.state.bookmarks ?? [];
  return (
    <div className="stack">
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          try {
            if (
              await send({
                type: 'bookmark',
                id: crypto.randomUUID(),
                label: label.trim() || 'Meeting moment',
              })
            )
              setLabel('');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Bookmark label{' '}
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional label"
            maxLength={160}
          />
        </label>
        <button className="button primary" disabled={busy}>
          <BookmarkPlus size={16} /> Bookmark this moment
        </button>
      </form>
      <p className="panel-helper">
        Everyone can see these timestamps in the meeting and its recap.
      </p>
      <BookmarkList
        entries={entries}
        start={data.meeting.created}
        canRemove={(author) => host || author === data.me.id}
        onRemove={(id) => void send({ type: 'remove-bookmark', id })}
      />
    </div>
  );
}
