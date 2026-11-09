'use client';
import { useState } from 'react';
import { ArrowRight, Plus, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { request } from '@/lib/client';
import { parseMeetingLink } from '@/lib/format';
import { useToast } from './providers';
import type { Person } from '@/lib/types';
export function MeetingForm({
  person,
  onChange,
}: {
  person: Person | null;
  onChange: (p: Person) => void;
}) {
  const [mode, setMode] = useState<'start' | 'join'>('start'),
    [busy, setBusy] = useState(false);
  const router = useRouter(),
    toast = useToast();
  return (
    <section className="launch-card" id="start">
      <div className="launch-tabs" role="tablist" aria-label="Meeting action">
        <button role="tab" aria-selected={mode === 'start'} onClick={() => setMode('start')}>
          <Plus size={16} /> New meeting
        </button>
        <button role="tab" aria-selected={mode === 'join'} onClick={() => setMode('join')}>
          <LinkIcon size={16} /> Join a meeting
        </button>
      </div>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          try {
            const { person: p } = await request<{ person: Person }>('/api/session', {
              name: f.get('name'),
            });
            onChange(p);
            if (mode === 'start') {
              const { id } = await request<{ id: string }>('/api/meetings', {
                title: f.get('title'),
                lobby: true,
              });
              router.push('/room/' + id);
            } else {
              const id = parseMeetingLink(String(f.get('link')));
              if (!/^[a-f0-9]{6}-[a-f0-9]{6}-[a-f0-9]{6}$/.test(id))
                throw new Error('Paste a valid meeting link or code.');
              router.push('/room/' + id);
            }
          } catch (e) {
            toast((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Your name
          <input
            name="name"
            placeholder="What should we call you?"
            defaultValue={person?.name}
            key={person?.id}
            required
            maxLength={60}
            autoComplete="name"
          />
        </label>
        {mode === 'start' ? (
          <label>
            Meeting name
            <input
              name="title"
              placeholder="A space for your next big idea"
              defaultValue="Let's build something"
              required
              maxLength={100}
            />
          </label>
        ) : (
          <label>
            Meeting link or code
            <input name="link" placeholder="Paste your invite link" required autoComplete="off" />
          </label>
        )}
        <button className="button primary full" disabled={busy}>
          {busy
            ? 'Getting your space ready…'
            : mode === 'start'
              ? 'Start a conversation'
              : 'Join the conversation'}
          <ArrowRight size={18} />
        </button>
        <div className="form-footnote">
          <ShieldCheck size={14} />
          <span>
            {mode === 'start'
              ? 'Your room. Your guest list. Waiting room on.'
              : 'You’ll preview your camera before joining.'}
          </span>
        </div>
      </form>
    </section>
  );
}
