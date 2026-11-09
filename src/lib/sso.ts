import { jwtVerify } from 'jose';
import { invariant, HttpError } from './errors';
export async function verifySSO(token: string, secret: string) {
  invariant(secret.length >= 32, 503, 'Playground sign-in is not configured.');
  let verified;
  try {
    verified = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
      issuer: 'https://tryplayground.net',
      audience: 'playground-meet',
      maxTokenAge: '60s',
      requiredClaims: ['sub', 'jti', 'exp', 'iat'],
    });
  } catch {
    throw new HttpError(401, 'This Playground sign-in link is invalid or expired.');
  }
  const { payload } = verified;
  invariant(
    typeof payload.sub === 'string' &&
      payload.sub.length <= 100 &&
      typeof payload.jti === 'string' &&
      payload.jti.length <= 100 &&
      typeof payload.name === 'string' &&
      payload.name.length <= 60,
    400,
    'Invalid Playground identity.',
  );
  return payload;
}
