import { speechPhrases } from './speech-phrases';

export function whisperTranscriber(
  onText: (text: string, started: number) => void,
  onError: (message: string) => void,
) {
  const audio = new AudioContext({ sampleRate: 16000 });
  const resumed = audio.resume();
  let worker: Worker | undefined;
  let worklet: AudioWorkletNode | undefined, source: MediaStreamAudioSourceNode | undefined;
  let track: MediaStreamTrack | undefined;
  let stopped = false,
    failed = false,
    active = false;
  let finishPromise: Promise<void> | undefined;
  let settleLoad: (() => void) | undefined,
    settleFlush: (() => void) | undefined,
    settleDrain: (() => void) | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const queue: { samples: Float32Array; started: number }[] = [];
  function fail(message: string) {
    if (failed) return;
    failed = true;
    clearTimeout(watchdog);
    settleLoad?.();
    settleDrain?.();
    onError(message + ' Try Lite captions on this device.');
  }
  function next() {
    if (failed || active) return;
    const item = queue[0];
    if (!item) {
      settleDrain?.();
      return;
    }
    active = true;
    watchdog = setTimeout(() => fail('Speech recognition timed out.'), 30000);
    worker!.postMessage({ type: 'recognize', audio: item.samples }, [item.samples.buffer]);
  }
  const phrases = speechPhrases((samples, started) => {
    if (failed) return;
    if (queue.length >= 5) {
      fail('This device could not keep up with live speech.');
      return;
    }
    queue.push({ samples, started });
    next();
  });
  function attach(nextTrack?: MediaStreamTrack) {
    if (track !== nextTrack) {
      source?.disconnect();
      source = undefined;
      if (track) worklet?.port.postMessage('flush');
      track = nextTrack;
    }
    if (worklet && track && !source && !stopped && !failed) {
      source = audio.createMediaStreamSource(new MediaStream([track]));
      source.connect(worklet);
    }
  }
  async function start() {
    await resumed;
    if (stopped) return;
    await audio.audioWorklet.addModule('/speech/microphone.js');
    if (stopped) return;
    worker = new Worker('/speech/whisper-worker.js', { type: 'module' });
    const ready = new Promise<void>((resolve) => {
      settleLoad = resolve;
    });
    worker.onerror = () => fail('Whisper could not run in this browser.');
    worker.onmessage = ({ data }) => {
      if (failed) return;
      if (data.type === 'ready') {
        clearTimeout(watchdog);
        settleLoad?.();
      }
      if (data.type === 'error') fail('Whisper could not process the audio.');
      if (data.type === 'text') {
        clearTimeout(watchdog);
        const item = queue.shift();
        if (item && data.text) onText(data.text, item.started);
        active = false;
        next();
      }
    };
    watchdog = setTimeout(() => fail('The speech model took too long to load.'), 180000);
    worker.postMessage({ type: 'load' });
    await ready;
    if (failed || stopped) return;
    worklet = new AudioWorkletNode(audio, 'meeting-microphone', {
      channelCount: 1,
      channelCountMode: 'explicit',
    });
    worklet.port.onmessage = ({ data }) => {
      if (data === 'flushed') {
        phrases.flush();
        settleFlush?.();
      } else phrases.push(data, Date.now());
    };
    worklet.connect(audio.destination);
    attach(track);
  }
  async function finish() {
    stopped = true;
    source?.disconnect();
    settleLoad?.();
    try {
      if (worklet && !failed) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 300);
          settleFlush = () => {
            clearTimeout(timer);
            resolve();
          };
          worklet!.port.postMessage('flush');
        });
        worklet.port.close();
        phrases.flush();
        if (queue.length && !failed)
          await new Promise<void>((resolve) => {
            settleDrain = resolve;
          });
      }
    } finally {
      clearTimeout(watchdog);
      worklet?.disconnect();
      worker?.terminate();
      await audio.close();
    }
  }
  return { attach, start, stop: () => (finishPromise ??= finish()) };
}
