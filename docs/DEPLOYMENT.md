# Deploy at meet.tryplayground.net

## Prerequisites

A Linux host you already control with Docker Compose, a public IP, disk for PostgreSQL, and access to tryplayground.net DNS. No host has been purchased or account created by this repository. Free software does not remove electricity, bandwidth, domain or hosting costs. Use an existing host to avoid a new subscription.

1. Point `meet.tryplayground.net` and `rtc.meet.tryplayground.net` A records at the host. If using a DNS/CDN provider, keep the RTC hostname DNS-only; ordinary HTTP proxies cannot relay media UDP.
2. Clone the repository. Run `node scripts/setup-production.mjs`. It creates ignored `.env.production` and `deploy/livekit.generated.yaml` with random credentials. Keep them private and backed up. Never use devkey/secret in production.
3. Open inbound TCP 80/443 for Caddy, TCP 7881 for WebRTC fallback, UDP 50000–50100 for media, and UDP 3478 for TURN. Keep Postgres unexposed. Restrict direct 7880 access; browser signaling goes through WSS on 443.
4. Run `docker compose --env-file .env.production up -d --build` on Linux. The media and proxy services use host networking. This production Compose is not a Windows Docker Desktop networking recipe.
5. Caddy obtains trusted TLS certificates after DNS and ports are reachable. Check `docker compose --env-file .env.production logs app caddy livekit` without posting sensitive logs publicly.
6. Verify `https://meet.tryplayground.net/api/health`, then create a call from two different networks. Test camera/audio, screen sharing, host removal, mobile audio unlock and reconnect.

## TURN/TLS for restrictive networks

The generated config includes authenticated TURN/UDP. Corporate networks that block UDP may need TURN/TLS on 443 or 5349 with a trusted certificate and a separate domain/IP or L4 proxy. Complete the [official LiveKit TLS/TURN deployment guide](https://docs.livekit.io/transport/self-hosting/deployment/) before claiming universal connectivity. A standard Caddy HTTP reverse proxy does not proxy TURN. The configuration here does not claim that it does.

Alternatively, use LiveKit Cloud Build while within its free quota: replace LIVEKIT_URL, LIVEKIT_INTERNAL_URL, API key and secret with that project’s values; remove the local livekit/RTC Caddy service as appropriate. Configure its signed webhook to `https://meet.tryplayground.net/api/livekit/webhook`. Do not enable paid upgrades or billing without the owner’s decision.

## Operational checks

- APP_URL must be exactly `https://meet.tryplayground.net`; same-origin writes fail otherwise.
- Production cookies require HTTPS. LIVEKIT_URL must be WSS and production credentials must not be dev defaults.
- Configure the signed LiveKit webhook. It removes revoked identities attempting to reconnect with an existing token. Self-hosted LiveKit does not make a two-minute previously issued JWT disappear; webhook enforcement is necessary and may have a brief event-delivery delay.
- Back up the Postgres volume with `pg_dump`; restore into a separate database to verify backups. Keep credentials out of archives shared with others.
- Schedule retention on a trusted runner that has DATABASE_URL: `npx tsx --env-file=.env.production scripts/cleanup.ts --apply`. The default is 30 days for ended rooms; use RETENTION_DAYS to change it. Resolve the database host from that runner (Compose service name `db` is only inside the Compose network).
- Monitor disk, CPU, packet loss, outbound bandwidth and room count. Validate upgrades in staging; Docker images are pinned by release family, not immutable digest.

## Rollback

Keep the prior image/tag and database backup. Rebuild from the previous Git commit and restart only the app. Do not regenerate credentials or delete volumes to roll back UI changes. The current schema is additive and initialized with CREATE TABLE IF NOT EXISTS; future schema changes need reviewed migrations.

Docker deployment is provided as source/configuration and requires a host-side smoke test. Local validation does not prove DNS, public TLS or cross-network TURN routing.
