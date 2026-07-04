# Technical Specification — CS2 Error Notes

## Overview

Responsive web app to log errors made in Counter-Strike 2 matches.
Users create groups (e.g. "Faceit"), matches within those groups, and within each match
round-by-round notes with severity and tags. The data feeds daily/weekly/monthly/yearly
statistics. Groups or matches can be shared via public links with an access-request flow.

## Tech Stack

| Layer          | Technology                           |
|----------------|--------------------------------------|
| Runtime        | Node.js v24.18.0 LTS                 |
| Framework      | Next.js 16.2.10 (App Router)         |
| UI             | React 19.2.7 + Tailwind CSS v4.3     |
| Typing         | TypeScript 6.0 (strict)              |
| Database       | Neon (serverless Postgres)           |
| ORM            | Prisma 7.8.0                         |
| Auth           | Better Auth 1.6.23                   |
| i18n           | next-intl 4.13.1 (ES/EN)             |
| Cache/Queues   | Upstash Redis (serverless)           |
| Deploy         | Vercel                               |

## Architecture

```
next/
├── app/                    # App Router (SPA-like routes)
│   ├── [locale]/           # i18n routing
│   │   ├── dashboard/      # Main panel
│   │   ├── groups/         # Group CRUD
│   │   ├── matches/        # Match CRUD
│   │   ├── match/[id]/     # Match view with rounds
│   │   ├── stats/          # Statistics
│   │   └── settings/       # Settings
├── components/             # Reusable components
│   ├── ui/                 # Primitives (Button, Card, Modal, etc.)
│   ├── forms/              # Forms
│   └── match/              # Match-specific components
├── lib/                    # Shared logic
│   ├── db/                 # Prisma client
│   ├── redis/              # Upstash Redis client
│   ├── auth/               # Better Auth config
│   └── utils/              # Utilities
├── features/               # Feature modules
│   ├── groups/
│   ├── matches/
│   ├── rounds/
│   ├── notes/
│   ├── tags/
│   ├── sharing/
│   └── stats/
├── i18n/                   # Translation files
│   ├── es.json
│   └── en.json
└── prisma/                 # Schema + migrations
```

## Data Model

```
User
  id            String (PK)
  email         String (unique)
  name          String
  avatarUrl     String?
  createdAt     DateTime
  updatedAt     DateTime

Group
  id            String (PK)
  name          String
  description   String?
  ownerId       String (FK -> User)
  createdAt     DateTime
  updatedAt     DateTime

Match
  id            String (PK)
  groupId       String (FK -> Group)
  mapName       String
  title         String (e.g. "Mirage Jul-2-2026 22:32")
  createdAt     DateTime
  updatedAt     DateTime

Round
  id            String (PK)
  matchId       String (FK -> Match)
  roundNumber   Int (1-50)
  createdAt     DateTime

Note
  id            String (PK)
  roundId       String (FK -> Round)
  content       String
  severity      Int (1-3)
  createdAt     DateTime
  updatedAt     DateTime

Tag
  id            String (PK)
  name          String
  type          Enum (PREDEFINED | CUSTOM)
  userId        String? (FK -> User)

ErrorNoteTag
  noteId        String (FK -> Note)
  tagId         String (FK -> Tag)

ShareLink
  id            String (PK)
  token         String (unique)
  resourceType  Enum (GROUP | MATCH)
  resourceId    String
  createdById   String (FK -> User)
  createdAt     DateTime

AccessRequest
  id            String (PK)
  shareLinkId   String (FK -> ShareLink)
  requesterId   String (FK -> User)
  status        Enum (PENDING | APPROVED | REJECTED)
  createdAt     DateTime

Notification
  id            String (PK)
  userId        String (FK -> User)
  type          Enum (ACCESS_REQUEST | ACCESS_APPROVED)
  metadata      JSON
  read          Boolean default false
  createdAt     DateTime
```

## API & Communication

- Server Actions for mutations (CRUD groups/matches/rounds/notes)
- Route Handlers for public queries (shared match view)
- WebSockets via Upstash Redis pub/sub for:
  - Live notifications for access requests
  - Real-time collaboration (optional, future)

## Statistics

- Aggregate queries with Prisma (GROUP BY, COUNT, AVG)
- Cache results in Upstash Redis with TTL
- Breakdown by: tag, severity, period (day/week/month/year)
- Data: error percentage by tag, temporal evolution, lost rounds

## Limits

- Rounds per match: 50 max (30 free, 50 paid in future version)
- Custom tags: 3 max per user
- Max width: 1200px
- Responsive: mobile, tablet, desktop
- Multi-language: Spanish and English

## Sharing Flow

