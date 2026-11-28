'use client';
import { useEffect, useRef, useState } from 'react';
import type { SharedState } from '@/lib/types';
import { mergeNote } from '@/lib/note-merge';
import type { PanelProps } from './types';

type Draft = { base: string; version: number; text: string };
export function LiveNoteEditor({ note, editable, send, onRecover, storageKey }: {
  note: NonNullable<SharedState['liveNote']>;
  editable: boolean;
  send: PanelProps['send'];
  onRecover: (text: string) => void;
  storageKey: string;
}) {
  const [draft, setDraft] = useState<Draft | null>(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
      return d && typeof d.text === 'string' && typeof d.base === 'string' && Number.isInteger(d.version) ? d : null;
    } catch { return null; }
  });
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(draft);
  latest.current = draft;
  const changed = !!draft && draft.version < note.version;
  const merged = draft && changed ? mergeNote(draft.base, draft.text, note.text) : null;
  const conflict = changed && merged === null;
  useEffect(() => {

    try {
      if (draft) sessionStorage.setItem(storageKey, JSON.stringify(draft));
      else sessionStorage.removeItem(storageKey);
    } catch {}
  }, [draft, storageKey]);
  const recover = useRef(onRecover);
  recover.current = onRecover;
  useEffect(() => () => {
    if (latest.current) recover.current(latest.current.text);
  }, []);
  useEffect(() => {
    if (!saving && changed && merged !== null) {
      setDraft(merged === note.text ? null : { base: note.text, version: note.version, text: merged });
      setFailed(false);
    }
  }, [saving, changed, merged, note.text, note.version]);
  const ready = !!draft && !saving && !failed && !changed && editable && draft.version === note.version;
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      const edit = latest.current;
      if (!edit) return;
      setSaving(true);
      try {
        if (await send({type:'note-edit', id:note.id, version:edit.version, text:edit.text})) {
          setDraft(d => !d || d.text === edit.text ? null : { base:edit.text, version:edit.version+1, text:d.text });
        } else setFailed(true);
      } finally { setSaving(false); }
    }, 450);
    return () => clearTimeout(timer);
  }, [ready, note.id, send, note.version]);
  return <>
    <textarea className="notebook-input" aria-label="Live meeting note" value={draft?.text ?? note.text}
      placeholder={editable ? 'Start writing…' : 'Waiting for the presenter…'} readOnly={!editable} maxLength={20000}
      onChange={e => { const text = e.target.value; setFailed(false); setDraft(d => d ? {...d, text} : {base:note.text, version:note.version, text}); }}/>
    {draft && (conflict || !editable) ? <div className="note-resolution" role="status">
      <p>{conflict ? 'Someone edited the same passage.' : 'Editing access changed.'} Keep a private copy or load the meeting version.</p>
      <button className="text-button" onClick={() => { onRecover(draft.text); setDraft(null); }}>Keep private copy</button>
      <button className="text-button" onClick={() => setDraft(null)}>Load meeting version</button>
    </div> : failed ? <button className="text-button" onClick={() => setFailed(false)}>Retry saving</button> :
      <small className="note-sync">{draft || saving ? 'Syncing…' : editable ? 'Up to date' : 'View only'}</small>}
  </>;
}
