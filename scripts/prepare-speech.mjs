import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import translations from './translation-models.json' with { type: 'json' };

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
async function prepare(base, directory, files, { transform, outputHash } = {}) {
  await Promise.all(
    Object.entries(files).map(async ([file, hash]) => {
      const dest = new URL(file, directory);
      try {
        if (digest(await readFile(dest)) === (outputHash ?? hash)) return;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const response = await fetch(base + file, { signal: AbortSignal.timeout(240000) });
      if (!response.ok)
        throw new Error('Cannot prepare speech asset ' + file + ': HTTP ' + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (digest(bytes) !== hash) throw new Error('Invalid speech asset: ' + file);
      const output = transform ? transform(bytes) : bytes;
      if (outputHash && digest(output) !== outputHash)
        throw new Error('Invalid generated speech asset: ' + file);
      const temp = new URL(file + '.' + randomUUID() + '.tmp', directory);
      try {
        await writeFile(temp, output);
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

const parakeet = new URL('parakeet-en-v1/', folder);
await mkdir(parakeet, { recursive: true });
const sherpaSource =
  'https://huggingface.co/spaces/k2-fsa/web-assembly-vad-asr-sherpa-onnx-zh-zipformer-ctc/resolve/9d5fc71d88ab1222ed1af2274fb194592af48455/';
const parakeetSource =
  'https://huggingface.co/krut42/voice-parakeet-tdt-110m-en-int8/resolve/d5b332d3956a2cae93c092425e7c7d3418be5361/';
await Promise.all([
  prepare(sherpaSource, parakeet, {
    'sherpa-onnx-asr.js': '6297ed7520e0b4569486cd89be89045146728605418254fec4172194abc36c8d',
    'sherpa-onnx-vad.js': 'ca2b0844d1cfd375cbb7faba206e456c5140561578b67f5fc6e7510d09e75510',
    'sherpa-onnx-wasm-main-vad-asr.wasm':
      'e4dead1d159c531282e635069fa9e028175dee71f3f90908186994655425b3ce',
  }),
  prepare(
    sherpaSource,
    parakeet,
    {
      'sherpa-onnx-wasm-main-vad-asr.js':
        '8a7f50a3e4e5930749e8aff9ad98f03753b87490e7796c576947611439dae9d0',
    },
    {
      outputHash: 'f357316b00f6cf8cb59c26a3a3f46f8f48f7f72545184f895a2bf1b16df27afc',
      transform(bytes) {
        // Remove the demo's Emscripten data preloader. The worker supplies Parakeet's
        // weights to the same runtime instead of downloading the bundled Zipformer model.
        const source = bytes.toString('utf8');
        const start = source.indexOf(';if(!Module.expectedDataFileDownloads)');
        const end = source.indexOf('var moduleOverrides=');
        return source.slice(0, start + 1) + source.slice(end);
      },
    },
  ),
  prepare(parakeetSource, parakeet, {
    'encoder.int8.onnx': '0f35509ddeb9b39002fb077d979a9fe74f06eb0bc4dd5c34f512f82e5111d657',
    'decoder.int8.onnx': 'f7c331c5504c2e593c76ed22b728e3f554af6c4a383dde862e719ced08b1da19',
    'joiner.int8.onnx': 'bf7dff69e9f2cdbe9943d70da358f38b361c115ba0105bae7e908e0d6ec782f6',
    'tokens.txt': '450e56bd2f036fe5b6aa821865838cc5aa9d8b0106134ce9a9ba0664abe6cd10',
  }),
  prepare('https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/', parakeet, {
    'silero_vad.onnx': '9e2449e1087496d8d4caba907f23e0bd3f78d91fa552479bb9c23ac09cbb1fd6',
  }),
]);

// Prepare one language at a time to limit peak build memory. Each viewer only
// downloads the language they select, and translations use same-origin assets.
for (const [language, pack] of Object.entries(translations)) {
  const directory = new URL('translation-v1/' + language + '/', folder);
  await mkdir(new URL('onnx/', directory), { recursive: true });
  await prepare(
    'https://huggingface.co/' + pack.repo + '/resolve/' + pack.revision + '/',
    directory,
    pack.files,
  );
}
