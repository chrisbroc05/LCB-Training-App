## LCB Training Web

Membership web app built with Next.js, NextAuth.js, Prisma, and PostgreSQL.

## Environment Variables

Copy `.env.example` to `.env` and set real values:

```bash
cp .env.example .env
```

Required:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - random secure string for session signing
- `NEXTAUTH_URL` - app base URL (for local dev: `http://localhost:3000`)
- `STRIPE_SECRET_KEY` - Stripe secret API key for checkout + webhooks
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key used on signup
- `STRIPE_WEBHOOK_SECRET` - signing secret for `/api/webhooks/stripe`
- `STRIPE_BASIC_PRICE_ID` - Stripe monthly recurring price ID for Basic membership
- `STRIPE_PRO_PRICE_ID` - Stripe monthly recurring price ID for Pro membership
- `STRIPE_ELITE_PRICE_ID` - Stripe monthly recurring price ID for Elite membership
- `STRIPE_BASIC_ANNUAL_PRICE_ID` - Stripe annual recurring price ID for Basic membership
- `STRIPE_PRO_ANNUAL_PRICE_ID` - Stripe annual recurring price ID for Pro membership
- `STRIPE_ELITE_ANNUAL_PRICE_ID` - Stripe annual recurring price ID for Elite membership
- `NOTIFICATION_EMAIL` - Gmail address used to send app notifications
- `EMAIL_PASSWORD` - Gmail app password for `NOTIFICATION_EMAIL`
- `ONBOARDING_CRON_SECRET` - shared secret used by daily onboarding email cron endpoint
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name used for admin-uploaded response videos
- `CLOUDINARY_API_KEY` - Cloudinary API key for signed server-side uploads
- `CLOUDINARY_API_SECRET` - Cloudinary API secret for signed server-side uploads
- `CLOUDINARY_UPLOAD_FOLDER` - optional Cloudinary folder path for uploaded videos
- `CLOUDINARY_ADMIN_RESPONSE_UPLOAD_ENABLED` - set to `true` to enable admin device-uploaded response videos (default off)

## Database Setup

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations against your configured PostgreSQL database:

```bash
npm run prisma:migrate -- --name init
```

For deploy environments, use:

```bash
npm run prisma:deploy
```

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth Features Included

- Email/password signup (stored with hashed passwords)
- Email/password login via NextAuth credentials provider
- Session-based protection for `dashboard` and `swing-analysis`
- Membership tier stored on `User` model (`BASIC`, `PRO`, `ELITE`)
