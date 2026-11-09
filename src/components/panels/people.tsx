'use client';
import { Check, X, MicOff, Hand, UserMinus } from 'lucide-react';
import type { PanelProps } from './types';
import { initials } from '@/lib/format';
import { useParticipants } from '@livekit/components-react';
export function PeoplePanel({ data, send, host, demoNames = [], onRemoveDemo }: PanelProps) {
  const connected = useParticipants();
  return (
    <>
      <h3 className="people-section-title">
        Participants <span>{connected.length}</span>
      </h3>
      {data.members
        .filter((m) => m.status !== 'denied' && (host || m.status === 'admitted'))
        .map((m) => (
          <div className="member" key={m.id}>
            <span className="member-avatar">{initials(m.name)}</span>
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
                      onClick={() => send({ type: 'admit', memberId: m.id })}
                    >
                      <Check />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Decline ${m.name}`}
                      onClick={() => send({ type: 'remove', memberId: m.id })}
                    >
                      <X />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="icon-button"
                      aria-label={`Mute ${m.name}`}
                      onClick={() => send({ type: 'mute', memberId: m.id })}
                    >
                      <MicOff />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${m.name}`}
                      onClick={() => send({ type: 'remove', memberId: m.id })}
                    >
                      <UserMinus />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      {demoNames.length > 0 && (
        <section className="demo-members" aria-label="Demo participants">
          <h3 className="people-section-title">
            Local preview <span>{demoNames.length}</span>
          </h3>
          {demoNames.map((name, index) => (
            <div className="member" key={name}>
              <span className="member-avatar" data-tone={index + 1}>
                {initials(name)}
              </span>
              <div className="member-info">
                <strong>{name}</strong>
                <small>Demo participant</small>
              </div>
              <button
                className="icon-button"
                aria-label={`Remove demo ${name}`}
                onClick={() => onRemoveDemo?.(name)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <p className="panel-helper">
            Sample participants for this preview. No audio or video is transmitted.
          </p>
        </section>
      )}
      {host && (
        <div className="host-settings">
          <h3 className="people-section-title">Host controls</h3>
          <label className="toggle-row">
            <span>
              Waiting room<small>Approve people before they join</small>
            </span>
            <input
              type="checkbox"
              checked={data.meeting.lobby}
              onChange={(e) => send({ type: 'lobby', enabled: e.target.checked })}
            />
          </label>
          <label className="toggle-row">
            <span>
              Lock meeting<small>Stop new requests to join</small>
            </span>
            <input
              type="checkbox"
              checked={data.meeting.locked}
              onChange={(e) => send({ type: 'lock', locked: e.target.checked })}
            />
          </label>
          <p className="panel-helper">
            People already admitted can reconnect. Muted participants can turn their microphone back
            on.
          </p>
        </div>
      )}
    </>
  );
}
