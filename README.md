# Axis web app

Next.js front end for Axis: sign-in, wallet balance and deposit address, crypto
funding, and a chat surface. Deployed on Vercel.

## How it connects

The browser only talks to this app's own `/api/*` routes. Those routes hold the
service URLs and tokens server-side and forward to:

| Route | Upstream | Purpose |
|---|---|---|
| `/api/auth`, `/api/auth/name` | brain `/web/signup`, `/web/login`, `/web/name` | email/password account, display name |
| `/api/auth/me`, `/api/auth/logout` | brain `/web/me`, `/web/logout` | restore the session, sign out (revokes the brain session) |
| `/api/wallet` | onboarding `/wallet`, `/wallet/balance` | provision the custodial wallet, read the spendable balance |
| `/api/chat` | brain `/web/chat` | the Axis assistant |

`lib/funding.ts` calls the onboarding funding API (`NEXT_PUBLIC_FUNDING_API`)
directly from the browser for deposit addresses and deposit history.

## Sessions and security

Every call to brain carries `AXIS_WEB_TOKEN`, which must match brain's. Sign-in
returns a 30-day brain session token for that user; it is stored only inside an
httpOnly cookie signed with HMAC-SHA256 (`AXIS_SESSION_SECRET`) and never returned
to the browser. brain authenticates every chat and name request with that token,
so the assistant can only do what the user's account may do (no spending).
Wallet, chat and name routes act only for the user in a valid signed session;
any `userId` in a request body or query is ignored. A missing or invalid cookie
gets `401`. Without `AXIS_SESSION_SECRET`, sign-in is refused (`503`).

`npm run build` first runs `scripts/check-forbidden.mjs`, which fails the build
if client code reintroduces a `NEXT_PUBLIC_` variable named like a secret or
address, or a banned compliance claim.

## Known limitations

- Chat shows payment Approve/Decline cards; other replies are plain text.
- Sessions issued before this change carry no brain token, so those users are
  asked to sign in again.
- Activity history is empty: there is no deposit-history feed wired into the
  wallet view yet.

## Run

```bash
cp .env.local.example .env.local   # fill in values; never commit them
npm ci
npm run dev
```

Validate with `npm run lint`, `npx tsc --noEmit` and `npm run build`.
