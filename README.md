# Axis web app

Next.js front end for Axis: the user's account. Sign-in, the wallet (USDC and SOL
on Solana) with its deposit address, saved people, addresses and phone lines,
payments approved with a transaction PIN, recurring payments, permissions for
connected AI apps, and full history with receipts. There is no chat here:
conversation happens in the AI apps connected to Axis (ChatGPT, Claude), and
anything that moves money comes back to this app for the user's approval.
Deployed on Vercel.

## How it connects

The browser only talks to this app's own `/api/*` routes. Those routes hold the
service URLs and tokens server-side and forward to:

| Route | Upstream | Purpose |
|---|---|---|
| `/api/auth`, `/api/auth/name` | brain `/web/signup`, `/web/login`, `/web/name` | email/password account, display name |
| `/api/auth/me`, `/api/auth/logout` | brain `/web/me`, `/web/logout` | restore the session, sign out (revokes the brain session) |
| `/api/wallet` | onboarding `/wallet`, `/wallet/balance` | provision the custodial wallet, read the spendable balance |
| `/api/location`, `/api/place` | brain `/web/location`, `/web/place` | precise device location; the place you're at (from GPS or a tag) |
| `/api/settings`, `/api/connections/revoke` | brain `/web/settings`, `/web/connections/revoke` | the user's configuration (`/services`): services on/off, personal spending limits, connected AI apps |
| `/api/vault`, `/api/vault/<section>[/<id>[/delete]]` | brain `/web/vault/*` | saved people you pay, addresses and phone lines (`/vault`) |
| `/api/activity`, `/api/activity/<id>[/report]` | brain `/web/activity*` + onboarding `/wallet/activity` | transaction history (`/activity`): payments and requests from any app, deposits and debits, with status, a timeline, a shareable receipt for completed payouts, and problem reports |
| `/api/standing`, `/api/standing/<id>[/confirm]` | brain `/web/standing*` | recurring payments and rate alerts (`/recurring`) |
| `/api/payments/request`, `/api/payments/<id>/decide` | brain `/web/payments/*` | start a payment to a saved person or place; approve (with PIN) or decline |
| `/api/pin` | brain `/web/pin` | transaction PIN status, create and change |
| `/api/passkeys`, `/api/passkeys/register[/finish]`, `/api/passkeys/auth`, `/api/passkeys/<id>` | brain `/web/passkeys*` | passkeys: list, enrol, step-up challenge, remove |
| `/api/banks` | brain `/web/banks` | banks Axis can pay, for suggestions |
| `/api/payments/<id>` | brain `/web/payments/:id` | a payment waiting for approval (`/approve/<id>`, linked from connected AI apps), with whether the user has paid that account before |
| `/api/notices` | brain `/web/notices` | updates on the Home screen (payment outcomes, recurring runs) |
| `/t/<code>` | none | QR/NFC seat tag link; opens that place and seat (`/place`) |

## Sessions and security

Every call to brain carries `AXIS_WEB_TOKEN`, which must match brain's. Sign-in
returns a 30-day brain session token for that user; it is stored only inside an
httpOnly cookie signed with HMAC-SHA256 (`AXIS_SESSION_SECRET`) and never returned
to the browser. brain authenticates every request with that token,
so every call acts only within what that user's account may do. Approving a
payment, turning auto-pay on and loosening limits also need the transaction PIN.
Every route acts only for the user in a valid signed session;
any `userId` in a request body or query is ignored. A missing or invalid cookie
gets `401`. Without `AXIS_SESSION_SECRET`, sign-in is refused (`503`).

Anything that moves money is approved with a step-up: the transaction PIN, or a
passkey (Face ID, fingerprint or security key) enrolled on the device. The
passkey's private key never leaves the device; brain keeps only its public key.
Passkeys are available only when brain has `WEB_ORIGIN` set, since that origin is
the passkey's relying party.

`npm run build` first runs `scripts/check-forbidden.mjs`, which fails the build
if client code reintroduces a `NEXT_PUBLIC_` variable named like a secret or
address, or a banned compliance claim.

## Known limitations

- Payments need brain's PAJ credentials. Without them the app says payments
  aren't switched on and nothing is paid.
- Times are shown in Lagos time everywhere.
- `NEXT_PUBLIC_SKIP_ONBOARDING=1` skips the sign-up screens for UI testing only.
  It creates no session, so every server route still answers 401.

## Run

```bash
cp .env.local.example .env.local   # fill in values; never commit them
npm ci
npm run dev
```

Validate with `npm run lint`, `npx tsc --noEmit` and `npm run build`.
