# Axis web app

Next.js front end for Axis: sign-in, wallet balance and deposit address, crypto
funding, and a chat surface. Deployed on Vercel.

## How it connects

The browser only talks to this app's own `/api/*` routes. Those routes hold the
service URLs and tokens server-side and forward to:

| Route | Upstream | Purpose |
|---|---|---|
| `/api/auth`, `/api/auth/name` | brain `/auth/*` | email/password account, display name |
| `/api/auth/me`, `/api/auth/logout` | none | read or clear the session cookie |
| `/api/wallet` | onboarding `/wallet`, `/wallet/balance` | provision the custodial wallet, read the spendable balance |
| `/api/chat` | brain `/webhooks/web` | chat messages |

`lib/funding.ts` calls the onboarding funding API (`NEXT_PUBLIC_FUNDING_API`)
directly from the browser for deposit addresses and deposit history.

## Sessions and security

Sign-in sets an httpOnly cookie signed with HMAC-SHA256 (`AXIS_SESSION_SECRET`).
Wallet, chat and name routes act only for the user in a valid signed session;
any `userId` in a request body or query is ignored. A missing or invalid cookie
gets `401`. Without `AXIS_SESSION_SECRET`, sign-in is refused (`503`).

`npm run build` first runs `scripts/check-forbidden.mjs`, which fails the build
if client code reintroduces a `NEXT_PUBLIC_` variable named like a secret or
address, or a banned compliance claim.

## Known limitations

- Auth and chat call brain's legacy conversational server (`brain/src/server.ts`).
  The hosted brain runs the MCP entrypoint (`dist/mcp/main.js`), which does not
  serve `/auth/*` or `/webhooks/web`, so those features need the legacy server
  deployed separately.
- Activity history is empty: there is no deposit-history feed wired into the
  wallet view yet.

## Run

```bash
cp .env.local.example .env.local   # fill in values; never commit them
npm ci
npm run dev
```

Validate with `npm run lint`, `npx tsc --noEmit` and `npm run build`.
