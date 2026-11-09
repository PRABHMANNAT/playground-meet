# Free software, quotas and practical limits

Checked against official sources on 2026-11-09. Provider allowances change; verify the linked plan before deploying. No paid API, subscription or billing setting is required by the code.

| Component      | Default approach                | Limits / tradeoffs                                                      |
| -------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Next.js app    | Run on your existing Linux host | Your compute and network capacity; no hosting purchased                 |
| PostgreSQL     | Open-source container           | Your disk, memory, backups and maintenance                              |
| Local database | PGlite                          | Single process, persistent filesystem; not serverless/multi-replica     |
| LiveKit media  | Open-source self-hosted SFU     | Bandwidth/CPU/firewall/TURN are your responsibility                     |
| HTTPS          | Caddy with ACME certificates    | Requires public DNS and reachable challenge ports                       |
| AI summaries   | Deterministic Markdown export   | Summarizes saved contributions; no transcription or generative analysis |

[LiveKit Build](https://livekit.com/pricing) advertises $0/month with no credit card. Its published Build allowances are 5,000 WebRTC participant-minutes, 50 GB downstream transfer and 100 concurrent connections. These are provider-wide limits; the application independently caps a room at 25 identities. Confirm your project’s current included allowances and usage dashboard before choosing it; this repo does not provision or assume a quota, add payment details, or purchase overages. Participant-minutes count each connected participant separately: 10 people for 30 minutes is 300 participant-minutes. Screen sharing adds bandwidth even when connection counts stay fixed.

[Vercel Hobby](https://vercel.com/docs/plans/hobby) is aimed at personal projects and has usage/eligibility rules. It is not the default for a business product. If deploying Next.js there on an eligible plan, use external Postgres; never store PGlite on an ephemeral function filesystem. LiveKit must still run separately.

## App-level limits

- 25 participant identities per room, including waiting/removed identities. Create a new room for a new cohort.
- 30 polls, 2–6 distinct options per poll, one current vote per identity.
- 20,000 shared-note characters with optimistic version checks.
- 500 whiteboard strokes, at most 500 normalized points per stroke. The host can clear the canvas. Large boards cost database/read bandwidth; use shorter strokes for responsive sessions.
- Chat 2,000 characters/message; feedback markers 2,000; ratings 1–5 with 1,000 characters of text.
- 64 KiB JSON/webhook request bodies, 180 collaboration writes/minute per identity, 10 room creations/minute per identity, 30 join/token requests/minute per identity.
- Foreground conditional polling every 1.2 seconds; background every 5 seconds. At 25 active clients this is roughly 21 snapshot requests/second. This is intended for small sessions; a high-scale deployment should use push notifications and incremental state.
- Media JWTs last two minutes for initial connection. Session cookies last seven days. The app does not impose a paid time limit.
- Default cleanup eligibility: ended meetings older than 30 days, only when the operator actually runs/schedules cleanup.

HD is a requested capture profile, not a guaranteed remote resolution. LiveKit/browser bandwidth adaptation, CPU, device camera and network conditions determine delivered quality. No SFU can guarantee calling on every network without a tested TURN deployment.
