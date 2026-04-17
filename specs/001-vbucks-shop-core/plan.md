# Implementation Plan: VBucks Shop Core System

**Branch**: `001-vbucks-shop-core` | **Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-vbucks-shop-core/spec.md`

---

## Summary

Build an end-to-end VBucks shop where users purchase V-Bucks via Stripe Checkout,
spend V-Bucks on Fortnite skin orders, and admins manually fulfill or refund orders
through a dashboard. The stack is Next.js 16 (App Router) + Supabase + Clerk +
Stripe + Resend, deployed on Vercel.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Next.js 16 (App Router)
**Primary Dependencies**: Next.js, Clerk (`@clerk/nextjs`), Supabase JS v2, Stripe Node SDK, Resend SDK, Tailwind CSS
**Storage**: Supabase PostgreSQL with RLS; migrations in `supabase/migrations/`
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Vercel (serverless + edge)
**Project Type**: web-app
**Performance Goals**: Purchase flow < 3 min; catalog load < 1 s (cached)
**Constraints**: All balance mutations server-side; idempotent webhook; atomic order creation; no `any` in TypeScript
**Scale/Scope**: Single-tenant; standard Vercel/Supabase free-tier scale for v1

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design below.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Server-First Architecture | Business logic in `/services` only; Client Components only for interactivity; mutations via API routes | PASS — all DB writes go through API routes or Server Actions |
| II. Strict Type Safety | No `any`; shared types in `types/index.ts`; `@/` imports only | PASS — types defined in data-model.md; enforced via tsconfig strict |
| III. Security & Auth (NON-NEGOTIABLE) | Auth-first on every route; no secrets in client; Clerk server-side only | PASS — all routes: auth() → validate → logic; SUPABASE_SERVICE_ROLE_KEY server-only |
| IV. Test-First (NON-NEGOTIABLE) | Unit test per feature; E2E per user flow | PASS — Vitest + Playwright per docs/TESTING.md; tests scoped per story |
| V. Data Integrity & API Design | Supabase RLS on all tables; idempotent webhook; atomic order creation | PASS — buy_skin DB function; stripe_session_id unique constraint; increment_vbucks function |

No gate violations. No complexity justification required.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-vbucks-shop-core/
├── plan.md              ← this file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-contracts.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
app/
├── layout.tsx                          # Root layout (ClerkProvider, font)
├── page.tsx                            # Landing / redirect to /wallet
├── middleware.ts                       # Clerk route protection
│
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
│
├── (shop)/
│   ├── wallet/
│   │   └── page.tsx                   # Balance, buy V-Bucks, order history, set username
│   ├── skins/
│   │   ├── page.tsx                   # Catalog grid
│   │   └── [skinId]/
│   │       └── page.tsx               # Skin detail + buy button
│   └── checkout/
│       ├── success/page.tsx           # Stripe return URL (success)
│       └── cancel/page.tsx            # Stripe return URL (cancel)
│
├── (admin)/
│   └── orders/
│       └── page.tsx                   # Admin dashboard
│
└── api/
    ├── user/
    │   └── sync/route.ts              # Upsert profiles row
    ├── checkout/
    │   └── route.ts                   # Create Stripe Checkout session
    ├── webhooks/
    │   └── stripe/route.ts            # Stripe webhook handler
    ├── skins/
    │   └── route.ts                   # Proxied + cached skin catalog
    ├── orders/
    │   └── route.ts                   # Create skin order
    └── admin/
        └── orders/
            └── [orderId]/route.ts     # Admin: fulfill or refund order

components/
├── wallet/
│   ├── WalletBalance.tsx              # Displays vbucks_balance
│   ├── BuyVBucksSection.tsx           # Pack selection + checkout button
│   ├── OrderHistory.tsx               # User's skin_orders list
│   └── FortniteUsernameForm.tsx       # Set fortnite_username (client)
├── skins/
│   ├── SkinCard.tsx                   # Catalog grid item
│   ├── SkinCatalog.tsx                # Grid wrapper
│   └── BuySkinButton.tsx             # Confirm purchase button (client)
├── admin/
│   ├── PendingOrdersTable.tsx         # Admin orders list
│   └── OrderActionButtons.tsx        # Gifted / Refunded buttons (client)
└── ui/
    ├── LoadingSpinner.tsx
    ├── ErrorMessage.tsx
    └── EmptyState.tsx

lib/
├── supabase/
│   ├── server.ts                      # Anon key, server components (respects RLS)
│   └── admin.ts                       # Service role key, API routes only
├── stripe.ts                          # Stripe SDK instance
├── resend.ts                          # Resend SDK instance
└── vbucks-packs.ts                    # Pack definitions (id, vbucks, price_cents)

services/
├── wallet.ts                          # getProfile, setFortniteUsername
├── skins.ts                           # fetchSkins (external API + cache)
├── orders.ts                          # createOrder, getOrders, getPendingOrders, fulfillOrder
└── email.ts                           # sendFulfillmentEmail, sendRefundEmail

types/
└── index.ts                           # Profile, Purchase, SkinOrder, Skin, VBucksPack, OrderStatus

supabase/
└── migrations/
    ├── 20260417_init_profiles.sql
    ├── 20260417_init_purchases.sql
    ├── 20260417_init_skin_orders.sql
    └── 20260417_functions.sql         # increment_vbucks, buy_skin

__tests__/
├── unit/
│   ├── api/
│   │   ├── checkout.test.ts
│   │   ├── webhook-stripe.test.ts
│   │   ├── skins.test.ts
│   │   ├── orders.test.ts
│   │   └── admin-orders.test.ts
│   ├── services/
│   │   ├── wallet.test.ts
│   │   ├── skins.test.ts
│   │   └── orders.test.ts
│   └── lib/
│       └── vbucks-packs.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── vbucks-purchase.spec.ts
    ├── skin-purchase.spec.ts
    ├── fortnite-username.spec.ts
    └── admin-fulfillment.spec.ts
```

**Structure Decision**: Single Next.js project using App Router with route groups for
auth, shop, and admin. Service layer in `/services` keeps business logic out of API
routes and components. `lib/supabase/admin.ts` is never imported in any component —
enforced by code review.

---

## Constitution Check — Post-Design

All five principles re-verified against the concrete project structure:

- **I**: No business logic in `components/` or `app/` pages. All mutations in
  `services/` called from API routes. Client Components limited to interactive
  elements (`BuySkinButton`, `OrderActionButtons`, `FortniteUsernameForm`).
- **II**: `types/index.ts` defines all shared types. No local type redefinitions.
  Strict tsconfig. `@/` alias throughout.
- **III**: Every API route starts with `auth()` check. Service role key only in
  `lib/supabase/admin.ts`, imported only in API routes.
- **IV**: Unit tests mirror every API route and service function. E2E tests cover
  all five user flows from `docs/TESTING.md`.
- **V**: `stripe_session_id` UNIQUE constraint prevents double-credit.
  `buy_skin` function is atomic. RLS on all three tables.

No violations. No complexity tracking required.

---

## Complexity Tracking

> No constitution violations to justify — section intentionally empty.
