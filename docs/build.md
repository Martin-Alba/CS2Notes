# Build & Deploy — CS2 Error Notes

## Prerequisites

- Node.js v24.18.0 LTS (use nvm or fnm)
- pnpm (latest)
- Vercel CLI (`pnpm add -g vercel`)
- Neon account (console.neon.tech)
- Upstash account (console.upstash.com)

## Local Setup

```bash
pnpm create next-app@latest cs2-errors --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd cs2-errors

pnpm add prisma @prisma/client
pnpm add better-auth @better-auth/nextjs
pnpm add next-intl
pnpm add @upstash/redis

pnpm add -D prisma

npx prisma init
```

## Environment Variables

```
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `BETTER_AUTH_URL` | App base URL |

## Commands

(Pending — will be defined after initial project setup)

## Deploy

1. Connect repo to Vercel
2. Add Neon integration from Vercel Marketplace
3. Add Upstash integration
4. Configure environment variables in Vercel
5. Auto-deploy on every push to main
