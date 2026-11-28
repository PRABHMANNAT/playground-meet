'use client';
import { useEffect, useState } from 'react';
import { LockKeyhole, Users, Radio, NotebookPen } from 'lucide-react';
import type { PanelProps } from './types';
import { LiveNoteEditor } from './live-note-editor';
import { SavedMeetingNotes } from './saved-meeting-notes';

function stored(key: string) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function NotesPanel(props: PanelProps) {
  const { data, send, host } = props;
  const { liveNote: live, notesVersion } = data.meeting.state;
  const key = 'meet-private-note:' + data.meeting.id + ':' + data.me.id;
  const [draft, setDraft] = useState(() => stored(key) ?? '');
  const [view, setView] = useState<'private' | 'meeting'>(live ? 'meeting' : 'private');
  const [busy, setBusy] = useState(false);
  const [storedHere, setStoredHere] = useState(true);
  const [pending, setPending] = useState(false);
  const owner = live?.owner === data.me.id;
  const shared = !!live && (owner || view === 'meeting');
  function remember(text: string) {
    setDraft(text);
    try { sessionStorage.setItem(key, text); setStoredHere(true); }
    catch { setStoredHere(false); }
  }
  useEffect(() => {
    if (owner && live) remember(live.text);
  }, [owner, live?.id, live?.text]);
  async function share() {
    setBusy(true);
    try { if (await send({type: 'note-share', text: draft})) setView('meeting'); }
    finally { setBusy(false); }
  }
  async function stop() {
    if (!live) return;
    setBusy(true);
    try { if (await send({type: 'note-stop', id: live.id})) setView('private'); }
    finally { setBusy(false); }
  }
  return <div className="notebook">
    <div className="note-audience" aria-label="Note audience" role="group">
      <button aria-pressed={!shared} disabled={busy || (owner && pending)} onClick={() => owner ? void stop() : setView('private')}><LockKeyhole size={14}/> Only me</button>
      <button aria-pressed={shared} disabled={busy} onClick={() => live ? setView('meeting') : void share()}><Users size={15}/> {live ? 'Meeting' : 'Share with everyone'}</button>
    </div>
    <section className="note-sheet">
      <header><NotebookPen size={17}/><h3>{shared ? live.name + '’s note' : 'My note'}</h3></header>
      {live && <div className="live-note-body" hidden={!shared}><LiveNoteEditor key={live.id} note={live} editable={owner || live.editable} send={send} storageKey={key + ':' + live.id} onPending={setPending} onRecover={text => { remember(text); setView('private'); }}/> </div>}
      {!shared &&
        <textarea className="notebook-input" aria-label="My private note" placeholder="Start writing…" value={draft} maxLength={20000} onChange={e => remember(e.target.value)} />}
    </section>
    {shared && owner && <label className="note-access"><input type="checkbox" checked={live.editable} disabled={busy} onChange={async e => {
      setBusy(true);
      try { await send({type:'note-access', id: live.id, editable: e.target.checked}); }
      finally { setBusy(false); }
    }}/> Allow others to edit</label>}
    <div className="note-foot">
      <span>{shared ? <Radio size={14}/> : <LockKeyhole size={13}/>} {shared ? 'Visible to everyone' : storedHere ? 'Private to this tab' : 'Available until this panel closes'}</span>
      {shared && (owner || host) && <button className="text-button" disabled={busy || (owner && pending)} onClick={stop}>Stop sharing</button>}
    </div>
    {(notesVersion > 0 || !!stored('meet-notes:' + data.meeting.id + ':' + data.me.id)) &&
      <details className="previous-note"><summary>Saved meeting notes</summary><SavedMeetingNotes {...props}/></details>}
  </div>;
}
