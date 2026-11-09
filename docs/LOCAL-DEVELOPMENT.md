# Local development

Install Node 22+ and Git. `npm ci` installs the locked dependencies. Copy `.env.example` to `.env.local`; leave DATABASE_URL absent to use `.data/meet`. Obtain LiveKit only from [official releases](https://github.com/livekit/livekit/releases). Run `livekit-server --dev --bind 127.0.0.1` separately, then `npm run dev`.

Use http://localhost:3000, matching APP_URL. Opening http://127.0.0.1:3000 while APP_URL is localhost displays the page but rejects writes intentionally. Local development is loopback-only by default. To test a physical phone, use trusted HTTPS and a network-accessible LiveKit host; plain HTTP on a LAN IP cannot access the camera in modern browsers.

The local LiveKit development API key is devkey and secret is secret. They are public development defaults, not credentials for any deployed service. Production refuses them. A local test-only environment can set PLAYGROUND_SSO_SECRET to at least 32 random characters to exercise SSO.

PGlite creates its directory on first request. Initial startup may take a few seconds. Stop the Node process before copying the database directory. Never open the same PGlite directory from a second application process; use a separate DATABASE_PATH for tests that instantiate their own database.

Guest sessions expire after seven days. Register from the homepage before expiry to keep ownership across devices. Tests create explicitly named local rooms and accounts; use a disposable test database if you do not want these mixed with development data.

## Common issues

- **503 calling not configured:** check all LIVEKIT_* settings and restart Next.js.
- **403 origin not allowed:** match the address-bar origin and APP_URL exactly.
- **No microphone/camera:** grant permission deliberately; close another application using the device. Joining muted is supported.
- **No sound on mobile:** tap the enable-audio prompt; mobile browsers require user activation.
- **Works locally but not remotely:** localhost URLs are not reachable from another device. Configure public WSS, certificates and media firewall/TURN routes.
- **Room ended:** start a new meeting; ended rooms cannot issue new tokens.
- **Unsaved notes:** drafts remain in sessionStorage per room/user in that tab. Copy the draft before loading a newer shared revision.
