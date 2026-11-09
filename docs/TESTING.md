# Verification guide

Run `npm run typecheck`, `npm test`, `npm run build` and `npm audit`. The unit suite checks identity entropy, password hashes, same-origin requests, bounded inputs, safe review URLs, SSO signature boundaries, note conflicts, poll closure, normalized strokes, moderator roles, focus deadlines, summary evidence and media token grants.

With Next.js at http://localhost:3000 and LiveKit at ws://localhost:7880, run `npm run test:integration`. Separate cookie jars act as host, guest and outsider. The script exercises the actual API/database: waiting-room denial, host admission, multi-user chat/hand/reactions, note races, one-vote identity, poll closure, board idempotency, review/feedback/summary persistence, locking, removal, meeting end, CSRF and account/session revocation. It creates test records in the configured database.

`npm run test:media` uses official LiveKit native clients, tokens obtained from the real app, generated camera/screen frames and a generated 440 Hz audio signal. A second independently authenticated client subscribes and decodes frames; success requires camera, screen and non-silent audio to arrive. It also tests moderation and fresh-token denial after removal. No physical camera/microphone or private media is captured.

## Browser acceptance

1. Load the homepage at desktop and 390px mobile width. Check horizontal overflow, keyboard focus, both themes, motion preference and navigation.
2. Create a room, inspect preview, test permission denial, join muted and confirm connected status. On a real device, deliberately grant mic/camera access and check selection, echo cancellation and track cleanup on leave.
3. Join from another browser/device/session. The host must admit it before token issuance. Test denial, reconnect, room lock and removal.
4. Use chat, notes, board, polls, reactions, raised hand, focus timer and review markers. Switch panels with an unsaved note draft and confirm recovery.
5. Present a browser tab and entire screen where supported. Verify remote output. Screen-share audio varies by platform/browser. Test PiP on a published video track in a supported desktop browser.
6. Simulate network loss, restore it and observe reconnection. End the meeting; verify everyone leaves and future tokens fail. Download the recap and inspect ratings/notes/markers.
7. On public infrastructure, repeat from two unrelated networks and a mobile network. Local/native tests do not prove restrictive-network TURN/TLS or mobile hardware behavior.

Docker Compose, DNS, public TLS, provider quotas and parent-site SSO require deployment-owner infrastructure. Document which tests actually ran; do not label configuration files as a verified public deployment.
