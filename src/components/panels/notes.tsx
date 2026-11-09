'use client';
import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import type { PanelProps } from './types';
export function NotesPanel({ data, send }: PanelProps) {
  const state = data.meeting.state;
  const key = `meet-notes:${data.meeting.id}:${data.me.id}`;
  const [draft] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(key) || 'null') as {
        text: string;
        version: number;
      } | null;
    } catch {
      return null;
    }
  });
  const [text, setText] = useState(draft?.text ?? state.notes),
    [version, setVersion] = useState(draft?.version ?? state.notesVersion),
    [dirty, setDirty] = useState(Boolean(draft)),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!dirty) {
      setText(state.notes);
      setVersion(state.notesVersion);
    }
  }, [state.notes, state.notesVersion, dirty]);
  useEffect(() => {
    if (dirty) sessionStorage.setItem(key, JSON.stringify({ text, version }));
    else sessionStorage.removeItem(key);
  }, [dirty, text, version, key]);
  const conflict = dirty && version !== state.notesVersion;
  return (
    <div className="stack">
      <p className="panel-helper">
        Notes are shared with everyone in the meeting. Save your changes when ready.
      </p>
      <textarea
        className="notes-editor"
        aria-label="Shared meeting notes"
        placeholder="Add meeting notes…"
        value={text}
        maxLength={20000}
        disabled={busy}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
      />
      {conflict && (
        <p role="alert" className="notes-warning">
          Someone saved a newer version. Copy your draft before loading their changes.
        </p>
      )}
      <div className="field-row">
        <button
          className="button primary"
          disabled={!dirty || busy || conflict}
          onClick={async () => {
            setBusy(true);
            if (await send({ type: 'notes', text, version })) setDirty(false);
            setBusy(false);
          }}
        >
          <Save size={15} />
          {busy ? 'Saving…' : 'Save notes'}
        </button>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => {
            setText(state.notes);
            setVersion(state.notesVersion);
            setDirty(false);
          }}
        >
          <RefreshCw size={15} /> Load latest
        </button>
      </div>
      <span className="panel-helper">
        {text.length.toLocaleString()} / 20,000 characters ·{' '}
        {dirty ? 'Unsaved draft' : 'All changes saved'}
      </span>
    </div>
  );
}
