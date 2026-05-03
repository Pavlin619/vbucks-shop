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

## Next.js App Router conventions

These rules implement [Next.js's documented project-structure guidance](https://nextjs.org/docs/app/getting-started/project-structure).
Follow them when adding new features so the codebase stays consistent.

### Colocate route-only UI under private `_` folders

Components used by **exactly one** route live next to that route, not in
top-level `components/`. Use the `_`-prefix convention so the folder is
ignored by the router.

- Route-only UI:    `app/(group)/route/_components/Foo.tsx`
- Route-only logic: `app/(group)/route/_lib/use-foo.ts`

Top-level `components/` is reserved for UI shared across **two or more**
routes (today: `layout/Header`, `layout/Footer`, `ui/EmptyState`).

### Server Components by default; push `'use client'` down

Pages and layouts stay Server Components unless they need browser-only APIs
(state, effects, refs, event handlers). When a page needs a small bit of
interactivity, extract that piece into its own `'use client'` component
rather than marking the whole page client. Keep client components small —
everything they import gets bundled and shipped to the browser.

### Enforce server/client boundaries with import guards

- Add `import 'server-only'` to every file that imports `SUPABASE_SERVICE_ROLE_KEY`,
  `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, or any other secret. Comment-only
  warnings are not enough — `server-only` turns accidental client imports
  into build errors.
- Add `import 'client-only'` to modules that touch `window` / `localStorage`
  / browser-only APIs.
- Every file under `services/` and `lib/{supabase/admin, stripe, resend}.ts`
  must start with `import 'server-only'`.

### Thin route handlers, fat services

API route handlers in `app/api/**/route.ts` should be ~30 lines:

1. `const { userId } = await auth()` — auth gate
2. Validate request input
3. Delegate to a `services/` function
4. Translate the result into a `NextResponse`

Business logic, RPC calls, third-party SDK orchestration — all of that
lives in `services/`. Route handlers should never call `supabaseAdmin.rpc`,
`stripe.checkout.sessions.create`, etc. directly.

### File naming

- Component files: `PascalCase.tsx` (React convention).
- Everything else (helpers, hooks, types modules): `kebab-case.ts`.
- Hook files start with `use-`: `use-checkout.ts`.

### Splitting large files

A component over ~120 lines is a smell. Split when you see:

- Multiple unrelated visual blocks (extract sub-components).
- A constants table that's longer than the markup that uses it (move to a
  sibling `_lib/<name>.ts`).
- Inline `fetch` + state + error handling for an API call (extract a
  `use-*` hook into `_lib/`).

Pure helpers (formatters, calculators) belong in `_lib/` and should ship
with their own unit tests.

## Styling conventions

These rules implement the [Tailwind v4 theme docs](https://tailwindcss.com/docs/theme)
and the [styling-with-utility-classes guide](https://tailwindcss.com/docs/styling-with-utility-classes).

### Brand colors come from theme tokens, never hex literals

The brand palette lives in [`app/globals.css`](app/globals.css) under a
single `@theme inline` block. That block auto-generates utility classes
like `bg-brand-accent`, `text-brand-muted`, `border-brand-border`. Use
those utilities in JSX:

- `className="bg-brand-accent text-brand-text"` — yes
- `style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}` — no

Adding a new brand color: add the variable to BOTH the `:root` block
(actual value) and the `@theme inline` block (utility generation) in
`app/globals.css`. That keeps the palette in one file.

### `style={{}}` is reserved for dynamic, data-driven values

Inline `style` is a smell unless the value is computed from runtime data
the bundler can't see. The canonical good case in this codebase is
[`ShopTile`](app/(shop)/item-shop/_components/ShopTile.tsx), which builds
a per-tile gradient from `entry.colors.color1` / `color3` returned by the
Fortnite API. Static brand colors must use utilities.

### Reuse via React components, not `@layer components`

Tailwind's docs explicitly recommend extracting a React component (not a
custom CSS class) when a chrome pattern repeats across files. Shared
primitives live in `components/ui/`:

- [`Button`](components/ui/Button.tsx) — every CTA. Variants: `primary`,
  `secondary`. Renders as `<button>` or `<Link>` via `as`. Use this
  instead of hand-rolling another `rounded-full` pill.
- [`Card`](components/ui/Card.tsx) — the recurring purple panel.
  Variants: `default`, `highlight` (accent border).
- [`SectionHeading`](components/ui/SectionHeading.tsx) — section title +
  optional subtitle on marketing pages.
- [`EmptyState`](components/ui/EmptyState.tsx) — empty-list placeholder.

When you find yourself copying the same `className` chain into a third
file, extract a primitive and add a unit test for it.

### Hover states use brand tokens, not `hover:opacity-90`

`hover:opacity-90` dims the icon and text along with the background and
makes the button look broken. Prefer the explicit hover token, e.g.
`bg-brand-accent hover:bg-brand-accent-hover`. The hover-color tokens
already exist in the palette.
