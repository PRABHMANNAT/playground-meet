import { NextResponse } from 'next/server';
import { readBody } from './read-body';
import { ZodError } from 'zod';
import { HttpError } from './errors';
import { allowedOrigins } from './app-url';
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin || !allowedOrigins().has(origin))
    throw new HttpError(403, 'Request origin is not allowed.');
}
export async function body(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    throw new HttpError(415, 'Use application/json.');
  const text = await readBody(req);
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
export function api(fn: () => Promise<unknown>) {
  return fn()
    .then((v) => NextResponse.json(v, { headers: { 'Cache-Control': 'no-store' } }))
    .catch((e) => {
      const status = e instanceof HttpError ? e.status : e instanceof ZodError ? 400 : 500;
      if (status === 500) console.error('API failure:', e instanceof Error ? e.message : 'Unknown');
      return NextResponse.json(
        {
          error:
            status === 500
              ? 'Something went wrong. Please try again.'
              : e instanceof ZodError
                ? e.issues[0]?.message
                : e.message,
        },
        {
          status,
          headers: {
            'Cache-Control': 'no-store',
            ...(status === 429 ? { 'Retry-After': '60' } : {}),
          },
        },
      );
    });
}
