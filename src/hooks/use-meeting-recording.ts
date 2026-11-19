'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionState, RoomEvent, type Room } from 'livekit-client';
import { identifyMeetingTab, prepareRecording, recordingSupported } from '@/lib/meeting-recorder';
import { downloadRecording, finishRecording, type LocalRecording } from '@/lib/local-recordings';
import { request } from '@/lib/client';

type RecordingSession = { cancelled: boolean; capture?: Capture };
type Capture = Awaited<ReturnType<typeof prepareRecording>>;
export function useMeetingRecording(room: Room, id: string, notify: (message: string) => void) {
  const [phase, setPhase] = useState<'idle' | 'selecting' | 'recording' | 'saving'>('idle');
  const [started, setStarted] = useState(0);
  const current = useRef<RecordingSession | null>(null);
  const handle = useRef('');
  const stop = useCallback(async () => {
    const session = current.current;
    if (!session) return;
    session.cancelled = true;
    if (session.capture) {
      setPhase('saving');
      await session.capture.stop();
    }
  }, []);
  useEffect(() => {
    handle.current = crypto.randomUUID();
    identifyMeetingTab(handle.current);
    const finish = () => {
      void stop();
    };
    // A brief signaling interruption can preserve LiveKit participant attributes.
    const clearNotice = () => {
      if (
        (!current.current || current.current.cancelled) &&
        room.localParticipant.attributes.localRecording === 'on'
      ) {
        void request('/api/meetings/' + id + '/recording-status', {
          active: false,
          sid: room.localParticipant.sid,
        }).catch(() => {});
      }
    };
    room
      .on(RoomEvent.Disconnected, finish)
      .on(RoomEvent.Reconnecting, finish)
      .on(RoomEvent.Reconnected, clearNotice);
    window.addEventListener('pagehide', finish);
    return () => {
      room
        .off(RoomEvent.Disconnected, finish)
        .off(RoomEvent.Reconnecting, finish)
        .off(RoomEvent.Reconnected, clearNotice);
      window.removeEventListener('pagehide', finish);
      identifyMeetingTab('');
      finish();
    };
  }, [id, room, stop]);
  async function start(title: string) {
    if (current.current) return;
    if (!recordingSupported()) {
      notify('Recording requires a desktop browser with tab capture, such as Chrome or Edge.');
      return;
    }
    if (room.state !== ConnectionState.Connected) {
      notify('Connect to the meeting before recording.');
      return;
    }
    const session: RecordingSession = { cancelled: false };
    current.current = session;
    setPhase('selecting');
    const record: LocalRecording = {
      id: crypto.randomUUID(),
      scope: id + '/' + room.localParticipant.identity,
      title,
      started: Date.now(),
      mime: '',
    };
    const sid = room.localParticipant.sid;
    const publish = (active: boolean) =>
      request('/api/meetings/' + id + '/recording-status', { active, sid });
    let announcement: Promise<unknown> | undefined;
    try {
      session.capture = await prepareRecording(
        room,
        handle.current,
        record,
        async (saved, error) => {
          session.cancelled = true;
          if (announcement) {
            try {
              await announcement.catch(() => {});
              if (room.state === ConnectionState.Connected) await publish(false);
            } catch {
              /* A disconnected participant is removed from the roster. */
            }
          }
          if (saved) {
            try {
              await finishRecording(record).catch(() => {});
              await downloadRecording(record);
              notify(error || 'Recording saved to this device.');
            } catch {
              notify('Open Local recordings in the recap to download your video.');
            }
          } else if (error) notify(error);
          window.dispatchEvent(new Event('local-recordings-changed'));
          if (current.current === session) {
            current.current = null;
            setPhase('idle');
          }
        },
      );
      if (session.cancelled) {
        await session.capture.stop();
        return;
      }
      announcement = publish(true);
      await announcement;
      if (session.cancelled) {
        await session.capture.stop();
        return;
      }
      record.started = Date.now();
      session.capture.start();
      setStarted(record.started);
      setPhase('recording');
    } catch (e) {
      const cancelled = session.cancelled;
      if (session.capture) await session.capture.stop();
      if (current.current === session) {
        current.current = null;
        setPhase('idle');
      }
      if (!cancelled)
        notify(
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? 'Recording cancelled. No video was saved.'
            : e instanceof Error
              ? e.message
              : 'Could not start the recording.',
        );
    }
  }
  return { phase, started, start, stop };
}
