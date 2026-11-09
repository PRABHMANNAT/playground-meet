import assert from 'node:assert/strict';
import {
  Room,
  RoomEvent,
  VideoSource,
  VideoFrame,
  VideoBufferType,
  LocalVideoTrack,
  TrackPublishOptions,
  TrackSource,
  AudioSource,
  AudioFrame,
  LocalAudioTrack,
  AudioStream,
  VideoStream,
  TrackKind,
  dispose,
} from '@livekit/rtc-node';
import { Client } from './helpers/client';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const host = new Client(),
    guest = new Client();
  await host.call('/api/session', { name: 'Synthetic media host' });
  const person = (await guest.call('/api/session', { name: 'Synthetic media guest' })).person;
  const { id } = await host.call('/api/meetings', {
    title: 'Real WebRTC transport verification',
    lobby: true,
  });
  const root = '/api/meetings/' + id;
  await guest.call(root + '/join', {});
  await host.call(root + '/actions', { type: 'admit', memberId: person.id });
  const a = await host.call(root + '/token', {}),
    b = await guest.call(root + '/token', {});
  const sender = new Room(),
    receiver = new Room();
  const sources: VideoSource[] = [];
  let audio: AudioSource | undefined;
  let guestAudio: AudioSource | undefined;
  let guestWasMuted = false;
  let guestDisconnected = false;
  let hostDisconnected = false;
  let ended = false;
  receiver.on(RoomEvent.TrackMuted, (_track, participant) => {
    if (participant.identity === person.id) guestWasMuted = true;
  });
  receiver.on(RoomEvent.Disconnected, () => {
    guestDisconnected = true;
  });
  sender.on(RoomEvent.Disconnected, () => {
    hostDisconnected = true;
  });
  const frames = { camera: 0, screen: 0, audio: 0 };
  receiver.on(RoomEvent.TrackSubscribed, (track, pub) => {
    if (track.kind === TrackKind.KIND_AUDIO) {
      const reader = new AudioStream(track).getReader();
      void (async () => {
        try {
          while (true) {
            const r = await reader.read();
            if (r.done) break;
            if (r.value.data.some((v) => v !== 0)) frames.audio++;
          }
        } catch {}
      })();
    } else {
      const kind = pub.source === TrackSource.SOURCE_SCREENSHARE ? 'screen' : 'camera';
      const reader = new VideoStream(track).getReader();
      void (async () => {
        try {
          while (true) {
            const r = await reader.read();
            if (r.done) break;
            assert.ok(r.value.frame.width > 0);
            frames[kind]++;
          }
        } catch {}
      })();
    }
  });
  try {
    await sender.connect(a.url, a.token);
    await receiver.connect(b.url, b.token);
    console.log('PASS two independently authenticated WebRTC participants connected');
    for (const [name, source] of [
      ['camera', TrackSource.SOURCE_CAMERA],
      ['screen', TrackSource.SOURCE_SCREENSHARE],
    ] as const) {
      const video = new VideoSource(640, 360);
      sources.push(video);
      const options = new TrackPublishOptions();
      options.source = source;
      await sender.localParticipant!.publishTrack(
        LocalVideoTrack.createVideoTrack(name, video),
        options,
      );
    }
    audio = new AudioSource(48000, 1);
    const options = new TrackPublishOptions();
    options.source = TrackSource.SOURCE_MICROPHONE;
    await sender.localParticipant!.publishTrack(
      LocalAudioTrack.createAudioTrack('synthetic-tone', audio),
      options,
    );
    for (let i = 0; i < 200; i++) {
      const pixels = new Uint8Array(640 * 360 * 4);
      for (let n = 0; n < pixels.length; n += 4) {
        pixels[n] = 40 + (i % 80);
        pixels[n + 1] = 130;
        pixels[n + 2] = 100;
        pixels[n + 3] = 255;
      }
      for (const source of sources)
        source.captureFrame(new VideoFrame(pixels, 640, 360, VideoBufferType.RGBA));
      const pcm = Int16Array.from(
        { length: 480 },
        (_, n) => Math.sin(((i * 480 + n) * 2 * Math.PI * 440) / 48000) * 5000,
      );
      await audio.captureFrame(new AudioFrame(pcm, 48000, 1, 480));
      await sleep(20);
      if (frames.camera > 5 && frames.screen > 5 && frames.audio > 5) break;
    }
    assert.ok(frames.camera > 0, 'Remote camera frames must arrive');
    assert.ok(frames.screen > 0, 'Remote screen frames must arrive');
    assert.ok(frames.audio > 0, 'Remote non-silent audio frames must arrive');
    console.log('PASS decoded camera, screen share and non-silent audio:', frames);
    guestAudio = new AudioSource(48000, 1);
    const guestOptions = new TrackPublishOptions();
    guestOptions.source = TrackSource.SOURCE_MICROPHONE;
    await receiver.localParticipant!.publishTrack(
      LocalAudioTrack.createAudioTrack('guest-microphone', guestAudio),
      guestOptions,
    );
    await guest.call(root + '/actions', { type: 'mute', memberId: person.id }, 403);
    const muteResult = await host.call(root + '/actions', { type: 'mute', memberId: person.id });
    assert.equal(muteResult.warning, undefined, 'The media server must confirm the mute');
    for (let i = 0; i < 50 && !guestWasMuted; i++) await sleep(100);
    assert.ok(guestWasMuted, 'The guest must receive the server mute event');
    console.log('PASS host microphone mute enforced by the media server');
    await host.call(root + '/actions', { type: 'remove', memberId: person.id });
    for (let i = 0; i < 50 && !guestDisconnected; i++) await sleep(100);
    assert.ok(guestDisconnected, 'Removed guest must actually disconnect');
    await guest.call(root + '/token', {}, 403);
    console.log('PASS media participant removal and token revocation');
    await host.call(root + '/actions', { type: 'end' });
    ended = true;
    for (let i = 0; i < 50 && !hostDisconnected; i++) await sleep(100);
    assert.ok(hostDisconnected, 'Ending a room must disconnect the host');
    console.log('PASS end-for-all disconnects the live room');
  } finally {
    await sender.disconnect();
    await receiver.disconnect();
    for (const source of sources) await source.close();
    await audio?.close();
    await guestAudio?.close();
    if (!ended) await host.call(root + '/actions', { type: 'end' });
    await dispose();
  }
}
const timeout = setTimeout(() => {
  console.error('Media test timed out');
  process.exit(1);
}, 45000);
main()
  .then(() => {
    clearTimeout(timeout);
    console.log('Real WebRTC media verification passed.');
  })
  .catch((e) => {
    clearTimeout(timeout);
    console.error(e);
    process.exit(1);
  });
