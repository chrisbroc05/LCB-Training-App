# Local development setup

This project is configured so local `npm run dev` cannot accidentally use production Postgres, R2, or Stripe live keys.

## 1. Environment files

- `.env` is for **local dev only** and is gitignored (see `.gitignore`: `.env*`).
- Never commit `.env`, `.env.local`, or `.env.production.backup`.
- Copy production values to `.env.production.backup` once, store that file in a password manager or secure vault, then **delete it from your laptop** when you no longer need it locally.

Required local variables (see `.env.example` for the full list):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon **pooled** connection string |
| `DATABASE_DIRECT_URL` | Neon **direct** string (Prisma migrations) |
| `TEST_DATABASE_URL` | Same as dev DB for integration scripts |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Dev-only random string |
| `ADMIN_EMAIL` | Your login for dev admin seed user |
| `CLOUDFLARE_R2_*` | Dev bucket `lcb-training-app-dev` only |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Test** keys only (`sk_test_` / `pk_test_`) |

Stripe resource price IDs and webhook secret can wait until you test checkout. For webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` value from the CLI into `STRIPE_WEBHOOK_SECRET` in `.env`.

## 2. Safety guards

When `NODE_ENV=development`:

- **`npm run dev`** runs `scripts/assert-dev-environment.ts` and Next **`instrumentation.ts`**:
  - Blocks Render / `lcb_training` database URLs
  - Blocks `sk_live_*` Stripe keys
  - Blocks production R2 bucket `lcb-training-submissions`
- **Email** and **push** are not sent; they are logged to the console and stored in **`/dev/outbox`**.

## 3. Database migrate and seed

```bash
cd lcb-training-web
npm install
npm run db:migrate:dev
npm run db:seed:dev
npm run dev
```

`db:seed:dev` refuses production databases. It prints the dev admin email (from `ADMIN_EMAIL`) and password `LcbDevSeed!2026`.

Test players use `*@dev.lcbtraining.test` with the same password. Org trial-only (Free tier on DEVCLUB): `player-org-trial@dev.lcbtraining.test`.

Local dev uses webpack (`next dev --webpack`) to match production builds.

## 4. Stripe CLI (optional)

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. `stripe login`
3. `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Put the signing secret in `.env` as `STRIPE_WEBHOOK_SECRET`.

## 5. Smoke-test checklist

1. **Log in** as `ADMIN_EMAIL` with `LcbDevSeed!2026`, then as `player-core@dev.lcbtraining.test` and `player-twelve-week@dev.lcbtraining.test` (same password).
2. As a test player, submit a **swing analysis** with a small video file.
3. Open **`http://localhost:3000/dev/outbox`** and confirm confirmation/coach emails appear (no real send).
4. In Cloudflare R2, open bucket **`lcb-training-app-dev`** and confirm a new object under your submission prefix.
5. As admin, open **Coaching > Video reviews** and confirm the pending dev submission appears.

## 6. Phone testing (Cloudflare quick tunnel)

Use this when you need real iPhone Safari (video upload, PWA, touch) against your **local** dev server.

**Prerequisites:** [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) installed (`brew install cloudflared` on macOS).

```bash
npm run dev:phone
```

What it does:

1. Runs the same **dev safety guards** as `npm run dev`.
2. Starts Next.js on `http://127.0.0.1:3000`.
3. Starts a **free quick tunnel** (`*.trycloudflare.com`) and prints the **https** URL for your phone.
4. Restarts Next.js with `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` set to that tunnel URL for the session.
5. Sets **`AUTH_TRUST_HOST=true`** so sign-in works on the tunnel hostname.

Email and push still go to **`/dev/outbox`** only (nothing is sent externally).

### R2 CORS for the dev bucket

Presigned video uploads from the phone use your browser origin (the tunnel URL). In Cloudflare Dashboard:

**R2 > lcb-training-app-dev > Settings > CORS policy**

Add or merge a rule like this (keep existing `http://localhost:3000` if you already have it):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://*.trycloudflare.com"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

If your dashboard does not accept `*.trycloudflare.com`, add the **exact** origin printed by `npm run dev:phone` (for example `https://random-words.trycloudflare.com`) each time you start a new tunnel.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Assert safe env, start Next dev server |
| `npm run dev:phone` | Dev server + Cloudflare tunnel for phone testing |
| `npm run db:migrate:dev` | `prisma migrate deploy` against dev DB |
| `npm run db:seed:dev` | Fake users, orgs, submissions (dev only) |
| `npm run test:dev-environment-guard` | Unit checks for production detection |
