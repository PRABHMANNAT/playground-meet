import { cp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

// Copy the matching loaders and binaries from the locked MediaPipe dependency.
const require = createRequire(import.meta.url);
const processorRequire = createRequire(require.resolve('@livekit/track-processors'));
const vision = dirname(processorRequire.resolve('@mediapipe/tasks-vision'));
await cp(join(vision, 'wasm'), new URL('../public/camera/wasm/', import.meta.url), {
  recursive: true,
});
