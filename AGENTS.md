# AGENTS.md — CS2 Error Notes

## Stack

- Node.js v25.2.1
- Next.js 16.2.10 (App Router)
- React 19.2.4, Tailwind CSS v4.3.2, TypeScript 6.0.3
- Neon (Postgres) + Prisma 7.8.0 ORM
- Better Auth 1.6.23 (authentication)
- next-intl 4.13.1 (i18n ES/EN)
- Upstash Redis 1.38.0 (caching, stats queue, real-time pub/sub)
- Deploy: Vercel

## Rules

1. Don't assume, verify — always read existing code before changing it.
2. Clean, scalable, optimized code. No dead code, no unnecessary comments.
3. Performance-first: Server Components by default, lazy loading, avoid N+1 queries.
4. Always ask when in doubt about design or implementation.
5. Never commit without verifying changes work (lint, typecheck).
6. Multi-user: support scalability and real-time collaborative editing.

## Conventions

- Naming: PascalCase for components, camelCase for functions/vars, UPPER_CASE for constants.
- Imports: absolute with `@/` alias.
- i18n: all user-facing strings must use next-intl.
- Language: English is the primary language for both the app and all code (variable names, comments, commits). MD documentation files must also be written in English.
- DB: Prisma schema, migrations with `prisma migrate dev`.
- Auth: Better Auth with Neon sessions.
- Redis: Upstash SDK for caching and pub/sub.

## Glossary

- Group: collection of matches (e.g. "Faceit").
- Match: individual match with date, map, group.
- Round: round within a match (1-50).
- Note: free text about an error in a round.
- Severity: 3 severity levels per note.
- Tag: category tag (aim, mechanics, decision, communication) + up to 3 custom per user.
- ShareLink: public link to share a match/group.
- AccessRequest: pending access request waiting for approval.

## Commands

(Pending — will be defined once the project is created with create-next-app)
