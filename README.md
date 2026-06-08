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
