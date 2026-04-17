# VBucks Shop

E-commerce app: users buy VBucks with real money (Stripe), spend VBucks on Fortnite skins.
Skin purchases notify admin by email — admin manually gifts the skin in-game via Fortnite.

## Stack
Next.js 16 (App Router, TypeScript, Tailwind) · Clerk (auth) · Supabase (Postgres) · Stripe (payments) · Resend (email) · Vercel (deploy)

## Spec files — read before touching that domain
- `docs/DATABASE.md`  — schema decisions and query rules
- `docs/AUTH.md`      — Clerk setup and route protection rules
- `docs/PAYMENTS.md`  — Stripe flow and webhook rules
- `docs/TESTING.md`   — what to test and how

## Non-negotiable rules
- No business logic in client components — mutations go through API routes only
- No secrets in client components — only NEXT_PUBLIC_ vars are browser-safe
- Every API route: validate auth first, validate input second, then business logic
- Every new feature needs a unit test. Every user flow needs an E2E test.
- No `any` in TypeScript. No `!` without an explanatory comment.
- Use `@/` path alias always. Never relative imports like `../../lib/x`.
- All shared types in `types/index.ts`. Never redefine a type locally.