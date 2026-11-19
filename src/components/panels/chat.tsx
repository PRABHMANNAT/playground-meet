'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Paperclip, Download } from 'lucide-react';
import { attachmentProblem, fileSize, attachmentChunkBytes } from '@/lib/attachments';
import type { PanelProps } from './types';
import { Avatar } from '../avatar';
export function ChatPanel({ data, send }: PanelProps) {
  const [text, setText] = useState(''),
    [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chooser = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const attachmentUrl = '/api/meetings/' + data.meeting.id + '/attachments';
  async function upload(file: File) {
    const error = attachmentProblem(file.name, file.size);
    if (error || file.webkitRelativePath) {
      setUploadStatus(error || 'Choose a file instead of a folder.');
      return;
    }
    setBusy(true);
    setUploadStatus('Uploading ' + file.name + ' · 0%');
    try {
      const start = await fetch(attachmentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, size: file.size }),
      });
      const result = await start.json();
      if (!start.ok) throw new Error(result.error || 'Upload could not start.');
      for (let offset = 0; offset < file.size; offset += attachmentChunkBytes) {
        const part = file.slice(offset, offset + attachmentChunkBytes);
        const response = await fetch(attachmentUrl + '/' + result.file, {
          method: 'PUT',
          headers: { 'X-File-Offset': String(offset) },
          body: part,
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Upload failed.');
        setUploadStatus(
          'Uploading ' +
            file.name +
            ' · ' +
            Math.floor((100 * (offset + part.size)) / file.size) +
            '%',
        );
      }
      followMessages.current = true;
      setUploadStatus('File shared.');
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }
  const followMessages = useRef(true);
  const messages = data.events.filter((e) => e.kind === 'chat' || e.kind === 'attachment');
  useEffect(() => {
    if (followMessages.current)
      ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [messages.at(-1)?.id]);
  return (
    <div className="chat-panel">
      <div
        className="chat-messages"
        ref={ref}
        role="log"
        aria-label="Meeting chat"
        onScroll={(e) => {
          const el = e.currentTarget;
          followMessages.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {!messages.length && (
          <div className="empty-state">
            <MessageSquare size={28} />
            No messages yet.
          </div>
        )}
        {messages.map((e) => (
          <article className={'chat-message ' + (e.actor === data.me.id ? 'mine' : '')} key={e.id}>
            <header>
              <Avatar name={e.name} />
              <strong>{e.name}</strong>
              <time>
                {new Date(e.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </header>
            {e.kind === 'attachment' ? (
              <a
                className="chat-download"
                download
                href={attachmentUrl + '/' + encodeURIComponent(String(e.payload.file))}
              >
                <Download size={18} />
                <span>
                  {String(e.payload.filename)}
                  <small>{fileSize(Number(e.payload.size))}</small>
                </span>
              </a>
            ) : (
              <p>{String(e.payload.text)}</p>
            )}
          </article>
        ))}
      </div>
      <input
        ref={chooser}
        type="file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file && !busy) void upload(file);
        }}
      />
      <div role="status" className="panel-helper">
        {uploadStatus}
      </div>
      <form
        className="chat-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim() || busy) return;
          setBusy(true);
          followMessages.current = true;
          if (await send({ type: 'chat', text })) setText('');
          setBusy(false);
        }}
      >
        <button
          type="button"
          className="button"
          aria-label="Attach a file"
          title="Attach a file (up to 200 MB)"
          disabled={busy}
          onClick={() => chooser.current?.click()}
        >
          <Paperclip size={17} />
        </button>
        <input
          aria-label="Message everyone"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message everyone"
          maxLength={2000}
          required
          disabled={busy}
        />
        <button className="button primary" aria-label="Send message" disabled={busy}>
          <Send size={16} />
        </button>
      </form>
      <p className="panel-helper">
        Share individual files up to 200 MB with everyone in this meeting.
      </p>
    </div>
  );
}
