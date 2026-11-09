'use client';
import { useRef } from 'react';
import {
  VideoTrack,
  useIsSpeaking,
  isTrackReference,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { MicOff, Hand, PictureInPicture2, Maximize } from 'lucide-react';
import { initials } from '@/lib/format';
import { useToast } from './providers';
export function VideoTile({
  track,
  raised,
}: {
  track: TrackReferenceOrPlaceholder;
  raised: boolean;
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
    >
      <div className="tile-avatar">
        <span>{initials(track.participant.name || 'Guest')}</span>
      </div>
      {available && <VideoTrack trackRef={track} className={screen ? 'screen-video' : ''} />}
      <div className="tile-label">
        {!track.participant.isMicrophoneEnabled && <MicOff size={12} />}
        <span>
          {track.participant.name || 'Guest'}
          {track.participant.isLocal ? ' (you)' : ''}
          {screen ? ' · screen' : ''}
        </span>
        {raised && <Hand size={13} color="#ffbf71" />}
      </div>
      <div className="tile-actions">
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
          aria-label={`Expand ${track.participant.name}`}
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
