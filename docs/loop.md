# Work Loop — CS2 Error Notes

## Flow

```
   ┌─────────────────────────────┐
   │     1. Read spec.md         │
   │   (what to implement)       │
   └─────────────┬───────────────┘
                 │
                 ▼
   ┌─────────────────────────────┐
   │     2. Read build.md        │
   │  (how to write the code)    │
   └─────────────┬───────────────┘
                 │
                 ▼
   ┌─────────────────────────────┐
   │     3. Write code           │
   └─────────────┬───────────────┘
                 │
                 ▼
   ┌─────────────────────────────┐
   │     4. Read review.md       │
   │ (audit, analyze, review)    │
   └─────────────┬───────────────┘
                 │
                 ▼
          ┌──────────────┐
          │  Passes?     │──── Yes ──► Done
          │  Optimal?    │
          │  No warns?   │
          └──────┬───────┘
                 │ No
                 │ (back to step 1)
                 ▼
   ┌─────────────────────────────┐
   │     1. Read spec.md         │
   │  (fix what was detected)    │
   └─────────────────────────────┘
```

## Loop Rules

1. **Step 1 - Spec**: Read `spec.md` to understand exactly what needs to be implemented. Do not write code without a clear scope.

2. **Step 2 - Build**: Read `build.md` to know the stack, conventions, and prerequisites before starting.

3. **Step 3 - Code**: Write the code following project conventions and the specification in spec.md.

4. **Step 4 - Review**: Read `review.md` and audit the written code against the criteria:
   - Does it meet all specifications?
   - Is the code professional, readable, and optimal?
   - Is there dead code, unused imports, redundant logic?
   - Are there compilation errors, lint warnings, type issues?
   - Is performance adequate (no N+1, no unnecessary bundles)?
   - Is security covered?

5. **Decision**:
   - If everything passes and nothing can be improved → **Loop ends**
   - If there are issues or possible improvements → **Go back to step 1** and repeat the cycle

6. The loop repeats until the code meets all review.md criteria and no reasonable improvements remain.
