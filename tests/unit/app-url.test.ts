import { afterEach, expect, test, vi } from 'vitest';
import { appOrigin } from '../../src/lib/app-url';
import { sameOrigin } from '../../src/lib/http';

afterEach(() => vi.unstubAllEnvs());
function environment() {
  for (const key of [
    'APP_URL',
    'VERCEL',
    'VERCEL_ENV',
    'VERCEL_URL',
    'VERCEL_BRANCH_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
  ])
    vi.stubEnv(key, '');
}
test('local and Vercel URLs are resolved without a hard-coded production domain', () => {
  environment();
  expect(appOrigin()).toBe('http://localhost:3000');
  vi.stubEnv('VERCEL_URL', 'meet-deploy.vercel.app');
  expect(appOrigin()).toBe('https://meet-deploy.vercel.app');
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'playground-meet.vercel.app');
  expect(appOrigin()).toBe('https://playground-meet.vercel.app');
  vi.stubEnv('APP_URL', 'https://meet.example.com/');
  expect(appOrigin()).toBe('https://meet.example.com');
});

test('Vercel previews accept their exact assigned origins while rejecting arbitrary hosts', () => {
  environment();
  vi.stubEnv('APP_URL', 'https://meet.example.com');
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('VERCEL_URL', 'meet-deploy.vercel.app');
  vi.stubEnv('VERCEL_BRANCH_URL', 'meet-git-main.vercel.app');
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'playground-meet.vercel.app');
  for (const origin of [
    'https://meet.example.com',
    'https://meet-deploy.vercel.app',
    'https://meet-git-main.vercel.app',
    'https://playground-meet.vercel.app',
  ]) {
    expect(() =>
      sameOrigin(new Request(`${origin}/api/session`, { headers: { origin } })),
    ).not.toThrow();
  }
  for (const origin of [
    'https://evil.vercel.app',
    'https://meet.example.com.evil.test',
    'http://meet-deploy.vercel.app',
    'null',
  ]) {
    expect(() =>
      sameOrigin(
        new Request('https://meet-deploy.vercel.app/api/session', {
          headers: { origin, 'x-forwarded-host': 'evil.vercel.app' },
        }),
      ),
    ).toThrow();
  }
});
