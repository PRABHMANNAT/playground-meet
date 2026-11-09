# Integrating with Playground

The existing Playground application is not in this repository, so its sign-in system has not been modified. Meet provides a secure integration boundary plus links back to the parent brand.

## Single-use sign-in

Configure the same random (at least 32-character) PLAYGROUND_SSO_SECRET on the trusted Playground server and Meet server. Never put it in frontend code. Playground authenticates its own user, then signs an HS256 JWT with:

```json
{
  "iss": "https://tryplayground.net",
  "aud": "playground-meet",
  "sub": "stable-user-id",
  "name": "Display name",
  "jti": "new-random-UUID",
  "iat": 1700000000,
  "exp": 1700000060
}
```

Use current timestamps, a lifetime of at most 60 seconds and a fresh jti for each assertion. Redirect to `https://meet.tryplayground.net/auth/playground#token=JWT`. The fragment is removed immediately and exchanged through a same-origin POST. Fragment tokens are not sent in HTTP referrer/request URL logs. Do not put the token in a query parameter.

Meet verifies signature, algorithm, issuer, audience, subject, name, age and required expiry. The nonce is atomically consumed in Postgres to prevent reuse. A stable hashed subject maps to a Meet identity. It then issues its own revocable session cookie; do not share parent-domain session cookies or reuse LiveKit API secrets as SSO secrets.

## Product testing

Hosts share an HTTPS product URL and a task in Review. Participants open the product in a separate tab (no unsafe embedding of arbitrary sites), share their screen if desired, and submit bug/idea/moment markers. Markers are server-timestamped relative to meeting creation and included in Markdown exports. They are not automatically sent to GitHub or an external issue tracker.

Meeting URLs use `/room/<random-code>`. To integrate an invite button, link to that URL. Room creation requires an existing same-origin Meet session; cross-site create requests are intentionally rejected. For a deeper integration, add a narrowly scoped server-to-server API instead of weakening Origin checks.

Ratings and summaries can be retrieved by an admitted participant’s session. The current app does not provide an administrator data API or parent-site data sync; implement explicit scoped authorization before exposing either.
