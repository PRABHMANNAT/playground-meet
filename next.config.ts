import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  poweredByHeader: false,
  devIndicators: false,
  async redirects() {
    return [
      { source: '/room/:path*', destination: '/playground-meet/:path*', permanent: true },
      { source: '/playground-meet', destination: '/', permanent: true },
    ];
  },
  async headers() {
    // LiveKit Cloud fetches regional endpoints over HTTPS as well as signaling over WSS.
    const mediaSources = [
      "'self'",
      'ws:',
      'wss:',
      'https://*.livekit.cloud',
      'https://*.livekit.run',
    ];
    const livekitUrl = process.env.LIVEKIT_URL;
    if (livekitUrl?.startsWith('wss://')) {
      mediaSources.push(new URL(livekitUrl).origin.replace(/^wss:/, 'https:'));
    }
    const contentPolicy = (browser: boolean) => ({
      key: 'Content-Security-Policy',
      value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src ${mediaSources.join(' ')}${browser ? ' https://en.wikipedia.org' : ''}; media-src 'self' blob:; frame-src ${browser ? 'https:' : "'none'"}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
    });
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), display-capture=(self), geolocation=()',
          },
          contentPolicy(false),
        ],
      },
      { source: '/playground-meet/:id', headers: [contentPolicy(true)] },
    ];
  },
};
export default config;
