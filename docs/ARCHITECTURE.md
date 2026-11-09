# Architecture

The browser loads a statically rendered Next.js shell. WebRTC code is dynamically imported only after prejoin. Camera/microphone preview is local; tracks are stopped before entering the actual room. LiveKit negotiates media, adaptive subscriptions, simulcast and reconnection. No media goes through Next.js.

Next.js API handlers authenticate opaque HttpOnly sessions, verify exact write origins against APP_URL, validate Zod schemas, and enforce membership on every collaboration/media-token endpoint. The database stores only session hashes. Users can upgrade a guest identity into an account without losing their rooms.

Postgres is the production storage engine. Development uses PGlite, an embedded PostgreSQL runtime on a persistent directory. Use one Node process with PGlite; it is not a shared database for multiple replicas or ephemeral/serverless filesystems. Transactions lock the room row, recheck admission/host permissions, apply a command, increment the revision and append an authenticated event.

Room state contains shared notes and version, normalized strokes, polls and per-identity votes, focus deadline and review brief. Messages/reactions/feedback are events. Foreground clients poll every 1.2 seconds, background tabs every 5 seconds. Authenticated ETags return 304 when nothing changed. Join requests also invalidate the revision. There is no browser-provided identity trusted by the event dispatcher.

The UI displays the latest 500 events. Summary export separately loads every persisted feedback marker and rating, so a busy chat cannot truncate the exported feedback. Notes/polls/review live in durable room state. Downloaded summaries belong to recipients and cannot be recalled by removing membership.

Deployment separates four services: Next.js, PostgreSQL, LiveKit and Caddy. Caddy terminates HTTPS/WSS. LiveKit requires direct UDP and TCP media access plus TURN for difficult networks. A normal HTTP serverless function cannot host the SFU.

## Boundaries

No recording, transcription, AI inference, email delivery, automatic calendar booking or automatic external issue filing. Bug reports are durable meeting feedback and exports. SSO is an integration contract; the parent Playground application must mint assertions on its trusted server.
