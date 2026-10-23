# Axis

**Conversational commerce and wallet-backed services through one interface.**

Axis is a Next.js product surface for an assistant that can understand user intent, preserve context, expose wallet state, and coordinate service workflows through chat.

**Live app:** https://axis-two-xi.vercel.app

This repository contains the public web application and its server-side gateway layer. The browser never talks directly to privileged upstream services.

## What the product demonstrates

- **Conversational interface** for service and commerce workflows
- **Authenticated user sessions** with server-side session validation
- **Wallet provisioning and balance views**
- **Crypto funding flows** for deposit addresses and funding history
- **Location and place context** for location-aware actions
- **Service controls and spending limits** exposed as user configuration
- **Explicit approval UI** for payment-sensitive actions

## Architecture

```text
Browser
  |
  v
Next.js UI
  |
  v
Server-side /api routes
  |
  +--> authentication + session service
  +--> wallet + funding service
  +--> assistant runtime
  +--> location + place service
  +--> user settings + connections
```

The web client talks only to this application's `/api/*` routes. Service URLs, privileged tokens, and session verification stay on the server side.

### Main routes

| Route | Responsibility |
| --- | --- |
| `/api/auth`, `/api/auth/name` | Account creation, login, and profile name |
| `/api/auth/me`, `/api/auth/logout` | Session restoration and logout |
| `/api/wallet` | Wallet provisioning and spendable balance |
| `/api/chat` | Assistant conversation |
| `/api/location`, `/api/place` | Device location and place context |
| `/api/settings` | Services, spending limits, and connected applications |
| `/api/connections/revoke` | Revoke a connected service |
| `/t/<code>` | QR/NFC place or seat context |

## Security model

Axis keeps the browser deliberately thin.

- Session tokens are stored in signed, `httpOnly` cookies.
- Privileged service tokens are never returned to client-side code.
- Wallet and chat routes operate only on the authenticated user from the verified session.
- Client-supplied user IDs are ignored for privileged requests.
- The build fails if client code reintroduces environment variables that look like secrets or protected addresses.
- Payment-sensitive flows require an explicit approval step in the UI.

## Current status

### Working

- Sign up, sign in, session restoration, and logout
- Wallet provisioning and balance retrieval
- Deposit address and funding flow
- Assistant chat surface
- Device location and place context
- Service configuration and connection revocation
- Payment Approve / Decline cards

### Still in progress

- A complete activity/deposit history feed in the wallet view
- Rich structured rendering for assistant responses beyond payment approval cards
- Broader provider coverage across real-world service workflows

## Local development

```bash
cp .env.local.example .env.local
npm ci
npm run dev
```

Then open http://localhost:3000.

Before shipping changes:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Stack

- Next.js
- TypeScript
- React
- Server-side API routes
- Vercel deployment

## Repository scope

This repository is the Axis web product and gateway layer. Some upstream runtime and service components are maintained separately, so this repo is best read as the product boundary: what the user sees, what the browser is allowed to know, and how requests cross into privileged services safely.
