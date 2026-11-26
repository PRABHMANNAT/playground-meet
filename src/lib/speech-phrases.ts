// Keep a little leading audio so quiet consonants survive the start of a phrase.
const sampleRate = 16000;
export function speechPhrases(onPhrase: (samples: Float32Array, started: number) => void) {
  let frames: Float32Array[] = [];
  let count = 0,
    voiced = 0,
    quiet = 0,
    noiseFloor = 0.0015,
    started = 0;
  const reset = () => {
    frames = [];
    count = voiced = quiet = 0;
  };
  function flush() {
    if (voiced >= sampleRate * 0.14) {
      const samples = new Float32Array(count);
      let offset = 0;
      for (const frame of frames) {
        samples.set(frame, offset);
        offset += frame.length;
      }
      onPhrase(samples, started);
    }
    reset();
  }
  function push(frame: Float32Array, now: number) {
    if (!frame.length) return;
    let energy = 0;
    for (const sample of frame) energy += sample * sample;
    const rms = Math.sqrt(energy / frame.length);
    const speech = rms > Math.max(0.0025, noiseFloor * 2.7);
    if (!voiced && !speech) noiseFloor = 0.94 * noiseFloor + 0.06 * rms;
    frames.push(frame);
    count += frame.length;
    if (speech) {
      if (!voiced) started = now - (count * 1000) / sampleRate;
      voiced += frame.length;
      quiet = 0;
    } else if (voiced) {
      quiet += frame.length;
    } else {
      while (count > sampleRate * 0.32 && frames.length > 1) count -= frames.shift()!.length;
    }
    if (quiet >= sampleRate * 0.65 || count >= sampleRate * 12) flush();
  }
  return { push, flush };
}
