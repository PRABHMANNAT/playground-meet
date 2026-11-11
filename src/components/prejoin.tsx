'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Link2, ShieldCheck, LoaderCircle } from 'lucide-react';
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
  lobby: boolean;
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
  const needsApproval = info?.lobby && !info.host && info.status !== 'admitted';
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
    <div className="meeting-entry">
      <Header />
      <main className="prejoin-main" id="main">
        <div className="prejoin-heading">
          <h1>{info?.title || 'Meeting preview'}</h1>
          {!info?.ended && <p>Device check</p>}
        </div>
        <div className="prejoin-grid" data-ended={info?.ended}>
          {!info?.ended && <DevicePreview onChange={onDevices} />}
          <section className="join-card">
            <h2>
              {info?.ended ? 'Meeting ended' : waiting ? 'Waiting for the host' : 'Your details'}
            </h2>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            {info?.ended ? (
              <a className="button primary full" href={meetingPath(id, true)}>
                View recap <ArrowRight size={17} />
              </a>
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
                    : needsApproval
                      ? 'Ask to join'
                      : !info?.host && info?.status === 'admitted'
                        ? 'Rejoin meeting'
                        : 'Join meeting'}
                  <ArrowRight size={18} />
                </button>
                {(info?.host || needsApproval) && (
                  <p className="form-footnote">
                    <ShieldCheck size={15} />
                    {info?.host ? 'You’re the host' : 'Host approval required'}
                  </p>
                )}
              </form>
            )}
            {!info?.ended && (
              <div className="invite-box">
                <button
                  className="button secondary full"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(meetingInviteUrl(id, location.origin))
                      .then(() => toast('Meeting link copied.'))
                      .catch(() => toast('Copy the meeting URL from your address bar.'))
                  }
                >
                  <Link2 size={17} /> Copy invite link
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
