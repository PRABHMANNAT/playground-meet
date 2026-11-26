'use client';
import { useEffect, useRef, useState } from 'react';
import {
  MessagesSquare,
  ArrowUp,
  Paperclip,
  Download,
  Maximize2,
  FileText,
  Presentation,
  MapPin,
  Sticker,
  Users,
  LockKeyhole,
  ExternalLink,
} from 'lucide-react';
import { attachmentProblem, fileSize, attachmentChunkBytes } from '@/lib/attachments';
import type { PanelProps } from './types';
import { Avatar } from '../avatar';
import { Dialog } from '../dialog';
import { previewFromName } from '@/lib/attachment-preview';
import type { Event } from '@/lib/types';
import { reactionNames } from '@/lib/reaction-library';
import { ReactionIcon, StickerLibrary } from '../reactions';
import { ChatLocationDialog, mapLink, type ChatLocation } from './chat-location';

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
  const FileIcon = /\.(pptx?|odp|key)$/i.test(filename) ? Presentation : FileText;
  const download = (
    <a className="chat-download" download href={url} aria-label={'Download ' + filename}>
      <FileIcon size={19} aria-hidden="true" />
      <span>
        {filename}
        <small>{fileSize(Number(payload.size))}</small>
      </span>
      <Download size={15} aria-hidden="true" />
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
  const [recipient, setRecipient] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState<'stickers' | 'location' | null>(null);
  const [dragging, setDragging] = useState(false);
  const text = drafts[recipient] ?? '';
  const member = data.members.find((m) => m.id === recipient);
  const messages = data.events.filter((e) => e.kind === 'chat' || e.kind === 'attachment');
  const peers = new Map<string, string>();
  for (const m of data.members)
    if (m.id !== data.me.id && m.status === 'admitted') peers.set(m.id, m.name);
  const conversations = new Set<string>();
  for (const event of messages) {
    if (typeof event.payload.recipient !== 'string') continue;
    const id = event.actor === data.me.id ? event.payload.recipient : event.actor;
    conversations.add(id);
    if (!peers.has(id))
      peers.set(
        id,
        data.members.find((m) => m.id === id)?.name ??
          (event.actor === id ? event.name : 'Former participant'),
      );
  }
  const audience = recipient ? (peers.get(recipient) ?? 'Former participant') : 'Everyone';
  const canSend = !recipient || member?.status === 'admitted';
  const thread = messages.filter((e) =>
    recipient
      ? (e.actor === data.me.id && e.payload.recipient === recipient) ||
        (e.actor === recipient && e.payload.recipient === data.me.id)
      : !e.payload.recipient,
  );
  const ref = useRef<HTMLDivElement>(null);
  const chooser = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [image, setImage] = useState<SharedImage | null>(null);
  const attachmentUrl = '/api/meetings/' + data.meeting.id + '/attachments';
  async function upload(file: File) {
    const error = attachmentProblem(file.name, file.size);
    if (error || file.webkitRelativePath) {
      throw new Error(error || 'Choose a file instead of a folder.');
    }
    setUploadStatus('Uploading ' + file.name + ' · 0%');
    const start = await fetch(attachmentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, size: file.size, recipient: recipient || undefined }),
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
  }
  async function uploadFiles(files: File[]) {
    if (busy || !canSend || !files.length) return;
    setBusy(true);
    const errors: string[] = [];
    try {
      for (const file of files) {
        try {
          await upload(file);
        } catch (e) {
          errors.push(file.name + ' — ' + (e instanceof Error ? e.message : 'Upload failed.'));
        }
      }
      const count = files.length - errors.length;
      setUploadStatus(
        [
          count ? count + (count === 1 ? ' file' : ' files') + ' sent to ' + audience + '.' : '',
          ...errors,
        ]
          .filter(Boolean)
          .join(' '),
      );
    } finally {
      setBusy(false);
    }
  }
  const followMessages = useRef(true);
  useEffect(() => {
    if (followMessages.current)
      ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [recipient, thread.at(-1)?.id]);
  function switchTo(id: string) {
    followMessages.current = true;
    setRecipient(id);
    setUploadStatus('');
    setTool(null);
  }
  async function post(
    content: { text: string } | { sticker: string } | { location: ChatLocation },
  ) {
    if (busy || !canSend) return false;
    setBusy(true);
    followMessages.current = true;
    try {
      return await send({ type: 'chat', recipient: recipient || undefined, ...content });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="chat-panel"
      data-dragging={dragging}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void uploadFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="chat-audience">
        {recipient ? <LockKeyhole size={17} /> : <Users size={17} />}
        <label>
          Send to
          <select
            aria-label="Send to"
            value={recipient}
            onChange={(e) => switchTo(e.target.value)}
            disabled={busy}
          >
            <option value="">Everyone</option>
            {Array.from(peers, ([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
            {recipient && !peers.has(recipient) && (
              <option value={recipient}>Former participant</option>
            )}
          </select>
        </label>
      </div>
      {!recipient && conversations.size > 0 && (
        <div className="chat-conversations" aria-label="Direct conversations">
          {[...conversations].reverse().map((id) => (
            <button key={id} type="button" disabled={busy} onClick={() => switchTo(id)}>
              <LockKeyhole size={12} />
              {peers.get(id)}
            </button>
          ))}
        </div>
      )}
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
        {!thread.length && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <MessagesSquare size={36} strokeWidth={1.5} />
            </div>
            <strong>{recipient ? 'Direct chat with ' + audience : 'Start the conversation'}</strong>
            <small>
              {recipient ? 'Visible to the two of you.' : 'Everyone in the meeting can join in.'}
            </small>
          </div>
        )}
        {thread.map((e) => (
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
            ) : typeof e.payload.sticker === 'string' ? (
              <div
                className="chat-sticker-message"
                role="img"
                aria-label={reactionNames[e.payload.sticker] ?? e.payload.sticker}
              >
                <ReactionIcon emoji={e.payload.sticker} size={96} />
              </div>
            ) : e.payload.location ? (
              <a
                className="chat-map"
                href={mapLink(e.payload.location as ChatLocation)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={19} />
                <span>
                  {(e.payload.location as ChatLocation).label}
                  <small>Open in OpenStreetMap</small>
                </span>
                <ExternalLink size={14} />
              </a>
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
      {tool === 'stickers' && (
        <Dialog open onClose={() => setTool(null)} title={'Send a sticker to ' + audience}>
          <div className="sticker-picker chat-sticker-shelf">
            <StickerLibrary
              onSelect={async (sticker) => {
                if (await post({ sticker })) setTool(null);
              }}
            />
          </div>
        </Dialog>
      )}
      {tool === 'location' && (
        <ChatLocationDialog
          audience={audience}
          close={() => setTool(null)}
          send={(location) => post({ location })}
        />
      )}
      <input
        ref={chooser}
        type="file"
        multiple
        aria-label="Choose files to share"
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          void uploadFiles(files);
        }}
      />
      <div role="status" className="panel-helper">
        {dragging
          ? 'Drop files for ' + audience
          : !canSend
            ? 'This participant is unavailable.'
            : uploadStatus}
      </div>
      <form
        className="chat-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim() || busy) return;
          if (await post({ text })) setDrafts((current) => ({ ...current, [recipient]: '' }));
        }}
      >
        <input
          aria-label={'Message ' + audience}
          value={text}
          onChange={(e) => setDrafts({ ...drafts, [recipient]: e.target.value })}
          placeholder={'Message ' + audience + '…'}
          maxLength={2000}
          required
          disabled={busy || !canSend}
        />
        <button
          className="button primary"
          aria-label="Send message"
          disabled={busy || !canSend || !text.trim()}
        >
          <ArrowUp size={18} />
        </button>
      </form>
      <div className="chat-tools" role="group" aria-label="Share in this conversation">
        <button type="button" disabled={busy || !canSend} onClick={() => setTool('stickers')}>
          <Sticker size={16} />
          Stickers
        </button>
        <button type="button" disabled={busy || !canSend} onClick={() => setTool('location')}>
          <MapPin size={16} />
          Location
        </button>
        <button
          type="button"
          title="Documents, presentations, images and other files · 200 MB each"
          disabled={busy || !canSend}
          onClick={() => chooser.current?.click()}
        >
          <Paperclip size={16} />
          Files
        </button>
      </div>
    </div>
  );
}
