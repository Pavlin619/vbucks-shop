@AGENTS.md

## Quality gate — required before every commit
Every change must leave the repo in this state before being committed or merged:
- `npm run lint` — zero errors (warnings are allowed)
- `npm run type-check` — zero errors
- `npm run test:run` — all unit tests green

Run `npm run lint:fix` to auto-fix style issues before checking manually.
If you add a new API route or service function, add a corresponding unit test.

## Active Technologies
- TypeScript 5 (strict mode), Next.js 16 (App Router) + Next.js, Clerk (`@clerk/nextjs`), Supabase JS v2, Stripe Node SDK, Resend SDK, Tailwind CSS (main)
- Supabase PostgreSQL with RLS; migrations in `supabase/migrations/` (main)

## Recent Changes
- main: Added TypeScript 5 (strict mode), Next.js 16 (App Router) + Next.js, Clerk (`@clerk/nextjs`), Supabase JS v2, Stripe Node SDK, Resend SDK, Tailwind CSS
