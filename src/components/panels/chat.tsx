'use client';
import { useEffect, useRef, useState } from 'react';
import { MessagesSquare, ArrowUp, Paperclip, Download, Maximize2 } from 'lucide-react';
import { attachmentProblem, fileSize, attachmentChunkBytes } from '@/lib/attachments';
import type { PanelProps } from './types';
import { Avatar } from '../avatar';
import { Dialog } from '../dialog';
import { previewFromName } from '@/lib/attachment-preview';
import type { Event } from '@/lib/types';

type SharedImage = { url: string; filename: string };
function ChatAttachment({
  payload,
  baseUrl,
  openImage,
}: {
  payload: Event['payload'];
  baseUrl: string;
  openImage: (image: SharedImage) => void;
}) {
  const [failed, setFailed] = useState(false);
  const filename = String(payload.filename);
  const url = baseUrl + '/' + encodeURIComponent(String(payload.file));
  const previewUrl = url + '?preview=1';
  const kind = payload.preview === undefined ? previewFromName(filename) : payload.preview;
  const download = (
    <a className="chat-download" download href={url} aria-label={'Download ' + filename}>
      <Download size={17} aria-hidden="true" />
      <span>
        {filename}
        <small>{fileSize(Number(payload.size))}</small>
      </span>
    </a>
  );
  if (kind !== 'image' && kind !== 'video') return download;
  return (
    <div className="chat-media">
      {failed ? (
        <span className="chat-media-error">Preview unavailable</span>
      ) : kind === 'image' ? (
        <button
          className="chat-photo"
          type="button"
          aria-label={'Enlarge ' + filename}
          onClick={() => openImage({ url: previewUrl, filename })}
        >
          <img
            src={previewUrl}
            alt={filename}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
          <span aria-hidden="true">
            <Maximize2 size={14} />
          </span>
        </button>
      ) : (
        <video
          controls
          playsInline
          preload="metadata"
          aria-label={filename}
          src={previewUrl}
          onError={() => setFailed(true)}
        />
      )}
      {download}
    </div>
  );
}
export function ChatPanel({ data, send }: PanelProps) {
  const [text, setText] = useState(''),
    [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chooser = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [image, setImage] = useState<SharedImage | null>(null);
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
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <MessagesSquare size={36} strokeWidth={1.5} />
            </div>
            <strong>No messages yet</strong>
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
              <ChatAttachment payload={e.payload} baseUrl={attachmentUrl} openImage={setImage} />
            ) : (
              <p>{String(e.payload.text)}</p>
            )}
          </article>
        ))}
      </div>
      {image && (
        <Dialog open title={image.filename} onClose={() => setImage(null)}>
          <img className="chat-image-full" src={image.url} alt={image.filename} />
        </Dialog>
      )}
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
          placeholder="Message everyone…"
          maxLength={2000}
          required
          disabled={busy}
        />
        <button
          className="button primary"
          aria-label="Send message"
          disabled={busy || !text.trim()}
        >
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  );
}
