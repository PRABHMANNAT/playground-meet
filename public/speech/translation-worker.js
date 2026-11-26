import { env, pipeline } from './whisper-base-en-v1/transformers.min.js';

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL('./translation-v1/', self.location.href).href;
env.backends.onnx.wasm.wasmPaths = new URL('./whisper-base-en-v1/', self.location.href).href;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

const prefixes = new Map([
  ['de', ''], ['es', ''], ['fr', ''], ['hi', ''], ['pt', '>>pt<< '], ['zh', '>>cmn_Hans<< '],
]);
let translate, prefix;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      if (!prefixes.has(data.language)) throw new Error('Unknown caption language');
      prefix = prefixes.get(data.language);
      translate = await pipeline('translation', data.language, { device: 'wasm', dtype: 'q8' });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'translate') {
      const [result] = await translate(prefix + data.text, { num_beams: 4, max_new_tokens: 256 });
      const text = result.translation_text.trim();
      if (!text) throw new Error('Empty translation');
      self.postMessage({ type: 'caption', id: data.id, text });
    }
  } catch {
    self.postMessage({ type: 'error' });
  }
};
