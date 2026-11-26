'use client';

import { useEffect, useRef, useState } from 'react';
import { TrackEvent, type LocalVideoTrack } from 'livekit-client';
import type { BackgroundProcessorWrapper } from '@livekit/track-processors';

const processorName = 'playground-camera-blur';

export function CameraBlur({
  track,
  cameraOn,
  showPreview,
}: {
  track?: LocalVideoTrack;
  cameraOn: boolean;
  showPreview: boolean;
}) {
  const preview = useRef<HTMLVideoElement>(null);
  const current = useRef<LocalVideoTrack | undefined>(track);
  const applying = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    current.current = track;
    const sync = () => setBlurred(track?.getProcessor()?.name === processorName);
    sync();
    track?.on(TrackEvent.TrackProcessorUpdate, sync);
    return () => {
      current.current = undefined;
      track?.off(TrackEvent.TrackProcessorUpdate, sync);
    };
  }, [track]);

  useEffect(() => {
    const video = preview.current;
    if (!track || !cameraOn || !showPreview || !video) return;
    track.attach(video);
    return () => {
      track.detach(video);
    };
  }, [track, cameraOn, showPreview]);

  async function toggle() {
    if (!track || !cameraOn || applying.current) return;
    applying.current = true;
    setBusy(true);
    setError('');
    let processor: BackgroundProcessorWrapper | undefined;
    try {
      if (track.getProcessor()?.name === processorName) {
        await track.stopProcessor(false);
      } else {
        const { BackgroundProcessor, supportsBackgroundProcessors } =
          await import('@livekit/track-processors');
        if (current.current !== track || track.isMuted) return;
        if (!supportsBackgroundProcessors()) {
          setError(
            'Background blur is unavailable in this browser. Try a browser with WebGL 2 enabled.',
          );
          return;
        }
        processor = BackgroundProcessor(
          {
            mode: 'background-blur',
            blurRadius: 14,
            assetPaths: {
              tasksVisionFileSet: '/camera/wasm',
              modelAssetPath: '/camera/selfie-segmenter-v1.tflite',
            },
          },
          processorName,
        );
        await track.setProcessor(processor);
        if (current.current !== track && track.getProcessor() === processor) {
          await track.stopProcessor(false);
        }
      }
    } catch {
      if (processor) {
        if (track.getProcessor() === processor) {
          await track.stopProcessor(false).catch(() => {});
        } else {
          await processor.destroy().catch(() => {});
        }
      }
      if (current.current === track)
        setError('Could not change background blur. Check your camera preview and try again.');
    } finally {
      applying.current = false;
      setBusy(false);
      if (current.current === track) setBlurred(track.getProcessor()?.name === processorName);
    }
  }

  return (
    <section className="camera-background" aria-label="Camera background">
      {showPreview && cameraOn && track && (
        <video
          className="camera-background-preview"
          ref={preview}
          autoPlay
          playsInline
          muted
          aria-label="Your camera preview"
        />
      )}
      <button
        type="button"
        className="button secondary"
        role="switch"
        aria-label="Background blur"
        aria-checked={blurred}
        disabled={!cameraOn || !track || busy}
        onClick={toggle}
      >
        Background blur <span>{busy ? 'Applying…' : blurred ? 'On' : 'Off'}</span>
      </button>
      {!cameraOn && (
        <small className="panel-helper">Turn on your camera to change its background.</small>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
