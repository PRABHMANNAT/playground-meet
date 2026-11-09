'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { PanelProps } from './types';
import { Avatar } from '../avatar';
export function ChatPanel({ data, send }: PanelProps) {
  const [text, setText] = useState(''),
    [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const followMessages = useRef(true);
  const messages = data.events.filter((e) => e.kind === 'chat');
  useEffect(() => {
    if (followMessages.current)
      ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);
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
            <p>{String(e.payload.text)}</p>
          </article>
        ))}
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
      <p className="panel-helper">Messages are visible to everyone admitted to this meeting.</p>
    </div>
  );
}
