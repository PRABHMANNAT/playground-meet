import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const folder = new URL('../public/speech/', import.meta.url);
await mkdir(folder, { recursive: true });
await copyFile(require.resolve('vosk-browser'), new URL('vosk-0.0.8.js', folder));
