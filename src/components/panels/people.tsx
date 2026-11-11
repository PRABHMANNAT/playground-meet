'use client';
import { useRef, useState } from 'react';
import { Check, X, MicOff, Hand, UserMinus } from 'lucide-react';
import type { PanelProps } from './types';
import { Avatar } from '../avatar';
import { useParticipants } from '@livekit/components-react';
export function PeoplePanel({ data, send, host }: PanelProps) {
  const connected = useParticipants();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const moderate: PanelProps['send'] = async (action) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    try {
      return await send(action);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  return (
    <>
      <h3 className="people-section-title">
        Participants <span>{connected.length}</span>
      </h3>
      {data.members
        .filter((m) => m.status !== 'denied' && (host || m.status === 'admitted'))
        .map((m) => (
          <div className="member" key={m.id}>
            <Avatar
              name={m.name}
              status={connected.some((p) => p.identity === m.id) ? 'online' : 'away'}
            />
            <div className="member-info">
              <strong>
                {m.name}
                {m.id === data.me.id ? ' (you)' : ''}
              </strong>
              <small>
                {m.status === 'waiting'
                  ? 'Waiting for admission'
                  : m.id === data.meeting.host
                    ? 'Host'
                    : connected.some((p) => p.identity === m.id)
                      ? 'Connected'
                      : 'Away'}
              </small>
            </div>
            {m.hand && <Hand size={15} color="#e99447" />}
            {host && m.id !== data.me.id && (
              <div className="member-actions">
                {m.status === 'waiting' ? (
                  <>
                    <button
                      className="icon-button"
                      aria-label={`Admit ${m.name}`}
                      disabled={pending}
                      onClick={() => moderate({ type: 'admit', memberId: m.id })}
                    >
                      <Check />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Decline ${m.name}`}
                      disabled={pending}
                      onClick={() => moderate({ type: 'remove', memberId: m.id })}
                    >
                      <X />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="icon-button"
                      aria-label={`Mute ${m.name}`}
                      disabled={pending}
                      onClick={() => moderate({ type: 'mute', memberId: m.id })}
                    >
                      <MicOff />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${m.name}`}
                      disabled={pending}
                      onClick={() => moderate({ type: 'remove', memberId: m.id })}
                    >
                      <UserMinus />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      {host && (
        <div className="host-settings">
          <h3 className="people-section-title">Host controls</h3>
          <label className="toggle-row">
            <span>
              Waiting room<small>Require approval for new requests</small>
            </span>
            <input
              type="checkbox"
              checked={data.meeting.lobby}
              disabled={pending}
              onChange={(e) => moderate({ type: 'lobby', enabled: e.target.checked })}
            />
          </label>
          <label className="toggle-row">
            <span>
              Lock meeting<small>Stop new requests to join</small>
            </span>
            <input
              type="checkbox"
              checked={data.meeting.locked}
              disabled={pending}
              onChange={(e) => moderate({ type: 'lock', locked: e.target.checked })}
            />
          </label>
          {pending && (
            <p role="status" className="panel-helper">
              Updating meeting…
            </p>
          )}
          <p className="panel-helper">
            People already admitted can reconnect. Muted participants can turn their microphone back
            on.
          </p>
        </div>
      )}
    </>
  );
}
