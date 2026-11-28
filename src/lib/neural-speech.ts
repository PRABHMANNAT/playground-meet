import { speechPhrases } from './speech-phrases';

type Engine = 'parakeet' | 'whisper';

export function neuralTranscriber(
  preferred: Engine,
  onText: (text: string, started: number) => void,
  onError: (message: string) => void,
  onFallback: (status: 'loading' | 'ready') => void,
) {
  const audio = new AudioContext({ sampleRate: 16000 });
  const resumed = audio.resume();
  let worker: Worker | undefined;
  let worklet: AudioWorkletNode | undefined, source: MediaStreamAudioSourceNode | undefined;
  let track: MediaStreamTrack | undefined;
  let stopped = false,
    failed = false,
    workerReady = false,
    hasLoaded = false,
    active = false;
  let finishPromise: Promise<void> | undefined;
  let settleLoad: (() => void) | undefined,
    settleFlush: (() => void) | undefined,
    settleDrain: (() => void) | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const queue: { samples: Float32Array; started: number }[] = [];
  let engine = preferred;
  function fail(message: string) {
    if (failed) return;
    failed = true;
    clearTimeout(watchdog);
    settleLoad?.();
    settleDrain?.();
    onError(message + ' Try Lite captions on this device.');
  }
  function recover(message: string) {
    if (engine === 'parakeet') {
      onFallback('loading');
      runWorker('whisper');
    } else {
      fail(message);
    }
  }
  function next() {
    if (failed || !workerReady || active) return;
    const item = queue[0];
    if (!item) {
      settleDrain?.();
      return;
    }
    active = true;
    watchdog = setTimeout(() => recover('Speech recognition timed out.'), 30000);
    // Keep the in-flight phrase so a replacement worker can retry it.
    worker!.postMessage({ type: 'recognize', audio: item.samples });
  }
  const phrases = speechPhrases((samples, started) => {
    if (failed) return;
    if (queue.length >= 24) {
      fail('This device could not keep up with live speech.');
      return;
    }
    queue.push({ samples, started });
    next();
  });
  function runWorker(mode: Engine) {
    clearTimeout(watchdog);
    worker?.terminate();
    workerReady = active = false;
    engine = mode;
    let current: Worker;
    try {
      current =
        mode === 'parakeet'
          ? new Worker('/speech/parakeet-worker.js')
          : new Worker('/speech/whisper-worker.js', { type: 'module' });
    } catch {
      recover('Speech recognition could not run in this browser.');
      return;
    }
    worker = current;
    current.onerror = () => {
      if (worker === current && !failed)
        recover('Speech recognition could not run in this browser.');
    };
    current.onmessage = ({ data }) => {
      if (worker !== current || failed) return;
      clearTimeout(watchdog);
      if (data.type === 'ready') {
        workerReady = hasLoaded = true;
        if (mode !== preferred) onFallback('ready');
        settleLoad?.();
      } else if (data.type === 'error') {
        recover(workerReady ? 'Speech recognition stopped.' : 'The speech model could not load.');
        return;
      } else if (data.type === 'text') {
        const item = queue.shift();
        if (item && data.text) onText(data.text, item.started);
        active = false;
      }
      next();
    };
    watchdog = setTimeout(() => recover('The speech model took too long to load.'), 120000);
    current.postMessage({ type: 'load' });
  }
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
    const ready = new Promise<void>((resolve) => {
      settleLoad = resolve;
    });
    runWorker(preferred);
    await ready;
  }
  async function finish() {
    stopped = true;
    source?.disconnect();
    settleLoad?.();
    try {
      if (worklet && hasLoaded && !failed) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 300);
          settleFlush = () => {
            clearTimeout(timer);
            resolve();
          };
          worklet!.port.postMessage('flush');
        });
        phrases.flush();
        if (queue.length && !failed) {
          await new Promise<void>((resolve) => {
            const timer = setTimeout(
              () => fail('The final phrases could not be transcribed.'),
              30000,
            );
            settleDrain = () => {
              clearTimeout(timer);
              resolve();
            };
          });
        }
      }
    } finally {
      clearTimeout(watchdog);
      worklet?.disconnect();
      worklet?.port.close();
      worker?.terminate();
      await audio.close();
    }
  }
  return { attach, start, stop: () => (finishPromise ??= finish()) };
}