1. Owner creates a ShareLink (unique token) for a group or match
2. Another user accesses the link → sees read-only view
3. Click "Request access" → AccessRequest is created (PENDING)
4. Owner receives in-app notification (via Redis pub/sub or polling)
5. Owner approves/rejects → AccessRequest changes to APPROVED/REJECTED
6. If approved: user can view full content (read-only)

---

## Fixes — Production Audit (v1)

### Critical

#### C1 — Delete Round
- Add `deleteRound(matchId: string, roundId: string)` Server Action in `features/rounds/actions.ts`
- Must verify ownership via match → group → ownerId
- Cascade delete all notes + errorNoteTags (DB cascade handles this)
- Add `deleteRoundSchema` with `matchId` and `roundId` validation
- Revalidate `/match/${matchId}`

#### C2 — Race Condition: Duplicate Round Numbers
- Server determines next round number: `SELECT MAX(roundNumber) + 1` from rounds WHERE matchId
- Client no longer sends `roundNumber` — only `matchId`
- `addRound(matchId: string)` — server computes next number
- Update `addRoundSchema` to only require `matchId`
- Update client `handleAddRound` in match-view.tsx to not pass roundNumber

#### C3 — Max 50 Rounds Validation
- Before creating a round, count existing rounds for the match
- If `count >= 50`, throw `Error("Maximum 50 rounds per match")`

#### C4 — Delete Custom Tag
- Add `deleteCustomTag(tagId: string)` Server Action in `features/tags/actions.ts`
- Verify ownership (`tag.userId === session.user.id`)
- Delete tag and all ErrorNoteTag references (cascade)
- Revalidate all affected match paths (must query affected notes first)

#### C5 — Revoke Share Link
- Add `deleteShareLink(shareLinkId: string)` Server Action in `features/sharing/actions.ts`
- Verify ownership (`shareLink.createdById === session.user.id`)
- Delete share link and cascade (`onDelete: Cascade` in schema)
- Revalidate affected paths

#### C6 — NotificationBell Auto-Polling
- Add `useEffect` with `setInterval` (30s) to poll for new notifications
- Track last fetch timestamp to only update if new notifications exist
- Clean up interval on unmount
- Avoid duplicate notifications: compare by ID before setting state

### High

#### H1 — Shared Views: Optimistic Updates
- `shared-match-view.tsx`: Add optimistic update for `addNote` (like match-view.tsx has)
- `shared-match-view.tsx`: Add optimistic update for `deleteNote` with rollback
- `shared-match-view.tsx`: Add optimistic update for `updateNote` with rollback
- `shared-note-section.tsx`: Same optimistic updates for add/delete/edit notes

#### H2 — handleToggleTag Optimistic Update
- `match-view.tsx`: Make `handleToggleTag` optimistic: toggle state immediately, rollback on error
- Currently awaits server THEN updates state — reverse the order

#### H3 — resolveDateRange("12m") Precision
- Replace `365 * 24 * 60 * 60 * 1000` with `now.setMonth(now.getMonth() - 12)`
- Use `new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())` for accuracy

#### H4 — getPerformance Query Optimization
- Replace current JS-level aggregation with a single Prisma raw query or grouped query
- Use Prisma `groupBy` on Match with `_count` and `_avg` where possible
- Fall back to well-indexed queries if groupBy doesn't support nesting

#### H5 — buildWhereClause Type Safety
- Replace `Record<string, unknown>` with proper Prisma input types
- Use `Prisma.NoteWhereInput` consistently instead of casting
- Build the where clause with proper typed chaining

### Medium

#### M1 — Round Max Validation in addRound
- After computing next round number, check `currentCount >= 50`
- Same as C3 but referenced here as the implementation point

#### M2 — Rate Limit by IP for resolveShareLink
- Use `headers().get("x-forwarded-for") ?? "anonymous"` instead of token for rate limiting
- Token-based rate limiting is trivially bypassed with random tokens

#### M3 — loading.tsx for match/[matchId]
- Add `app/[locale]/match/[matchId]/loading.tsx` with skeleton

#### M4 — resolveDateRange("all") Pagination Limit
- Add `maxLimit: 1000` for unbounded queries
- In `getStatsNotes` and `getStats`, cap `take` at 1000 when `start === null && end === null`

#### M5 — Duplicate Group Name Validation
- In `createGroup`, check if group with same name already exists for this user
- Case-insensitive comparison: `where: { ownerId, name: { equals: parsed.name, mode: "insensitive" } }`

### Low

#### L1 — Error Messages Consistency
- Standardize error messages: "Unauthorized" for auth, "Not found" for missing resources, specific messages for validation failures
- Do not expose internal details in error messages

#### L2 — Stats Cache Invalidation Hints
- Add `revalidateTag("stats")` in note/mutation actions to hint stats refresh
- This doesn't invalidate immediately but provides a hook for future improvement
