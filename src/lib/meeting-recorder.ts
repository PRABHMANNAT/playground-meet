import { RoomEvent, type Room } from 'livekit-client';
import { appendRecordingChunk, type LocalRecording } from './local-recordings';

const captureEvents = [
  RoomEvent.TrackSubscribed,
  RoomEvent.TrackUnsubscribed,
  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
  RoomEvent.LocalTrackPublished,
  RoomEvent.LocalTrackUnpublished,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.Reconnected,
] as const;

type CaptureDevices = MediaDevices & {
  setCaptureHandleConfig?: (config: { handle: string; permittedOrigins: string[] }) => void;
};
type DisplayTrack = MediaStreamTrack & { getCaptureHandle?: () => { handle: string } | null };

export function identifyMeetingTab(handle: string) {
  (navigator.mediaDevices as CaptureDevices | undefined)?.setCaptureHandleConfig?.({
    handle,
    permittedOrigins: [location.origin],
  });
}

export function recordingSupported() {
  return (
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getDisplayMedia &&
    typeof indexedDB !== 'undefined' &&
    typeof AudioContext !== 'undefined'
  );
}

// The chooser must open synchronously inside the user's confirmation click.
export async function prepareRecording(
  room: Room,
  handle: string,
  recording: LocalRecording,
  onFinished: (saved: boolean, error: string) => void,
) {
  const audio = new AudioContext();
  const devices = navigator.mediaDevices as CaptureDevices;
  const options = {
    video: { displaySurface: 'browser', frameRate: { ideal: 24, max: 30 } },
    audio: { suppressLocalAudioPlayback: false, restrictOwnAudio: false },
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    surfaceSwitching: 'exclude',
    monitorTypeSurfaces: 'exclude',
  };
  let display: MediaStream | undefined;
  const sources = new Map<MediaStreamTrack, MediaStreamAudioSourceNode>();
  let sync = () => {};
  const cleanup = () => {
    for (const event of captureEvents) room.off(event, sync);
    sources.forEach((source) => source.disconnect());
    display?.getTracks().forEach((track) => track.stop());
    void audio.close().catch(() => {});
  };
  try {
    const selecting = devices.getDisplayMedia(options as DisplayMediaStreamOptions);
    const resumed = audio.resume().then(
      () => true,
      () => false,
    );
    display = await selecting;
    if (!(await resumed)) throw new Error('Meeting audio could not start. Try recording again.');
    const video = display.getVideoTracks()[0] as DisplayTrack | undefined;
    if (!video) throw new Error('No meeting video was selected.');
    const surface = video.getSettings().displaySurface;
    if (
      (surface && surface !== 'browser') ||
      (devices.setCaptureHandleConfig &&
        video.getCaptureHandle &&
        video.getCaptureHandle()?.handle !== handle)
    )
      throw new Error('Select this meeting tab in the browser chooser.');
    const mix = audio.createMediaStreamDestination();
    const tabAudio = display.getAudioTracks()[0];
    sync = () => {
      const tracks = new Set<MediaStreamTrack>();
      if (tabAudio?.readyState === 'live') tracks.add(tabAudio);
      // The tab mix includes remote playback. Always add the local published mic.
      const participants =
        tabAudio?.readyState === 'live'
          ? [room.localParticipant]
          : [room.localParticipant, ...room.remoteParticipants.values()];
      for (const participant of participants) {
        for (const pub of participant.audioTrackPublications.values()) {
          const track = pub.track?.mediaStreamTrack;
          if (track?.readyState === 'live' && !pub.isMuted) tracks.add(track);
        }
      }
      for (const [track, node] of sources)
        if (!tracks.has(track)) {
          node.disconnect();
          sources.delete(track);
        }
      for (const track of tracks)
        if (!sources.has(track)) {
          const node = audio.createMediaStreamSource(new MediaStream([track]));
          node.connect(mix);
          sources.set(track, node);
        }
    };
    sync();
    for (const event of captureEvents) room.on(event, sync);
    tabAudio?.addEventListener('ended', sync, { once: true });
    const output = new MediaStream([video, ...mix.stream.getAudioTracks()]);
    const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    const encoder = new MediaRecorder(output, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 3_000_000,
    });
    recording.mime = encoder.mimeType;
    let writes = Promise.resolve(),
      sequence = 0,
      written = 0,
      failure = '',
      started = false,
      done = false;
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const finalize = async () => {
      if (done) return;
      done = true;
      tabAudio?.removeEventListener('ended', sync);
      cleanup();
      mix.stream.getTracks().forEach((t) => t.stop());
      await writes;
      try {
        onFinished(written > 0, failure);
      } finally {
        finish();
      }
    };
    const stop = () => {
      if (encoder.state !== 'inactive') encoder.stop();
      else if (!started) void finalize();
      return finished;
    };
    encoder.ondataavailable = ({ data }) => {
      if (!data.size) return;
      const index = sequence++;
      writes = writes.then(async () => {
        if (failure && written < index) return;
        try {
          await appendRecordingChunk(recording, index, data);
          written++;
        } catch {
          failure = 'Local storage is full or unavailable. Recording stopped.';
          void stop();
        }
      });
    };
    encoder.onerror = () => {
      failure = 'The browser interrupted this recording.';
      void stop();
    };
    encoder.onstop = () => {
      void finalize();
    };
    video.addEventListener('ended', () => void stop(), { once: true });
    return {
      stop,
      start() {
        if (done || video.readyState !== 'live')
          throw new Error('Tab capture ended before recording began.');
        encoder.start(1000);
        started = true;
      },
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
