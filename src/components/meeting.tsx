'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useTracks,
  useLocalParticipant,
  useConnectionState,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react';
import { Track, VideoPresets, ConnectionState } from 'livekit-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Hand,
  Smile,
  MessageSquare,
  Users,
  PenTool,
  StickyNote,
  BarChart3,
  Timer,
  Layers,
  Copy,
  Keyboard,
  Download,
  LoaderCircle,
  Settings2,
  LayoutGrid,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { request, downloadSummary } from '@/lib/client';
import { duration } from '@/lib/format';
import { meetingPath, meetingInviteUrl } from '@/lib/meeting-links';
import { useRoomState } from '@/hooks/use-room-state';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';
import { useToast } from './providers';
import { VideoTile } from './video-tile';
import { SidePanel } from './panels';
import type { Panel } from './panels/types';
import { ReactionIcon, Reactions, emojis } from './reactions';
import { Shortcuts } from './shortcuts';
import { Dialog } from './dialog';
import { MediaDeviceSelect } from '@livekit/components-react';
import type { Devices } from './device-preview';
import type { Action } from '@/lib/schemas';
export default function Meeting({
  id,
  devices,
  onBack,
}: {
  id: string;
  devices: Devices;
  onBack: () => void;
}) {
  const [connection, setConnection] = useState<{ url: string; token: string } | null>(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    request<{ url: string; token: string }>(`/api/meetings/${id}/token`, {})
      .then((r) => {
        if (active) setConnection(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  const retry = () => {
    setConnection(null);
    setError('');
    setAttempt((v) => v + 1);
  };
  if (error)
    return (
      <div className="room-connect">
        <h1>Unable to connect</h1>
        <p role="alert">{error}</p>
        <button className="button" onClick={retry}>
          Try again
        </button>
        <button className="text-button" onClick={onBack}>
          Back to device preview
        </button>
      </div>
    );
  if (!connection)
    return (
      <div className="room-connect">
        <LoaderCircle className="spin" />
        <h2>Connecting…</h2>
        <p>Connecting securely to your meeting.</p>
        <button className="text-button" onClick={onBack}>
          Back to preview
        </button>
      </div>
    );
  return (
    <LiveKitRoom
      token={connection.token}
      serverUrl={connection.url}
      connect
      audio={
        devices.audio
          ? {
              deviceId: devices.audioId || undefined,
              echoCancellation: true,
              noiseSuppression: true,
            }
          : false
      }
      video={
        devices.video
          ? { deviceId: devices.videoId || undefined, resolution: VideoPresets.h720.resolution }
          : false
      }
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: { simulcast: true },
        videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
      }}
      onError={(e) => setError(e.message)}
      onDisconnected={() => router.push(meetingPath(id, true))}
    >
      <MeetingInterior id={id} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
function MeetingInterior({ id }: { id: string }) {
  const { data, error, act } = useRoomState(id),
    toast = useToast(),
    router = useRouter(),
    room = useRoomContext();
  const [panel, setPanel] = useState<Panel | null>(null),
    [reactions, setReactions] = useState(false),
    [shortcuts, setShortcuts] = useState(false),
    [leaving, setLeaving] = useState(false),
    [settings, setSettings] = useState(false),
    [toolsOpen, setToolsOpen] = useState(false),
    [pinnedTrack, setPinnedTrack] = useState<string | null>(null),
    [now, setNow] = useState(Date.now());
  const participants = useParticipants();
  const local = useLocalParticipant(),
    connection = useConnectionState();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const trackKey = (t: (typeof tracks)[number]) => t.participant.identity + ':' + t.source;
  const focused =
    tracks.length > 1 && tracks.some((t) => trackKey(t) === pinnedTrack) ? pinnedTrack : null;
  const visibleTracks = focused
    ? [...tracks].sort((a, b) => Number(trackKey(b) === focused) - Number(trackKey(a) === focused))
    : tracks;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const send = useCallback(
    async (action: Action) => {
      try {
        const result = await act(action);
        if (result.warning) toast(result.warning);
        return true;
      } catch (e) {
        toast((e as Error).message);
        return false;
      }
    },
    [act, toast],
  );
  const host = data?.meeting.host === data?.me.id;
  const raised = data?.members.find((m) => m.id === data.me.id)?.hand || false;
  const toggle = useCallback((p: Panel) => setPanel((current) => (current === p ? null : p)), []);
  const mic = useCallback(() => {
    void local.localParticipant
      .setMicrophoneEnabled(!local.isMicrophoneEnabled)
      .catch((e) => toast(e.message));
  }, [local.localParticipant, local.isMicrophoneEnabled, toast]);
  const camera = useCallback(() => {
    void local.localParticipant
      .setCameraEnabled(!local.isCameraEnabled)
      .catch((e) => toast(e.message));
  }, [local.localParticipant, local.isCameraEnabled, toast]);
  const screen = useCallback(() => {
    void local.localParticipant
      .setScreenShareEnabled(!local.isScreenShareEnabled, { audio: true })
      .catch(() =>
        toast('Screen sharing was cancelled or is not supported. Try a desktop browser.'),
      );
  }, [local.localParticipant, local.isScreenShareEnabled, toast]);
  const hand = useCallback(() => {
    void send({ type: 'hand', raised: !raised });
  }, [send, raised]);
  const keys = useMemo(
    () => ({
      m: mic,
      v: camera,
      s: screen,
      h: hand,
      c: () => toggle('chat'),
      '?': () => setShortcuts(true),
      escape: () => setPanel(null),
    }),
    [mic, camera, screen, hand, toggle],
  );
  useShortcuts(keys);
  useEffect(() => {
    if (data?.meeting.ended) {
      void room.disconnect();
      router.push(meetingPath(id, true));
    }
  }, [data?.meeting.ended, room, router, id]);
  useEffect(() => {
    if (error.includes('admit') || error.includes('access')) void room.disconnect();
  }, [error, room]);
  const waiting = data?.members.filter((m) => m.status === 'waiting').length || 0;
  const controls = [
    { icon: MessageSquare, p: 'chat', label: 'Chat', description: 'Message the room' },
    { icon: Users, p: 'people', label: 'People', description: 'Participants and host controls' },
    { icon: PenTool, p: 'board', label: 'Whiteboard', description: 'Sketch ideas together' },
    {
      icon: StickyNote,
      p: 'notes',
      label: 'Shared notes',
      description: 'Keep decisions in one place',
    },
    { icon: BarChart3, p: 'polls', label: 'Polls', description: 'Ask a question and vote' },
    { icon: Timer, p: 'timer', label: 'Focus timer', description: 'Set time for a discussion' },
    { icon: Layers, p: 'review', label: 'Product review', description: 'Collect bugs and ideas' },
    { icon: Globe, p: 'browser', label: 'Shared browser', description: 'Find and share web pages' },
  ] as const;
  return (
    <main className="meeting-shell" id="main">
      <header className="room-header">
        <Brand />
        <div className="room-title">
          <h1>{data?.meeting.title || 'Meeting'}</h1>
          <span>
            <i className="pulse-dot" />
            {connection === ConnectionState.Connected ? 'Connected' : connection} ·{' '}
            {duration((now - (data?.meeting.created || now)) / 1000)}
          </span>
        </div>
        <div className="room-header-right">
          <ThemeToggle />
          <button
            className="button secondary"
            aria-label="Invite people"
            onClick={() =>
              navigator.clipboard
                .writeText(meetingInviteUrl(id, location.origin))
                .then(() => toast('Invite link copied.'))
                .catch(() => toast('Copy the URL from your address bar.'))
            }
          >
            <Copy size={14} />
            <span>Invite people</span>
          </button>
          <button
            className="icon-button"
            aria-label="Device settings"
            onClick={() => setSettings(true)}
          >
            <Settings2 size={17} />
          </button>
        </div>
      </header>
      {connection !== ConnectionState.Connected && (
        <div className="call-status" role="status">
          {connection === ConnectionState.Reconnecting
            ? 'Connection interrupted. Reconnecting automatically…'
            : 'Connecting to the call…'}
        </div>
      )}
      {error && (
        <div className="call-status" role="alert">
          Collaboration connection: {error}
        </div>
      )}
      <StartAudio label="Click to enable meeting audio" className="button primary" />
      <div className="room-body">
        <div className="call-area">
          <div className="stage-heading">
            <div>
              <h2>In this meeting</h2>
              <span>{participants.length} connected</span>
            </div>
            <div className="stage-actions">
              {data?.meeting.state.browser && panel !== 'browser' && (
                <button className="gallery-button" onClick={() => setPanel('browser')}>
                  <Globe size={14} /> Shared page
                </button>
              )}
              {focused && (
                <button className="gallery-button" onClick={() => setPinnedTrack(null)}>
                  <LayoutGrid size={14} /> Back to gallery
                </button>
              )}
              <span className="stage-privacy">
                <ShieldCheck size={14} /> Invite only
              </span>
            </div>
          </div>
          <div
            className="video-grid"
            data-count={tracks.length}
            data-many={tracks.length > 4}
            data-layout={focused ? 'focus' : 'gallery'}
          >
            {visibleTracks.map((t) => (
              <VideoTile
                key={t.participant.identity + ':' + t.source}
                track={t}
                pinned={focused === trackKey(t)}
                onPin={
                  tracks.length > 1
                    ? () => setPinnedTrack(focused === trackKey(t) ? null : trackKey(t))
                    : undefined
                }
                raised={data?.members.find((m) => m.id === t.participant.identity)?.hand || false}
              />
            ))}
          </div>
          {data && <Reactions events={data.events} now={now} />}
        </div>
        {data &&
          (panel && panel !== 'browser'
            ? (['browser', panel] as const)
            : (['browser'] as const)
          ).map((tool) => (
            <SidePanel
              key={tool}
              panel={tool}
              hidden={tool !== panel}
              onClose={() => setPanel(null)}
              data={data}
              host={host}
              send={send}
            />
          ))}
      </div>
      {reactions && (
        <div className="reactions-menu">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              aria-label={`React ${emoji}`}
              onClick={() => {
                void send({ type: 'reaction', emoji });
                setReactions(false);
              }}
            >
              <ReactionIcon emoji={emoji} />
            </button>
          ))}
        </div>
      )}
      <footer className="room-toolbar" aria-label="Meeting controls">
        <div className="toolbar-group">
          <div className="toolbar-tool">
            <button
              className={'control ' + (!local.isMicrophoneEnabled ? 'off' : '')}
              aria-label={local.isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
              title="Microphone · M"
              onClick={mic}
            >
              {local.isMicrophoneEnabled ? <Mic /> : <MicOff />}
            </button>
            <span>Microphone</span>
          </div>
          <div className="toolbar-tool">
            <button
              className={'control ' + (!local.isCameraEnabled ? 'off' : '')}
              aria-label={local.isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
              title="Camera · V"
              onClick={camera}
            >
              {local.isCameraEnabled ? <Video /> : <VideoOff />}
            </button>
            <span>Camera</span>
          </div>
          <div className={'toolbar-tool ' + (local.isScreenShareEnabled ? 'active' : '')}>
            <button
              className="control"
              aria-label={local.isScreenShareEnabled ? 'Stop sharing screen' : 'Share screen'}
              title="Share screen · S"
              onClick={screen}
            >
              <ScreenShare />
            </button>
            <span>Share screen</span>
          </div>
          <div className={'toolbar-tool ' + (raised ? 'active' : '')}>
            <button
              className="control"
              aria-label={raised ? 'Lower hand' : 'Raise hand'}
              title="Raise hand · H"
              aria-pressed={raised}
              onClick={hand}
            >
              <Hand />
            </button>
            <span>Raise hand</span>
          </div>
          <div className="toolbar-tool">
            <button
              className="control"
              aria-label="Send a reaction"
              title="Send a reaction"
              aria-expanded={reactions}
              onClick={() => setReactions((v) => !v)}
            >
              <Smile />
            </button>
            <span>React</span>
          </div>
          <div className="toolbar-tool">
            <button
              className="control danger"
              aria-label="Leave meeting"
              onClick={() => setLeaving(true)}
            >
              <PhoneOff />
            </button>
            <span>Leave</span>
          </div>
        </div>
        <span className="toolbar-divider" />
        <div className="toolbar-group">
          {controls.slice(0, 2).map(({ icon: Icon, p, label }) => (
            <div className={'toolbar-tool ' + (panel === p ? 'active' : '')} key={p}>
              <button
                className="control"
                aria-label={`Open ${label}`}
                aria-pressed={panel === p}
                onClick={() => toggle(p)}
              >
                <Icon />
              </button>
              <span>{label}</span>
              {p === 'people' && host && waiting > 0 && <b className="toolbar-count">{waiting}</b>}
            </div>
          ))}
          <div
            className={
              'toolbar-tool ' + (panel && !['chat', 'people'].includes(panel) ? 'active' : '')
            }
          >
            <button
              className="control"
              aria-label="Open meeting tools"
              aria-haspopup="dialog"
              onClick={() => setToolsOpen(true)}
            >
              <LayoutGrid />
            </button>
            <span>Tools</span>
          </div>
        </div>
      </footer>
      <Shortcuts open={shortcuts} onClose={() => setShortcuts(false)} />
      <Dialog open={toolsOpen} onClose={() => setToolsOpen(false)} title="Meeting tools">
        <div className="meeting-tools">
          {controls.slice(2).map(({ icon: Icon, p, label, description }) => (
            <button
              key={p}
              onClick={() => {
                setPanel(p);
                setToolsOpen(false);
              }}
            >
              <Icon size={20} />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              setToolsOpen(false);
              setShortcuts(true);
            }}
          >
            <Keyboard size={20} />
            <span>Keyboard shortcuts</span>
          </button>
          <button onClick={() => downloadSummary(id).catch((e) => toast(e.message))}>
            <Download size={20} />
            <span>Download summary</span>
          </button>
        </div>
      </Dialog>
      <Dialog open={settings} onClose={() => setSettings(false)} title="Device settings">
        <label>
          Microphone
          <MediaDeviceSelect kind="audioinput" />
        </label>
        <label>
          Camera
          <MediaDeviceSelect kind="videoinput" />
        </label>
        <p className="panel-helper">
          Headphones help prevent echo. Your browser controls permission to access these devices.
        </p>
      </Dialog>
      <Dialog open={leaving} onClose={() => setLeaving(false)} title="Leave meeting?">
        <p className="muted">Your notes and feedback will be waiting in the meeting recap.</p>
        <button
          className="button primary"
          onClick={() => {
            void room.disconnect();
            router.push(meetingPath(id, true));
          }}
        >
          Leave meeting
        </button>
        {host && (
          <button
            className="button danger"
            onClick={async () => {
              if (await send({ type: 'end' })) {
                void room.disconnect();
                router.push(meetingPath(id, true));
              }
            }}
          >
            End meeting for everyone
          </button>
        )}
      </Dialog>
    </main>
  );
}
