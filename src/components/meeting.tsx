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
  Disc,
  Square,
  Captions,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Hand,
  Smile,
  MessageSquare,
  Users,
  Copy,
  LoaderCircle,
  Settings2,
  LayoutGrid,
  Timer,
  NotebookPen,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { request, downloadSummary } from '@/lib/client';
import { duration } from '@/lib/format';
import { meetingPath, meetingInviteUrl } from '@/lib/meeting-links';
import { useMeetingRecording } from '@/hooks/use-meeting-recording';
import { usePollSounds } from '@/hooks/use-poll-sounds';
import { useTranscript } from '@/hooks/use-transcript';
import { useCaptionTranslation } from '@/hooks/use-caption-translation';
import { useRoomState } from '@/hooks/use-room-state';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { Brand } from './brand';
import { MeetingTools } from './meeting-tools';
import { timerSeconds } from '@/lib/meeting-timer';
import { ThemeToggle } from './theme-toggle';
import { useToast } from './providers';
import { VideoTile } from './video-tile';
import { BoardPanel } from './panels/board';
import { SidePanel } from './panels';
import type { BrowserTabId } from './panels/browser';
import type { Panel } from './panels/types';
import { ReactionPicker, Reactions } from './reactions';
import { Shortcuts } from './shortcuts';
import { Dialog } from './dialog';
import { MediaDeviceSelect } from '@livekit/components-react';
import { CameraBlur } from './camera-blur';
import type { Devices } from './device-preview';
import type { Action } from '@/lib/schemas';
import type { MeetingAvatar } from '@/lib/meeting-avatars';
export default function Meeting({
  id,
  devices,
  avatar,
  onBack,
}: {
  id: string;
  devices: Devices;
  avatar?: MeetingAvatar;
  onBack: () => void;
}) {
  const [connection, setConnection] = useState<{ url: string; token: string } | null>(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    request<{ url: string; token: string }>(`/api/meetings/${id}/token`, { avatar })
      .then((r) => {
        if (active) setConnection(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, avatar, attempt]);
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
      onDisconnected={() => router.push(meetingPath(id, true) + '?notes=download')}
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
    [browserTab, setBrowserTab] = useState<BrowserTabId>(1),
    [boardOpen, setBoardOpen] = useState(false),
    [boardExpanded, setBoardExpanded] = useState(false),
    [reactions, setReactions] = useState(false),
    [shortcuts, setShortcuts] = useState(false),
    [leaving, setLeaving] = useState(false),
    [settings, setSettings] = useState(false),
    [confirmRecording, setConfirmRecording] = useState(false),
    [pinnedTrack, setPinnedTrack] = useState<string | null>(null),
    [now, setNow] = useState(Date.now());
  const participants = useParticipants();
  const sharedSearchId = data?.meeting.state.browserSearch?.id;
  useEffect(() => {
    if (sharedSearchId) setPanel('browser');
  }, [sharedSearchId]);
  const recording = useMeetingRecording(room, id, toast);
  const recorders = participants.filter((p) => p.attributes.localRecording === 'on');

  const local = useLocalParticipant(),
    connection = useConnectionState();
  const speech = useTranscript(
    id,
    local.isMicrophoneEnabled ? local.microphoneTrack?.track?.mediaStreamTrack : undefined,
    data?.clockOffset,
  );
  const pollSounds = usePollSounds(data?.meeting.state.polls, data?.me.id);
  const translation = useCaptionTranslation(data?.events);
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
  const toggleScreenShare = useCallback(
    async (surface?: 'window' | 'browser') => {
      try {
        await local.localParticipant.setScreenShareEnabled(
          !local.isScreenShareEnabled,
          surface
            ? {
                audio: true,
                video: { displaySurface: surface },
                selfBrowserSurface: 'exclude',
                surfaceSwitching: 'include',
              }
            : { audio: true },
        );
      } catch {
        toast('Screen sharing was cancelled or is not supported. Try a desktop browser.');
      }
    },
    [local.localParticipant, local.isScreenShareEnabled, toast],
  );
  const screen = useCallback(() => void toggleScreenShare(), [toggleScreenShare]);
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
      router.push(meetingPath(id, true) + '?notes=download');
    }
  }, [data?.meeting.ended, room, router, id]);
  useEffect(() => {
    if (error.includes('admit') || error.includes('access')) void room.disconnect();
  }, [error, room]);
  const presenterId = data?.meeting.state.boardPresenter?.id;
  const showBoard = !!data && (boardOpen || !!presenterId);
  useEffect(() => {
    if (presenterId) setPanel(null);
  }, [presenterId]);
  const waiting = data?.members.filter((m) => m.status === 'waiting').length || 0;
  const controls = [
    { icon: MessageSquare, p: 'chat', label: 'Chat', description: 'Message the room' },
    { icon: Users, p: 'people', label: 'People', description: 'Participants and host controls' },
    { icon: Captions, p: 'transcript', label: 'Transcript', description: 'Live transcript' },
  ] as const;
  const timer = data?.meeting.state.timer;
  const serverNow = now + (data?.clockOffset ?? 0);
  const remaining = timer ? timerSeconds(timer, serverNow) : 0;
  const showTimer =
    timer && (timer.pausedSeconds || (timer.endsAt > 0 && serverNow < timer.endsAt + 10000));
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
      {recorders.length > 0 && (
        <div className="room-recording-notice" role="status">
          <Disc size={14} />
          <strong>Recording</strong>
          <span>{recorders.map((p) => p.name || 'Guest').join(', ')}</span>
        </div>
      )}
      <StartAudio label="Click to enable meeting audio" className="button primary" />
      <div className="room-body">
        <div className="call-area" data-board-open={showBoard}>
          <div className="stage-heading">
            <div>
              <h2>In this meeting</h2>
              <span>{participants.length} connected</span>
            </div>
            <div className="stage-actions">
              {!!showTimer && (
                <button
                  className="gallery-button room-countdown"
                  onClick={() => toggle('timer')}
                  aria-label="Open shared countdown"
                >
                  <Timer size={14} />
                  {timer?.pausedSeconds ? 'Paused · ' : ''}
                  {remaining ? duration(remaining) : 'Time’s up'}
                </button>
              )}
              <button
                className="gallery-button"
                onClick={() => toggle('transcript')}
                aria-pressed={panel === 'transcript'}
              >
                <Captions size={16} />
                {speech.status === 'on' ? 'Transcription on' : 'Transcript'}
              </button>
              {(data?.meeting.state.browser || sharedSearchId) && panel !== 'browser' && (
                <button
                  className="gallery-button"
                  onClick={() => {
                    setBrowserTab('shared');
                    setPanel('browser');
                  }}
                >
                  <Globe size={14} /> {sharedSearchId ? 'Shared search' : 'Shared page'}
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
          {data?.meeting.state.liveNote && (
            <section className="stage-note" aria-label="Shared live note">
              <header>
                <NotebookPen size={16} />
                <strong>{data.meeting.state.liveNote.name}’s note</strong>
                <span>Live</span>
              </header>
              <p tabIndex={0}>
                {data.meeting.state.liveNote.text || 'Waiting for the first line…'}
              </p>
            </section>
          )}
          {showBoard && data && (
            <BoardPanel
              data={data}
              host={host}
              send={send}
              expanded={boardExpanded}
              onExpand={setBoardExpanded}
              onClose={() => {
                setBoardExpanded(false);
                setBoardOpen(false);
              }}
            />
          )}
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
          {panel !== 'transcript' && translation.language !== 'en' && translation.live && (
            <div className="live-translation" role="status">
              <strong>{translation.live.speaker}</strong>
              <span lang={translation.language}>{translation.live.text}</span>
            </div>
          )}
        </div>
        {data &&
          (panel && panel !== 'browser' && panel !== 'chat' && panel !== 'notes'
            ? (['browser', 'chat', 'notes', panel] as const)
            : (['browser', 'chat', 'notes'] as const)
          ).map((tool) => (
            <SidePanel
              key={tool}
              panel={tool}
              now={now}
              speech={speech}
              translation={translation}
              pollSounds={pollSounds}
              browser={{
                selected: browserTab,
                select: setBrowserTab,
                presenting: local.isScreenShareEnabled,
                present: (surface) => toggleScreenShare(surface),
              }}
              hidden={tool !== panel}
              onClose={() => setPanel(null)}
              data={data}
              host={host}
              send={send}
            />
          ))}
      </div>
      {reactions && (
        <ReactionPicker
          onSend={(emoji) => {
            void send({ type: 'reaction', emoji });
            setReactions(false);
          }}
          onClose={() => setReactions(false)}
        />
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
          {controls.map(({ icon: Icon, p, label, description }) => (
            <div className={'toolbar-tool ' + (panel === p ? 'active' : '')} key={p}>
              <button
                className="control"
                aria-label={`Open ${label}`}
                title={description}
                aria-pressed={panel === p}
                onClick={() => toggle(p)}
              >
                <Icon />
              </button>
              <span>{label}</span>
              {p === 'people' && host && waiting > 0 && <b className="toolbar-count">{waiting}</b>}
            </div>
          ))}
          <div className={'toolbar-tool ' + (recording.phase === 'recording' ? 'active' : '')}>
            <button
              className="control"
              aria-label={
                recording.phase === 'recording' ? 'Stop and save recording' : 'Record meeting'
              }
              disabled={recording.phase === 'selecting' || recording.phase === 'saving' || !data}
              onClick={() =>
                recording.phase === 'recording' ? void recording.stop() : setConfirmRecording(true)
              }
            >
              {recording.phase === 'recording' ? (
                <Square size={16} fill="currentColor" />
              ) : recording.phase === 'idle' ? (
                <Disc />
              ) : (
                <LoaderCircle className="spin" />
              )}
            </button>
            <span>
              {recording.phase === 'recording'
                ? duration((now - recording.started) / 1000)
                : recording.phase === 'saving'
                  ? 'Saving…'
                  : 'Record'}
            </span>
          </div>
          <MeetingTools
            active={panel ?? (showBoard ? 'board' : null)}
            onSelect={(tool, keyboard) => {
              if (tool === 'shortcuts') {
                setShortcuts(true);
                return;
              }
              if (tool === 'download') {
                void downloadSummary(id).catch((e) => toast(e.message));
                return;
              }
              if (tool === 'board') {
                setBoardOpen(true);
                setBoardExpanded(true);
                setPanel(null);
              } else {
                setBoardExpanded(false);
                setPanel(tool);
              }
              if (keyboard)
                requestAnimationFrame(() => {
                  const target =
                    tool === 'board'
                      ? '.board-head button'
                      : `[data-panel="${tool}"] .panel-heading button`;
                  document.querySelector<HTMLButtonElement>(target)?.focus();
                });
            }}
          />
        </div>
      </footer>
      <Dialog
        open={confirmRecording}
        onClose={() => setConfirmRecording(false)}
        title="Record this meeting?"
      >
        <p className="muted">
          Everyone in the meeting will see that you’re recording. The video saves to this device.
        </p>
        <p>
          Choose this meeting tab to capture the visible cameras, screen shares, whiteboard and
          chat. Enable tab audio to include media played in the tab. Your unmuted microphone is
          included.
        </p>
        <div className="recording-dialog-actions">
          <button className="button secondary" onClick={() => setConfirmRecording(false)}>
            Cancel
          </button>
          <button
            className="button primary"
            onClick={() => {
              setConfirmRecording(false);
              void recording.start(data?.meeting.title || 'Meeting');
            }}
          >
            Confirm and choose tab
          </button>
        </div>
      </Dialog>
      <Shortcuts open={shortcuts} onClose={() => setShortcuts(false)} />
      <Dialog open={settings} onClose={() => setSettings(false)} title="Device settings">
        <label>
          Microphone
          <MediaDeviceSelect kind="audioinput" />
        </label>
        <label>
          Camera
          <MediaDeviceSelect kind="videoinput" />
        </label>
        <CameraBlur
          track={local.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack}
          cameraOn={local.isCameraEnabled}
          showPreview={settings}
        />
        <p className="panel-helper">
          Headphones help prevent echo. Your browser controls permission to access these devices.
        </p>
      </Dialog>
      <Dialog open={leaving} onClose={() => setLeaving(false)} title="Leave meeting?">
        <p className="muted">Your notes and feedback will be waiting in the meeting recap.</p>
        <button
          className="button primary"
          onClick={async () => {
            await Promise.all([speech.stop(), recording.stop()]);
            void room.disconnect();
            router.push(meetingPath(id, true) + '?notes=download');
          }}
        >
          Leave meeting
        </button>
        {host && (
          <button
            className="button danger"
            onClick={async () => {
              await Promise.all([speech.stop(), recording.stop()]);
              if (await send({ type: 'end' })) {
                void room.disconnect();
                router.push(meetingPath(id, true) + '?notes=download');
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
