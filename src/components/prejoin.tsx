'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Copy, ShieldCheck, LoaderCircle } from 'lucide-react';
import { request } from '@/lib/client';
import { meetingPath, meetingInviteUrl } from '@/lib/meeting-links';
import { Header } from './header';
import { DevicePreview, type Devices } from './device-preview';
import { useToast } from './providers';
import type { Person } from '@/lib/types';
type Info = {
  id: string;
  title: string;
  ended: boolean;
  locked: boolean;
  host: boolean;
  status: string;
};
export function Prejoin({ id, onJoin }: { id: string; onJoin: (devices: Devices) => void }) {
  const [info, setInfo] = useState<Info | null>(null),
    [person, setPerson] = useState<Person | null>(null),
    [name, setName] = useState(''),
    [error, setError] = useState(''),
    [waiting, setWaiting] = useState(false),
    [busy, setBusy] = useState(false),
    [devices, setDevices] = useState<Devices>({
      audio: false,
      video: false,
      audioId: '',
      videoId: '',
    });
  const toast = useToast();
  const onDevices = useCallback((d: Devices) => setDevices(d), []);
  useEffect(() => {
    Promise.all([
      request<Info>('/api/meetings/' + id),
      request<{ person: Person | null }>('/api/session'),
    ])
      .then(([i, s]) => {
        setInfo(i);
        setPerson(s.person);
        setName(s.person?.name || '');
      })
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    if (!waiting) return;
    let active = true;
    const t = setInterval(() => {
      request<Info>('/api/meetings/' + id)
        .then((i) => {
          if (!active) return;
          setInfo(i);
          if (i.status === 'admitted') {
            setWaiting(false);
            onJoin(devices);
          }
          if (i.status === 'denied' || i.ended) {
            setWaiting(false);
            setError(i.ended ? 'The meeting has ended.' : 'The host declined your request.');
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    }, 1500);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [waiting, id, onJoin, devices]);
  return (
    <>
      <Header />
      <main className="prejoin-main" id="main">
        <div className="prejoin-heading">
          <span className="eyebrow">MEETING PREVIEW</span>
          <h1>{info?.title || 'Meeting preview'}</h1>
          <p>Check your camera and microphone before joining.</p>
        </div>
        <div className="prejoin-grid">
          <DevicePreview onChange={onDevices} />
          <section className="join-card">
            <span className="eyebrow">{waiting ? 'WAITING FOR APPROVAL' : 'JOIN MEETING'}</span>
            <h2>{waiting ? 'Waiting for the host' : 'Ready to join?'}</h2>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            {info?.ended ? (
              <>
                <p>This meeting has ended.</p>
                <a className="button primary" href={meetingPath(id, true)}>
                  View meeting recap
                </a>
              </>
            ) : waiting ? (
              <div className="waiting-state">
                <LoaderCircle className="spin" size={38} />
                <p>The host can see your name and will let you in shortly.</p>
                <button className="button secondary" onClick={() => setWaiting(false)}>
                  Back to preview
                </button>
              </div>
            ) : (
              <form
                className="stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError('');
                  try {
                    await request('/api/session', { name });
                    const { status } = await request<{ status: string }>(
                      `/api/meetings/${id}/join`,
                      {},
                    );
                    if (status === 'admitted') onJoin(devices);
                    else setWaiting(true);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Your name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={60}
                    autoComplete="name"
                    placeholder="Enter your name"
                  />
                </label>
                <button className="button primary full" disabled={busy || !info}>
                  {busy
                    ? 'Joining…'
                    : info?.host
                      ? 'Join meeting'
                      : info?.status === 'admitted'
                        ? 'Rejoin meeting'
                        : 'Ask to join'}
                  <ArrowRight size={18} />
                </button>
                <p className="form-footnote">
                  <ShieldCheck size={15} />
                  {info?.host
                    ? 'You’re the host. You decide who joins.'
                    : 'The host will approve your request.'}
                </p>
              </form>
            )}
            <div className="invite-box">
              <span className="eyebrow">INVITE PEOPLE</span>
              <p>Share this link with your team.</p>
              <button
                className="button secondary full"
                onClick={() =>
                  navigator.clipboard
                    .writeText(meetingInviteUrl(id, location.origin))
                    .then(() => toast('Meeting link copied.'))
                    .catch(() => toast('Copy the meeting URL from your address bar.'))
                }
              >
                <Copy size={16} /> Copy invite link
              </button>
              <code>{id}</code>
            </div>
          </section>
        </div>
        <p className="prejoin-footer">Your camera and microphone stay off until you enable them.</p>
      </main>
    </>
  );
}
