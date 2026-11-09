# Security model and known boundaries

## Trust and identity

Guest sessions are authenticated anonymous identities, not verified real-world identities. Knowing a meeting link is not admission when the lobby is enabled. The server generates opaque identity/session IDs; it never accepts a client-provided host flag or participant ID as the actor. Password accounts provide persistent identity with salted scrypt hashes; email verification and password-reset mail are intentionally not implemented because no email service is configured. For an existing Playground user base, prefer the signed SSO exchange.

Sessions are HttpOnly, SameSite=Lax, secure in production and revocable in the database. Only hashes are persisted. Accounts preserve a current guest’s identity during registration. Seven-day sessions do not silently become permanent. Signing out revokes that cookie; it does not remotely erase copies of meeting content or other signed-in devices.

## Authorization

Each token, snapshot, command and summary request checks server-side room membership. Host-only commands are checked inside the room transaction. Notes use a revision compare-and-swap; votes are keyed by authenticated identity. Roles are not trusted from LiveKit metadata or data packets. Media JWTs include one room and identity, no roomAdmin grant, and no publish-data permission. Chat/collaboration travels through the authenticated API.

Mutations reject missing and foreign Origin headers. APP_URL must be a trusted fixed deployment value. The browser policy denies framing and geolocation; user-controlled review URLs require HTTPS. React escapes chat/notes; no user HTML is injected. JSON bodies and event fields are bounded. Database calls are parameterized. Persistent counters provide basic request limits; deploy a reverse-proxy/IP limiter for anonymous abuse prevention. Creating new guest identities can bypass identity-specific limits.

## Media boundaries

WebRTC transport is encrypted. End-to-end media encryption is not implemented. The LiveKit operator is trusted. Host mute never remotely unmutes a person. A removed identity cannot request a fresh token or collaboration data. Previously issued self-hosted LiveKit tokens can remain cryptographically valid for two minutes; signed participant-joined webhooks evict revoked identities but may allow a brief connection before processing. Use a provider with token revocation or stronger admission infrastructure if zero-window revocation is mandatory.

The generated production setup requires the webhook. Test the rejection/reconnect path after deployment. A failed media-control RPC returns an explicit warning; saved access policy does not falsely report confirmed media disconnection.

## Data and operations

Meeting members share notes/messages/feedback and can export them. There is no private-chat feature. Local drafts are sessionStorage in the current browser tab. PGlite must not be exposed as a filesystem or shared between workers. Postgres should remain on a private service network. Backups contain sensitive meeting data and need appropriate access controls.

CSP allows inline scripts/styles for Next.js hydration and Motion. Production hardening can add per-request nonces and remove unsafe-eval (currently retained for development compatibility). This is not a claim of an independent security audit. No secrets belong in NEXT_PUBLIC_ variables, Git, screenshots, or client logs.

Report security findings privately to the repository owner; avoid posting credentials or private meeting content in a public issue.
