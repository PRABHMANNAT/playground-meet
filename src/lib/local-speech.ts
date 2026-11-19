import type { Model, KaldiRecognizer } from 'vosk-browser/dist/model';

type Runtime = { Model: typeof Model };
declare global {
  interface Window {
    Vosk: Runtime;
  }
}
let runtime: Promise<Runtime> | undefined;
function loadRuntime() {
  if (!runtime) {
    runtime = new Promise<Runtime>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/speech/vosk-0.0.8.js';
      script.onload = () => resolve(window.Vosk);
      script.onerror = () => {
        runtime = undefined;
        script.remove();
        reject(new Error('Speech recognition could not load. Try again.'));
      };
      document.head.append(script);
    });
  }
  return runtime;
}

export function microphoneTranscriber(
  onText: (text: string) => void,
  onDraft: (text: string) => void,
) {
  // Resume in the click handler so browser autoplay rules allow microphone processing.
  const audio = new AudioContext({ sampleRate: 16000 });
  const resumed = audio.resume();
  let model: Model | undefined, recognizer: KaldiRecognizer | undefined;
  let worklet: AudioWorkletNode | undefined, source: MediaStreamAudioSourceNode | undefined;
  let track: MediaStreamTrack | undefined,
    stopped = false;
  let flushed: (() => void) | undefined, final: (() => void) | undefined;
  let cancelLoad: (() => void) | undefined;
  let stopping: Promise<void> | undefined;
  function attach(next?: MediaStreamTrack) {
    source?.disconnect();
    source = undefined;
    if (track && !next && !stopped) recognizer?.retrieveFinalResult();
    track = next;
    if (worklet && next && !stopped) {
      source = audio.createMediaStreamSource(new MediaStream([next]));
      source.connect(worklet);
    }
  }
  async function start() {
    await resumed;
    const [vosk] = await Promise.all([
      loadRuntime(),
      audio.audioWorklet.addModule('/speech/microphone.js'),
    ]);
    if (stopped) return;
    const loading = new vosk.Model(
      new URL('/speech/vosk-small-en-us-0.15.tar.gz', location.href).href,
      -1,
    );
    model = loading;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('English speech model timed out. Please retry.')),
        120000,
      );
      cancelLoad = () => {
        clearTimeout(timer);
        resolve();
      };
      loading.on('load', (m) => {
        clearTimeout(timer);
        if (m.event === 'load' && m.result) resolve();
        else reject(new Error('English speech model could not load.'));
      });
      loading.on('error', () => {
        clearTimeout(timer);
        reject(new Error('English speech model is unavailable.'));
      });
    });
    if (stopped) return;
    recognizer = new loading.KaldiRecognizer(audio.sampleRate);
    recognizer.on('result', (m) => {
      if (m.event !== 'result') return;
      if (m.result.text.trim()) onText(m.result.text.trim());
      onDraft('');
      final?.();
    });
    recognizer.on('partialresult', (m) => {
      if (m.event === 'partialresult' && !stopped) onDraft(m.result.partial);
    });
    worklet = new AudioWorkletNode(audio, 'meeting-microphone', {
      channelCount: 1,
      channelCountMode: 'explicit',
    });
    worklet.port.onmessage = ({ data }) => {
      if (data === 'flushed') flushed?.();
      else recognizer?.acceptWaveformFloat(data, audio.sampleRate);
    };
    // The processor writes silence to its output, so the local microphone never feeds back.
    worklet.connect(audio.destination);
    attach(track);
  }
  async function finish() {
    stopped = true;
    cancelLoad?.();
    source?.disconnect();
    if (worklet && recognizer) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 400);
        flushed = () => {
          clearTimeout(timer);
          resolve();
        };
        worklet!.port.postMessage('flush');
      });
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2200);
        final = () => {
          clearTimeout(timer);
          resolve();
        };
        recognizer!.retrieveFinalResult();
      });
    }
    worklet?.disconnect();
    worklet?.port.close();
    recognizer?.remove();
    if (model?.ready) model.terminate();
    else if (model) {
      // In vosk-browser 0.0.8 the public terminate message frees a model that
      // does not exist yet when loading fails or is cancelled.
      (model as unknown as { worker: Worker }).worker.terminate();
    }
    await audio.close();
  }
  return { start, attach, stop: () => (stopping ??= finish()) };
}
