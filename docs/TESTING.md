# Testing

Vitest for unit tests · Playwright for E2E

## Scripts
- `npm run test`       — Vitest watch
- `npm run test:run`   — Vitest single run (CI)
- `npm run test:e2e`   — Playwright headless
- `npm run test:e2e:ui`— Playwright with browser UI

## Unit tests (`__tests__/unit/`)
Test business logic in isolation. Mock all external deps (Supabase, Stripe, Resend, Fortnite API, Clerk).

Write unit tests for:
- Every API route handler — happy path + each error branch
- Pure utility functions in `lib/`
- Client components — user interactions and conditional rendering

## E2E tests (`__tests__/e2e/`)
Test complete user flows through a real browser against a test Supabase project. Do not mock the DB.

Write E2E tests for:
- Auth: sign up, sign in, sign out
- VBucks purchase: select pack → Stripe redirect → return with updated balance
- Skin purchase: browse → buy → order appears in history
- Fortnite username: required before skin purchase
- Admin: view pending orders → mark as gifted

## Rules
- `data-testid` on all interactive elements — never use CSS classes or text as E2E selectors
- Convention: `data-testid="buy-pack-{packId}"`, `data-testid="skin-card"`, `data-testid="vbucks-balance"`
- Every API route: test 401 (no auth), 400 (bad input), happy path, and each business rule violation
- Always reset loading state in `finally` block — test that buttons re-enable after errors