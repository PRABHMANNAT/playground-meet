# Deploy Playground Meet on Vercel

Import [PRABHMANNAT/playground-meet](https://github.com/PRABHMANNAT/playground-meet) in Vercel, select **Next.js**, leave Root Directory at the repository root, and use Node.js **24.x**. The committed `vercel.json` runs `npm ci` and `npm run build`; no static export, output directory override, Docker container or catch-all rewrite is needed.

## Required services and environment variables

The Next.js UI and API run on Vercel. Persistent data lives in an external PostgreSQL database, and audio/video use an external LiveKit server (LiveKit Cloud or your own server). Vercel does not run the included Docker Compose services. Importing the repository alone does not provision these services.

Set the following in Vercel Project Settings → Environment Variables for each environment you intend to use:

| Variable                | Value                                                                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | A PostgreSQL connection URL reachable from Vercel. Use your provider's pooled URL and its recommended TLS settings, e.g. `?sslmode=require`. Neon can be connected through Vercel Marketplace. |
| `LIVEKIT_URL`           | The browser-reachable `wss://` URL of your LiveKit server.                                                                                                                                     |
| `LIVEKIT_API_KEY`       | The API key from that LiveKit project.                                                                                                                                                         |
| `LIVEKIT_API_SECRET`    | The matching secret; development defaults are rejected in production.                                                                                                                          |
| `APP_URL`               | Optional for Vercel's assigned domains. Set to the exact HTTPS origin when using a custom domain, e.g. `https://meet.example.com`. No trailing path.                                           |
| `LIVEKIT_INTERNAL_URL`  | Optional HTTPS server API URL if different from the public LiveKit endpoint. Omit on Vercel for LiveKit Cloud; do not copy `http://localhost:7880` from local development.                     |
| `PLAYGROUND_SSO_SECRET` | Optional, only for the signed Playground SSO integration.                                                                                                                                      |

Keep credentials in Vercel, never in Git or client-side `NEXT_PUBLIC_` variables. Use separate preview/production databases and LiveKit projects where practical. Redeploy after changing variables. Enable Vercel's automatically exposed system environment variables (the default) so assigned preview and production domains are recognized. `APP_URL` takes precedence for metadata and custom domains; exact deployment, branch and project production origins are also accepted for API writes on Vercel. Arbitrary `*.vercel.app` origins and forwarded host headers are not trusted.

Vercel must have `DATABASE_URL`; local PGlite disk storage is deliberately disabled there because instances cannot share a persistent local database. Schema initialization is lazy and serialized across instances. A small connection pool is reused within each instance. Failed initialization can retry on the next request. Choose a Vercel function region close to your database and use a pooled connection URL to limit database connections across instances.

## Invitations and routes

All newly generated meeting URLs use:

```text
https://<your-domain>/playground-meet/abcdef-123456-fedcba
https://<your-domain>/playground-meet/abcdef-123456-fedcba/recap
```

The path always contains `playground-meet`, regardless of the domain. The copy buttons use the current origin and strip query strings, fragments and recap suffixes. Join accepts the code, new URL, relative path, or previously shared `/room/<code>` URL. Old `/room/...` routes permanently redirect to their new equivalents, retaining query parameters. Keep your old domain connected if invitations on that domain must remain reachable.

## Verify after deploying

1. Visit `/api/health`: expect `status: "ok"` and `callingConfigured: true`. This confirms database access and secure media configuration; it does not prove LiveKit reachability or successful media transport.
2. Create a meeting, copy its invite, and verify that it contains `/playground-meet/` and opens the preview directly after a refresh.
3. Open the invite in another browser, enter a different name, request admission, and admit that guest as host. Check video, audio, screen sharing and reconnect from two networks.
4. Check Meetings, Help, Privacy, recent meeting links, end-for-all, recap and summary download. Open an old `/room/<code>` URL and verify its redirect.
5. Configure LiveKit's signed webhook to `https://<your-domain>/api/livekit/webhook` for removed-participant enforcement. It must be reachable by LiveKit; account-level Vercel Deployment Protection can block external guests and webhooks. Choose appropriate protection settings for your intended audience in Vercel.

Local automated link verification:

```sh
npm run typecheck
npm test
npm run build
# With the app running and its database/LiveKit configured:
npm run test:links
npm run test:integration
```

This setup does not purchase hosting or enable billing. Review your providers' limits before public use. The existing [Docker deployment](DEPLOYMENT.md) remains available for a host you control.
