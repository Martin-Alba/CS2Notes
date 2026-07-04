# Code Review Checklist — CS2 Error Notes

## Code Quality

- [ ] TypeScript strict mode, no `any`, no unnecessary `as` casts
- [ ] Professional, readable, optimal code. No dead code, no unused imports, no redundant logic, no orphaned files
- [ ] Every line exists for a reason — no "just in case" code or unused code
- [ ] No explanatory comments: code must be self-documenting through clear names for variables, functions, and types
- [ ] Server Components by default; Client Components only when interactivity or client-side hooks are needed
- [ ] Consistent naming: PascalCase (components, types, interfaces), camelCase (functions, variables), UPPER_CASE (constants)
- [ ] Small components with a single responsibility
- [ ] Pure functions outside components; business logic in `features/`, components only handle rendering

## Performance

- [ ] Avoid N+1 queries: use Prisma `include` / `select` with eager loading
- [ ] Redis caching for expensive queries (stats, large lists)
- [ ] Static Generation / ISR where possible
- [ ] Streaming with Suspense for heavy sections
- [ ] Lazy loading heavy components with `next/dynamic`
- [ ] Optimized images with `next/image`
- [ ] Bundle size: import only what is needed, avoid large libraries

## Security

- [ ] Input validation with Zod in Server Actions
- [ ] Rate limiting on public endpoints (sharing, access requests)
- [ ] Row Level Security in Postgres (via Neon)
- [ ] Note content sanitization (XSS)
- [ ] Better Auth: secure sessions, CSRF protection
- [ ] Do not expose internal IDs in public URLs (use tokens)
- [ ] Permissions: verify ownership before mutating data

## Collaboration & Real-Time

- [ ] Optimistic updates with rollback on errors
- [ ] Conflict handling in simultaneous editing
- [ ] Notifications via pub/sub without blocking the user
- [ ] State sync between tabs/windows

## Testing

- [ ] Unit tests for business logic (vitest)
- [ ] Integration tests for Server Actions
- [ ] Component tests with Testing Library
- [ ] (Exact test framework TBD)
