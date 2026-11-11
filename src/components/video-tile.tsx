'use client';
import { useRef } from 'react';
import {
  VideoTrack,
  useIsSpeaking,
  isTrackReference,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
  MicOff,
  Hand,
  PictureInPicture2,
  Maximize,
  Pin,
  PinOff,
  AudioLines,
  VideoOff,
} from 'lucide-react';
import { Avatar } from './avatar';
import { useToast } from './providers';
export function VideoTile({
  track,
  raised,
  pinned = false,
  onPin,
}: {
  track: TrackReferenceOrPlaceholder;
  raised: boolean;
  pinned?: boolean;
  onPin?: () => void;
}) {
  const speaking = useIsSpeaking(track.participant),
    ref = useRef<HTMLDivElement>(null),
    toast = useToast();
  const screen = track.source === Track.Source.ScreenShare;
  const available =
    isTrackReference(track) && !!track.publication.track && !track.publication.isMuted;
  return (
    <div
      ref={ref}
      className={`tile ${speaking ? 'speaking' : ''} ${screen ? 'screen' : ''} ${track.participant.isLocal && !screen ? 'local' : ''}`}
      data-testid="participant-tile"
      data-focused={pinned}
    >
      {!available && (
        <div className="tile-avatar">
          <Avatar name={track.participant.name || 'Guest'} size="large" />
          <div className="tile-identity">
            <strong>{track.participant.name || 'Guest'}</strong>
            <small>
              <VideoOff size={13} aria-hidden="true" />
              {screen ? 'Screen share paused' : 'Camera off'}
            </small>
          </div>
        </div>
      )}
      {available && <VideoTrack trackRef={track} className={screen ? 'screen-video' : ''} />}
      <div className="tile-label">
        {!track.participant.isMicrophoneEnabled && <MicOff size={13} aria-label="Microphone off" />}
        {(available || track.participant.isLocal) && (
          <span>
            {available ? track.participant.name || 'Guest' : 'You'}
            {available && track.participant.isLocal ? ' (you)' : ''}
            {available && screen ? ' · screen' : ''}
          </span>
        )}
      </div>
      {(raised || speaking) && (
        <div className="tile-state" role="status">
          {raised ? (
            <>
              <Hand size={13} /> Hand raised
            </>
          ) : (
            <>
              <AudioLines size={14} /> Speaking
            </>
          )}
        </div>
      )}
      <div className="tile-actions">
        {onPin && (
          <button
            aria-label={`${pinned ? 'Unpin' : 'Pin'} ${track.participant.name || 'Guest'}`}
            aria-pressed={pinned}
            title={pinned ? 'Return to gallery' : 'Pin on your screen'}
            onClick={onPin}
          >
            {pinned ? <PinOff /> : <Pin />}
          </button>
        )}
        {available && (
          <button
            aria-label={`Picture in picture for ${track.participant.name}`}
            onClick={async () => {
              try {
                const video = ref.current?.querySelector('video');
                if (!document.pictureInPictureEnabled || !video)
                  throw new Error('Picture-in-picture is not supported in this browser.');
                await video.requestPictureInPicture();
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          >
            <PictureInPicture2 />
          </button>
        )}
        <button
          aria-label={`Expand ${track.participant.name || 'Guest'}`}
          title="Full screen"
          onClick={() =>
            ref.current
              ?.requestFullscreen()
              .catch(() => toast('Full screen is not supported in this browser.'))
          }
        >
          <Maximize />
        </button>
      </div>
    </div>
  );
}
