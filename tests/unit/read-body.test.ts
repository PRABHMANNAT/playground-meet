import { test, expect } from 'vitest';
import { readBody } from '../../src/lib/read-body';
test('chunked bodies are stopped at the byte limit without a content-length', async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(new Uint8Array(40000));
    },
    cancel() {
      cancelled = true;
    },
  });
  const req = new Request('http://localhost', {
    method: 'POST',
    body: stream,
    duplex: 'half',
  } as RequestInit);
  await expect(readBody(req)).rejects.toThrow('too large');
  expect(cancelled).toBe(true);
});
test('body limit counts UTF-8 bytes and preserves valid Unicode', async () => {
  const payload = JSON.stringify({ message: 'Hello 🌿' });
  const req = new Request('http://localhost', { method: 'POST', body: payload });
  expect(await readBody(req)).toBe(payload);
  await expect(
    readBody(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-length': '999999' },
        body: '{}',
      }),
    ),
  ).rejects.toThrow();
});
