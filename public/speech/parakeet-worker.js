// A classic worker so the Sherpa-ONNX Emscripten scripts share their Module.
const assets = new URL('./parakeet-en-v1/', self.location.href);
const sampleRate = 16000;
const vadWindow = 512;
let recognizer;
let vad;
var Module;

async function load() {
  const files = [
    'encoder.int8.onnx',
    'decoder.int8.onnx',
    'joiner.int8.onnx',
    'tokens.txt',
    'silero_vad.onnx',
  ];
  const [, ...weights] = await Promise.all([
    new Promise((resolve, reject) => {
      Module = {
        locateFile: (name) => new URL(name, assets).href,
        onRuntimeInitialized: resolve,
        onAbort: reject,
      };
      importScripts(
        new URL('sherpa-onnx-asr.js', assets).href,
        new URL('sherpa-onnx-vad.js', assets).href,
        new URL('sherpa-onnx-wasm-main-vad-asr.js', assets).href,
      );
    }),
    ...files.map(async (name) => {
      const response = await fetch(new URL(name, assets));
      if (!response.ok) throw new Error(`Cannot load ${name}: HTTP ${response.status}`);
      return new Uint8Array(await response.arrayBuffer());
    }),
  ]);
  for (const [index, name] of files.entries()) {
    Module.FS_createDataFile('/', name, weights[index], true, false, true);
  }
  recognizer = new OfflineRecognizer(
    {
      featConfig: { sampleRate, featureDim: 80 },
      modelConfig: {
        modelType: 'nemo_transducer',
        transducer: {
          encoder: '/encoder.int8.onnx',
          decoder: '/decoder.int8.onnx',
          joiner: '/joiner.int8.onnx',
        },
        tokens: '/tokens.txt',
        numThreads: 1,
        provider: 'cpu',
      },
      decodingMethod: 'greedy_search',
    },
    Module,
  );
  vad = createVad(Module, {
    sileroVad: {
      model: '/silero_vad.onnx',
      threshold: 0.35,
      minSilenceDuration: 0.45,
      minSpeechDuration: 0.12,
      maxSpeechDuration: 20,
      windowSize: vadWindow,
    },
    sampleRate,
    numThreads: 1,
    provider: 'cpu',
  });
  if (!recognizer.handle || !vad.handle) throw new Error('Parakeet could not initialize.');
  for (const name of files) Module.FS_unlink('/' + name);
}

function recognize(samples) {
  // Confirm that the loud enough phrases from the microphone contain speech.
  // Decode the original phrase so low-energy consonants and word endings survive.
  vad.reset();
  vad.acceptWaveform(samples);
  vad.acceptWaveform(new Float32Array(vadWindow * 4));
  vad.flush();
  if (vad.isEmpty()) return '';
  const stream = recognizer.createStream();
  try {
    stream.acceptWaveform(sampleRate, samples);
    recognizer.decode(stream);
    return recognizer.getResult(stream).text.trim();
  } finally {
    stream.free();
  }
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      await load();
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'recognize') {
      self.postMessage({ type: 'text', text: recognize(data.audio) });
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.message || error) });
  }
};
