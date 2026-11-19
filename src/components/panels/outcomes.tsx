'use client';
import { useState, useRef } from 'react';
import { Check, Plus, UserRound } from 'lucide-react';
import type { ActionItem, Decision } from '@/lib/types';
import type { PanelProps } from './types';

export function ActionList({
  items,
  onChange,
  busy = false,
}: {
  items: ActionItem[];
  onChange?: (item: ActionItem) => void;
  busy?: boolean;
}) {
  return (
    <ul className="outcome-list">
      {items.map((item) => (
        <li key={item.id} className="action-record" data-done={item.done}>
          {onChange ? (
            <button
              type="button"
              className="task-check"
              aria-label={(item.done ? 'Reopen ' : 'Complete ') + item.title}
              aria-pressed={item.done}
              disabled={busy}
              onClick={() => onChange(item)}
            >
              {item.done && <Check size={14} />}
            </button>
          ) : (
            <span className="record-status">{item.done ? 'Done' : 'Open'}</span>
          )}
          <div>
            <strong>{item.title}</strong>
            <small>
              <UserRound size={12} aria-hidden="true" />
              {item.ownerName}
              {item.due && (
                <>
                  {' '}
                  · Due <time dateTime={item.due}>{item.due}</time>
                </>
              )}
            </small>
          </div>
        </li>
      ))}
    </ul>
  );
}
export function DecisionList({ decisions }: { decisions: Decision[] }) {
  return (
    <ol className="outcome-list">
      {decisions
        .slice()
        .reverse()
        .map((entry) => (
          <li key={entry.id} className="decision-record">
            <strong>{entry.title}</strong>
            {entry.reason && <p>{entry.reason}</p>}
            <small>
              {entry.recordedBy} ·{' '}
              <time dateTime={new Date(entry.created).toISOString()}>
                {new Date(entry.created).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </small>
          </li>
        ))}
    </ol>
  );
}

export function ActionItemsPanel({ data, send }: PanelProps) {
  const [busy, setBusy] = useState(false);
  const draftId = useRef('');
  const items = data.meeting.state.actionItems ?? [];
  return (
    <div className="outcome-panel">
      <form
        className="stack outcome-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const form = event.currentTarget,
            fields = new FormData(form);
          setBusy(true);
          try {
            draftId.current ||= crypto.randomUUID();
            if (
              await send({
                type: 'action-item',
                id: draftId.current,
                title: String(fields.get('title')),
                ownerId: String(fields.get('owner')),
                due: String(fields.get('due')),
              })
            ) {
              form.reset();
              draftId.current = '';
            }
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Follow-up
          <input name="title" required maxLength={240} placeholder="What needs to happen next?" />
        </label>
        <label>
          Owner
          <select name="owner" defaultValue={data.me.id} required>
            {data.members
              .filter((member) => member.status === 'admitted')
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.id === data.me.id ? ' (you)' : ''}
                </option>
              ))}
          </select>
        </label>
        <label>
          Due date (optional)
          <input type="date" name="due" />
        </label>
        <button className="button primary" disabled={busy}>
          <Plus size={15} /> Add action item
        </button>
      </form>
      <h3>
        Assigned work{' '}
        <span>
          {items.filter((item) => item.done).length}/{items.length} done
        </span>
      </h3>
      {items.length ? (
        <ActionList
          items={items}
          busy={busy}
          onChange={async (item) => {
            setBusy(true);
            try {
              await send({ type: 'action-item-status', id: item.id, done: !item.done });
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : (
        <p className="panel-helper">No action items yet.</p>
      )}
    </div>
  );
}
export function DecisionLogPanel({ data, send }: PanelProps) {
  const [busy, setBusy] = useState(false);
  const draftId = useRef('');
  const decisions = data.meeting.state.decisions ?? [];
  return (
    <div className="outcome-panel">
      <form
        className="stack outcome-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const form = event.currentTarget,
            fields = new FormData(form);
          setBusy(true);
          try {
            draftId.current ||= crypto.randomUUID();
            if (
              await send({
                type: 'decision',
                id: draftId.current,
                title: String(fields.get('title')),
                reason: String(fields.get('reason')),
              })
            ) {
              form.reset();
              draftId.current = '';
            }
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Decision
          <input name="title" required maxLength={240} placeholder="What did the team agree on?" />
        </label>
        <label>
          Rationale (optional)
          <textarea
            rows={3}
            name="reason"
            maxLength={1200}
            placeholder="Why did you choose this direction?"
          />
        </label>
        <button className="button primary" disabled={busy}>
          <Plus size={15} /> Record decision
        </button>
      </form>
      <h3>
        Recorded decisions <span>{decisions.length}</span>
      </h3>
      {decisions.length ? (
        <DecisionList decisions={decisions} />
      ) : (
        <p className="panel-helper">No decisions recorded yet.</p>
      )}
    </div>
  );
}
