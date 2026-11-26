import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const folder = new URL('../public/speech/', import.meta.url);
await mkdir(folder, { recursive: true });
await copyFile(require.resolve('vosk-browser'), new URL('vosk-0.0.8.js', folder));

// Only the browser distribution is needed. Fetch it during setup so calls work offline
// from the model providers and no server-side ML libraries or GPU drivers are required.
const assets = new URL('whisper-base-en-v1/', folder);
const model = new URL('model/', assets);
await mkdir(new URL('onnx/', model), { recursive: true });
const runtimeSource = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
const modelSource =
  'https://huggingface.co/Xenova/whisper-base.en/resolve/95bf40a508535962c6483ead40270b2e32267508/';
const runtimeFiles = {
  'transformers.min.js': 'aa5002b70e789798da263f5f99c62bd3e8fcd0c119258a493c40c180648365fa',
  'ort-wasm-simd-threaded.jsep.mjs':
    '08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9',
  'ort-wasm-simd-threaded.jsep.wasm':
    'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
};
const modelFiles = {
  'config.json': '5c390f2c6ba84ddeb7e362cd8b2123832911407850174e64d7081ccc36df2d64',
  'preprocessor_config.json': 'a6a76d28c93edb273669eb9e0b0636a2bddbb1272c3261e47b7ca6dfdbac1b8d',
  'tokenizer.json': 'c6ee8f089220a5b1188f6426456772572671c6141ae007eecb83c6a8349f5deb',
  'tokenizer_config.json': 'e082c1ad251541bf277967a703252cddd4bb37a71a43737e03d050c22ec08238',
  'generation_config.json': '1e57ed56ad1bd7f08a49ece7fe7daada674573805a35f8bdbbe68380aab5b1ee',
  'onnx/encoder_model_quantized.onnx':
    'd0d4e59e2842617b39787cece73d7e8f76f99b1697d3386c0e682eca2269f4a1',
  'onnx/decoder_model_merged_quantized.onnx':
    'a25afc5858a20aabb7652cb2d555996ebe10691a69bbdb423d5073d52f060325',
};
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function prepare(base, directory, files) {
  await Promise.all(
    Object.entries(files).map(async ([file, hash]) => {
      const dest = new URL(file, directory);
      try {
        if (digest(await readFile(dest)) === hash) return;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const response = await fetch(base + file, { signal: AbortSignal.timeout(240000) });
      if (!response.ok)
        throw new Error('Cannot prepare Whisper ' + file + ': HTTP ' + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (digest(bytes) !== hash) throw new Error('Invalid Whisper asset: ' + file);
      const temp = new URL(file + '.' + randomUUID() + '.tmp', directory);
      try {
        await writeFile(temp, bytes);
        await rename(temp, dest);
      } finally {
        await rm(temp, { force: true });
      }
    }),
  );
}
await Promise.all([
  prepare(runtimeSource, assets, runtimeFiles),
  prepare(modelSource, model, modelFiles),
]);
