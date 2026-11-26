// This module runs in a dedicated worker. Only finalized text leaves the recognizer.
import { env, pipeline } from './whisper-base-en-v1/transformers.min.js';

const assets = new URL('./whisper-base-en-v1/', self.location.href).href;
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = assets;
env.backends.onnx.wasm.wasmPaths = assets;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
let recognize;

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      recognize = await pipeline('automatic-speech-recognition', 'model', {
        device: 'wasm', dtype: 'q8',
      });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'recognize') {
      const result = await recognize(data.audio, { max_new_tokens: 128, do_sample: false });
      self.postMessage({ type: 'text', text: result.text.trim() });
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.message || error) });
  }
};
