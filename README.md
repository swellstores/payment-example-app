# Swell Payment Gateway Example — Razorpay

An example Swell app that implements a complete credit card payment gateway using a **payment extension**, with [Razorpay](https://razorpay.com) as the gateway. Use it as a reference for integrating any payment provider with Swell checkout.

## What it demonstrates

- Declaring a **payment extension** in `swell.json` so the gateway appears as a payment method in Swell
- Handling the four payment extension events with app functions:
  - `payment.create_intent` — create the gateway-side customer and order before payment
  - `payment.get_intent` — verify and retrieve payment details after checkout
  - `payment.charge` — authorize/capture the payment when an order is submitted
  - `payment.refund` — refund a captured payment
- A **client-side checkout component** (`components/Razorpay.tsx`, Preact) that opens Razorpay Checkout, tokenizes the card, and writes the token back to the cart
- **App settings** for gateway credentials, with the public key exposed to the storefront and the secret key kept server-side
- A minimal gateway REST client built on `fetch` and Web Crypto (HMAC signature verification) — compatible with the Cloudflare Workers runtime, no Node SDK required

## How the pieces fit together

```
Checkout (storefront)                     Swell platform                  Razorpay
─────────────────────                     ──────────────                  ────────
components/Razorpay.tsx
  └─ onSubmit(cart)
       └─ createIntent() ───────────────▶ payment.create_intent ────────▶ create customer + order
       └─ open Razorpay Checkout ◀──────────────────────────────────────  card entry + tokenization
       └─ getIntent() ──────────────────▶ payment.get_intent ───────────▶ verify signature, fetch token
       └─ updateCart(billing.card token)
Order submitted ────────────────────────▶ payment.charge ───────────────▶ create/capture payment
Refund issued ──────────────────────────▶ payment.refund ───────────────▶ refund payment
```

## Project structure

```
swell.json                     App config with the payment extension declaration
settings/card.json             Gateway credential settings (key_id public, key_secret private)
functions/
  card-intent-create.ts        payment.create_intent handler
  card-intent-get.ts           payment.get_intent handler (signature verification)
  card-charge.ts               payment.charge handler (authorize + capture)
  card-refund.ts               payment.refund handler
  lib/razorpay.ts              Razorpay REST client (fetch + Web Crypto HMAC)
  lib/swell.ts                 App settings helper
components/
  Razorpay.tsx                 Client-side checkout component (Preact)
  lib/razorpay.ts              Checkout helpers (intent data, currency subunits)
```

## Setup

Requires the [Swell CLI](https://developers.swell.is/apps/cli) and a Swell account.

```bash
npm install -g @swell/cli
swell login

git clone git@github.com:swellstores/payment-example-app.git
cd payment-example-app
npm install

swell app push
```

Then, in your test environment dashboard:

1. Open **Apps > Razorpay > Settings** and enter your Razorpay **Key Id** and **Secret key** (use [test mode keys](https://razorpay.com/docs/api/authentication/) while developing).
2. Enable the payment method for checkout.

## Notes

- Amounts are converted to gateway subunits (`components/lib/razorpay.ts`) — Razorpay expects paise/cents.
- The charge flow supports both immediate capture and authorize-only (`captured: false`), and reuses a saved card token for recurring payments when no checkout intent is present.
- Gateway event handlers return `{ success, transaction_id }` (or `{ success: false, error }`), which Swell records on the payment.
- This app is an example for learning and building from — review it carefully and test against your gateway's sandbox before using any of it in production.

## Documentation

- [Swell Apps overview](https://developers.swell.is/apps/overview)
- [Extensions](https://developers.swell.is/apps/extensions)
- [Functions](https://developers.swell.is/apps/functions)
- [Settings](https://developers.swell.is/apps/settings)
