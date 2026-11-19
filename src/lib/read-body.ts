import { HttpError } from './errors';
export async function readBytes(req: Request, max = 65536) {
  const declared = Number(req.headers.get('content-length'));
  if (declared > max) throw new HttpError(413, 'Request is too large.');
  if (!req.body) return Buffer.alloc(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new HttpError(413, 'Request is too large.');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    reader.releaseLock();
  }
}

export async function readBody(req: Request, max = 65536) {
  return (await readBytes(req, max)).toString('utf8');
}
