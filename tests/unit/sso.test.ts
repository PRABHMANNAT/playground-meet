import { test, expect } from 'vitest';
import { SignJWT } from 'jose';
import { verifySSO } from '../../src/lib/sso';
const secret = 'a sufficiently long integration secret 12345';
const token = (issuer = 'https://tryplayground.net', audience = 'playground-meet', age = 0) =>
  new SignJWT({ name: 'Tester' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('person-1')
    .setJti('nonce-1')
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt(Math.floor(Date.now() / 1000) - age)
    .setExpirationTime('1m')
    .sign(new TextEncoder().encode(secret));
test('signed Playground identities are accepted with the right audience', async () => {
  expect((await verifySSO(await token(), secret)).sub).toBe('person-1');
});
test('wrong issuers audiences secrets and stale assertions are rejected', async () => {
  for (const t of [
    await token('https://evil.example'),
    await token(undefined, 'other-app'),
    await token(undefined, undefined, 120),
  ])
    await expect(verifySSO(t, secret)).rejects.toThrow();
  await expect(verifySSO(await token(), secret + 'wrong')).rejects.toThrow();
  await expect(verifySSO(await token(), 'short')).rejects.toThrow();
});
