---
description: "Task list for VBucks Shop Core System implementation"
---

# Tasks: VBucks Shop Core System

**Input**: Design documents from `specs/001-vbucks-shop-core/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api-contracts.md ✅

**Tests**: Included — constitution mandates unit tests per feature and E2E tests per user flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths included in every task description

---

## Phase 1: Setup

**Purpose**: Project initialization and baseline configuration

- [x] T001 Create folder structure: `components/wallet/`, `components/skins/`, `components/admin/`, `components/ui/`, `lib/supabase/`, `services/`, `types/`, `supabase/migrations/`, `__tests__/unit/api/`, `__tests__/unit/services/`, `__tests__/unit/lib/`, `__tests__/e2e/`
- [x] T002 Install dependencies: `@clerk/nextjs`, `@supabase/supabase-js`, `stripe`, `@stripe/stripe-js`, `resend`, `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@playwright/test` — update `package.json`
- [x] T003 [P] Configure TypeScript strict mode and `@/` path alias in `tsconfig.json` (`"strict": true`, `"paths": { "@/*": ["./*"] }`)
- [x] T004 [P] Configure Vitest in `vitest.config.ts` with jsdom environment; add `test:run` and `test` scripts to `package.json`
- [x] T005 [P] Configure Playwright in `playwright.config.ts` targeting `http://localhost:3000`; add `test:e2e` and `test:e2e:ui` scripts to `package.json`
- [x] T006 [P] Configure Tailwind CSS in `tailwind.config.ts` and `postcss.config.js` with `content` glob covering `app/**` and `components/**`
- [x] T007 Create `.env.example` documenting all required variables: `NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_USER_IDS`, `NEXT_PUBLIC_APP_URL`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that MUST be complete before any user story begins

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Define all shared TypeScript types in `types/index.ts`: `Profile`, `Purchase`, `SkinOrder`, `Skin`, `VBucksPack`, `OrderStatus` (see data-model.md for field definitions)
- [x] T009 [P] Create Supabase server client in `lib/supabase/server.ts` using anon key via `createServerClient` from `@supabase/ssr` — for server components and server actions (respects RLS)
- [x] T010 [P] Create Supabase admin client in `lib/supabase/admin.ts` using service role key via `createClient` — for API routes only; add lint comment warning never to import in components
- [x] T011 [P] Create Stripe SDK instance in `lib/stripe.ts` — export singleton `stripe` using `STRIPE_SECRET_KEY`
- [x] T012 [P] Create Resend SDK instance in `lib/resend.ts` — export singleton `resend` using `RESEND_API_KEY`
- [x] T013 [P] Define VBucks pack catalogue in `lib/vbucks-packs.ts`: four packs (200 / 500 / 1000 / 2800 V-Bucks) with `id`, `vbucks`, `price_cents`, `label` fields; export as `VBUCKS_PACKS` record and `getPackById` helper
- [x] T014 Write Supabase migration `supabase/migrations/20260417_init_profiles.sql`: `profiles` table with `id uuid PK`, `fortnite_username text nullable`, `vbucks_balance integer NOT NULL DEFAULT 0 CHECK (>= 0)`, `created_at`, `updated_at`; RLS enabled; policy: SELECT own row; `updated_at` trigger
- [ ] T014b Apply migrations to Supabase local/remote instance and verify schema
- [ ] T014c Validate RLS policies manually using test queries
- [x] T015 [P] Write Supabase migration `supabase/migrations/20260417_init_purchases.sql`: `purchases` table with all columns from data-model.md; RLS enabled; SELECT own rows; no client INSERT/UPDATE/DELETE
- [x] T016 [P] Write Supabase migration `supabase/migrations/20260417_init_skin_orders.sql`: `skin_orders` table with all columns from data-model.md; status CHECK constraint `IN ('pending','gifted','refunded')`; RLS enabled; SELECT own rows; no client mutations
- [x] T017 Write Supabase migration `supabase/migrations/20260417_functions.sql`: `increment_vbucks(p_user_id uuid, p_amount integer)` and `buy_skin(p_user_id uuid, p_skin_id text, p_skin_name text, p_vbucks_cost integer) RETURNS uuid` — exact SQL in data-model.md
- [x] T018 Configure Clerk middleware in `app/middleware.ts`: protect all routes by default; public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks/(.*)`
- [x] T019 [P] Create root layout in `app/layout.tsx` wrapping children in `<ClerkProvider>`; add `html`/`body` with Tailwind base classes
- [x] T020 [P] Create sign-in page at `app/(auth)/sign-in/[[...sign-in]]/page.tsx` using Clerk's `<SignIn>` component
- [x] T021 [P] Create sign-up page at `app/(auth)/sign-up/[[...sign-up]]/page.tsx` using Clerk's `<SignUp>` component
- [x] T022 Implement `POST /api/user/sync` in `app/api/user/sync/route.ts`: auth check via `auth()`, upsert `profiles` row using `supabaseAdmin` with `INSERT ... ON CONFLICT (id) DO NOTHING`
- [x] T023 [P] Unit test for `POST /api/user/sync` in `__tests__/unit/api/user-sync.test.ts`: 401 unauthenticated, 200 new user, 200 existing user (idempotent)

**Checkpoint**: Foundation complete — user story implementation can now begin

---

## Phase 3: User Story 1 — Buy V-Bucks with Real Money (Priority: P1) MVP

**Goal**: A user can select a V-Bucks bundle, pay via Stripe, and see their
wallet balance updated after confirmed payment.

**Independent Test**: Create a test account, navigate to `/wallet`, purchase
any pack with Stripe test card `4242 4242 4242 4242`, return to app, and verify
`vbucks_balance` increased in both the UI and `purchases` table.

### Tests for User Story 1

> **Write these tests FIRST and ensure they FAIL before implementation**

- [ ] T024 [P] [US1] E2E test: full V-Bucks purchase flow in `__tests__/e2e/vbucks-purchase.spec.ts` — sign in, navigate to `/wallet`, click buy, complete Stripe test checkout, assert balance displays correct amount; use `data-testid="vbucks-balance"` and `data-testid="buy-pack-{packId}"`
- [ ] T025 [P] [US1] Unit test for `POST /api/checkout` in `__tests__/unit/api/checkout.test.ts`: 401 unauthenticated, 400 invalid packId, 200 returns Stripe URL
- [ ] T026 [P] [US1] Unit test for `POST /api/webhooks/stripe` in `__tests__/unit/api/webhook-stripe.test.ts`: 400 bad signature, 200 first event credits wallet, 200 duplicate event skipped (idempotent), 500 DB error retried
- [ ] T027 [P] [US1] Unit test for `services/wallet.ts` in `__tests__/unit/services/wallet.test.ts`: `getProfile` returns profile, `setFortniteUsername` updates username

### Implementation for User Story 1

- [ ] T028 [US1] Implement `services/wallet.ts`: `getProfile(userId: string): Promise<Profile>` using `supabaseAdmin`; `setFortniteUsername(userId: string, username: string): Promise<void>` — validate non-empty string, update `profiles.fortnite_username`
- [ ] T029 [US1] Implement `POST /api/checkout` in `app/api/checkout/route.ts`: `auth()` check → validate `packId` via `getPackById` → create Stripe Checkout session with metadata `{ userId, vbucks, packId }`, `success_url`, `cancel_url` → return `{ url }`
- [ ] T030 [US1] Implement `POST /api/webhooks/stripe` in `app/api/webhooks/stripe/route.ts`: verify signature with raw body → handle `checkout.session.completed` → attempt INSERT into `purchases` (catch unique violation for idempotency) → call `increment_vbucks` RPC → throw on DB error (Stripe retry)
- [ ] T031 [P] [US1] Create `WalletBalance` server component in `components/wallet/WalletBalance.tsx`: accept `balance: number` prop; render with `data-testid="vbucks-balance"`
- [ ] T032 [P] [US1] Create `BuyVBucksSection` server component in `components/wallet/BuyVBucksSection.tsx`: render pack grid from `VBUCKS_PACKS`; each pack button has `data-testid="buy-pack-{packId}"`; clicking POSTs to `/api/checkout` and redirects to Stripe URL
- [ ] T033 [P] [US1] Create `FortniteUsernameForm` client component in `components/wallet/FortniteUsernameForm.tsx`: form with text input and submit; POSTs to Server Action wrapping `setFortniteUsername`; shows inline error/success; `data-testid="fortnite-username-input"` and `data-testid="fortnite-username-submit"`
- [ ] T034 [P] [US1] Create checkout success page at `app/(shop)/checkout/success/page.tsx`: display success message and link back to `/wallet`
- [ ] T035 [P] [US1] Create checkout cancel page at `app/(shop)/checkout/cancel/page.tsx`: display cancelled message and link back to `/wallet`
- [ ] T036 [US1] Implement wallet page at `app/(shop)/wallet/page.tsx`: server component; fetch profile via `getProfile(userId)`; render `<WalletBalance>`, `<FortniteUsernameForm>`, `<BuyVBucksSection>`

**Checkpoint**: User Story 1 independently functional — purchase flow works end-to-end

---

## Phase 4: User Story 2 — Browse Skins and Spend V-Bucks (Priority: P2)

**Goal**: A user with sufficient balance can browse the skin catalog, select a skin,
confirm purchase, and see their balance deducted with a pending order created.

**Independent Test**: With a pre-loaded wallet balance and Fortnite username set,
navigate to `/skins`, select any skin, confirm purchase, and verify balance decreased
and a pending order appears in the order history on `/wallet`.

### Tests for User Story 2

> **Write these tests FIRST and ensure they FAIL before implementation**

- [ ] T037 [P] [US2] E2E test: full skin purchase flow in `__tests__/e2e/skin-purchase.spec.ts` — sign in with pre-loaded balance, browse `/skins`, select a skin, click "Buy with V-Bucks", assert balance decreased and order shows "pending"; use `data-testid="skin-card"`, `data-testid="buy-skin-btn"`, `data-testid="order-status"`
- [ ] T038 [P] [US2] E2E test: Fortnite username gate in `__tests__/e2e/fortnite-username.spec.ts` — user without username cannot reach skin purchase; after setting username, purchase succeeds
- [ ] T039 [P] [US2] Unit test for `GET /api/skins` in `__tests__/unit/api/skins.test.ts`: 401 unauthenticated, 200 returns cached catalog, 502 when external API unavailable and no cache
- [ ] T040 [P] [US2] Unit test for `POST /api/orders` in `__tests__/unit/api/orders.test.ts`: 401 unauthenticated, 422 username not set, 404 skin not in catalog, 409 insufficient balance, 201 success creates order
- [ ] T041 [P] [US2] Unit test for `services/skins.ts` in `__tests__/unit/services/skins.test.ts`: returns catalog from cache, falls back gracefully on external API failure
- [ ] T042 [P] [US2] Unit test for `services/orders.ts` (user functions) in `__tests__/unit/services/orders.test.ts`: `createOrder` atomic deduction, `getOrders` returns own orders only

### Implementation for User Story 2

- [ ] T043 [US2] Implement `services/skins.ts`: `fetchSkins(): Promise<Skin[]>` — fetch from external Fortnite API (or mock endpoint), wrap in `unstable_cache` with 1-hour revalidation; return empty array on failure (never throw to caller)
- [ ] T044 [US2] Implement `GET /api/skins` in `app/api/skins/route.ts`: `auth()` check → call `fetchSkins()` → return `{ skins }`; return 502 only if cache is also empty
- [ ] T045 [US2] Implement `services/orders.ts` (user functions): `createOrder(userId, skinId): Promise<string>` — fetch skin from catalog, validate fortnite_username, call `buy_skin` RPC, return orderId; `getOrders(userId): Promise<SkinOrder[]>` — SELECT own rows ordered by `created_at desc`
- [ ] T046 [US2] Implement `POST /api/orders` in `app/api/orders/route.ts`: `auth()` → validate `skinId` → call `createOrder` → return `{ orderId }` with 201; map service errors to correct HTTP status codes
- [ ] T047 [P] [US2] Create `SkinCard` server component in `components/skins/SkinCard.tsx`: display name, image, rarity badge, vbucks cost; wrap in link to `/skins/[skinId]`; `data-testid="skin-card"`
- [ ] T048 [P] [US2] Create `SkinCatalog` server component in `components/skins/SkinCatalog.tsx`: accept `skins: Skin[]` prop; render grid of `<SkinCard>` items; render `<EmptyState>` when empty
- [ ] T049 [P] [US2] Create `BuySkinButton` client component in `components/skins/BuySkinButton.tsx`: accept `skinId: string`, `vbucksCost: number`, `userBalance: number` props; disable and show message when balance insufficient; POST to `/api/orders` on click; redirect to `/wallet` on success; `data-testid="buy-skin-btn"`
- [ ] T050 [P] [US2] Create `OrderHistory` server component in `components/wallet/OrderHistory.tsx`: accept `orders: SkinOrder[]` prop; render list with skin name, cost, status badge; `data-testid="order-status"` on each status badge
- [ ] T051 [US2] Implement skins catalog page at `app/(shop)/skins/page.tsx`: server component; call `fetchSkins()`; render `<SkinCatalog skins={skins} />`
- [ ] T052 [US2] Implement skin detail page at `app/(shop)/skins/[skinId]/page.tsx`: server component; find skin from catalog by `params.skinId`; render image, name, rarity, cost, and `<BuySkinButton>`; 404 if not found
- [ ] T053 [US2] Update wallet page `app/(shop)/wallet/page.tsx` to also fetch orders via `getOrders(userId)` and render `<OrderHistory orders={orders} />`

**Checkpoint**: User Stories 1 and 2 independently functional

---

## Phase 5: User Story 3 — Admin Fulfills Skin Orders (Priority: P3)

**Goal**: An admin can view all pending skin orders and mark each as "gifted"
(fulfilled) or "refunded" (failed), triggering a buyer notification.

**Independent Test**: With at least one pending order in the system, sign in as admin
(userId in `ADMIN_USER_IDS`), navigate to `/admin/orders`, mark the order as "gifted",
and confirm the order status changes and the buyer receives an email notification.

### Tests for User Story 3

> **Write these tests FIRST and ensure they FAIL before implementation**

- [ ] T054 [P] [US3] E2E test: admin fulfillment flow in `__tests__/e2e/admin-fulfillment.spec.ts` — sign in as admin, navigate to `/admin/orders`, mark pending order as gifted, assert status changes; verify non-admin user receives 403; `data-testid="fulfill-btn"`, `data-testid="refund-btn"`
- [ ] T055 [P] [US3] Unit test for `PATCH /api/admin/orders/[orderId]` in `__tests__/unit/api/admin-orders.test.ts`: 401 unauthenticated, 403 non-admin, 400 invalid status, 404 order not found, 409 order not pending, 200 gifted success, 200 refunded success (with balance refund)
- [ ] T056 [P] [US3] Unit test for `services/orders.ts` (admin functions) in `__tests__/unit/services/orders-admin.test.ts`: `getPendingOrders` returns all pending, `fulfillOrder` updates status and triggers refund on "refunded"
- [ ] T057 [P] [US3] Unit test for `services/email.ts` in `__tests__/unit/services/email.test.ts`: `sendFulfillmentEmail` calls Resend with correct recipient; `sendRefundEmail` calls Resend with correct recipient

### Implementation for User Story 3

- [ ] T058 [US3] Implement `services/email.ts`: `sendFulfillmentEmail(to: string, skinName: string): Promise<void>` and `sendRefundEmail(to: string, skinName: string, vbucksRefunded: number): Promise<void>` using `resend.emails.send`; log errors server-side, never throw to caller
- [ ] T059 [US3] Extend `services/orders.ts` with admin functions: `getPendingOrders(): Promise<SkinOrder[]>` — all rows with `status='pending'`; `fulfillOrder(orderId: string, status: 'gifted' | 'refunded'): Promise<void>` — validate order is pending, update status + `resolved_at`, conditionally call `increment_vbucks` for refund, call email service
- [ ] T060 [US3] Implement `PATCH /api/admin/orders/[orderId]` in `app/api/admin/orders/[orderId]/route.ts`: `auth()` → admin check against `ADMIN_USER_IDS` env var → validate `status` body → call `fulfillOrder` → return `{ ok: true }`
- [ ] T061 [P] [US3] Create `PendingOrdersTable` server component in `components/admin/PendingOrdersTable.tsx`: accept `orders: SkinOrder[]` prop; render table with buyer userId, skin name, cost, created timestamp, and action buttons
- [ ] T062 [P] [US3] Create `OrderActionButtons` client component in `components/admin/OrderActionButtons.tsx`: accept `orderId: string` prop; "Mark as Gifted" and "Mark as Refunded" buttons; PATCH `/api/admin/orders/{orderId}`; disable buttons after action; `data-testid="fulfill-btn"` and `data-testid="refund-btn"`
- [ ] T063 [US3] Implement admin orders page at `app/(admin)/orders/page.tsx`: server component; verify admin server-side (redirect to `/` if not admin); fetch via `getPendingOrders()`; render `<PendingOrdersTable orders={orders} />`

**Checkpoint**: All three user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Shared UI, edge case handling, and final validation

- [ ] T064 [P] Create shared UI components in `components/ui/`: `LoadingSpinner.tsx`, `ErrorMessage.tsx` (accept `message: string`), `EmptyState.tsx` (accept `message: string`) — used by catalog, order history, admin dashboard
- [ ] T065 [P] Create landing page at `app/page.tsx`: redirect authenticated users to `/wallet`; show sign-in / sign-up links for unauthenticated visitors
- [ ] T066 [P] Unit test for `lib/vbucks-packs.ts` in `__tests__/unit/lib/vbucks-packs.test.ts`: all four packs present, prices in cents, `getPackById` returns correct pack and undefined for unknown id
- [ ] T067 [P] E2E test: auth flows in `__tests__/e2e/auth.spec.ts` — sign up new account, sign in, sign out; protected routes redirect unauthenticated users
- [ ] T068 Audit all interactive elements for `data-testid` attributes — ensure `vbucks-balance`, `buy-pack-{packId}`, `skin-card`, `buy-skin-btn`, `order-status`, `fulfill-btn`, `refund-btn`, `fortnite-username-input`, `fortnite-username-submit` are all present; fix any gaps
- [ ] T069 Add `try/catch` and loading state reset (`finally` block) to all client components that call API routes (`BuySkinButton`, `BuyVBucksSection`, `FortniteUsernameForm`, `OrderActionButtons`) — test that buttons re-enable after errors
- [ ] T070 Run quickstart.md validation: follow steps 6–8 end-to-end in development to confirm full purchase + fulfillment flow works; fix any issues found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Requires Foundational — no dependency on US2/US3
- **US2 (Phase 4)**: Requires Foundational — no dependency on US1/US3 (but wallet page update T053 logically follows US1's T036)
- **US3 (Phase 5)**: Requires Foundational + T045/T059 (order service) — no dependency on US1/US2 UI
- **Polish (Phase 6)**: Requires all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2
- **US2 (P2)**: Can start after Phase 2; T053 extends wallet page from T036 (add after US1 checkpoint)
- **US3 (P3)**: Can start after Phase 2; `fulfillOrder` in T059 extends `services/orders.ts` from T045

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation
- Services before API routes
- API routes before UI components
- Core implementation before integration tasks at end of phase

### Parallel Opportunities

- All Phase 1 tasks T003–T007 can run in parallel
- All Phase 2 lib/client tasks T009–T013 can run in parallel
- All Phase 2 migration files T015–T016 can run in parallel with each other (T017 depends on T014)
- Within each user story, all `[P]`-marked tasks can run in parallel

---

## Parallel Example: User Story 1

```bash
# Tests (write first, run in parallel):
T024: E2E test — vbucks-purchase.spec.ts
T025: Unit test — api/checkout.test.ts
T026: Unit test — api/webhook-stripe.test.ts
T027: Unit test — services/wallet.test.ts

# Implementation (after tests fail):
T028: services/wallet.ts
T029: THEN: /api/checkout (depends on T028)
T030: THEN: /api/webhooks/stripe (depends on T028)

# UI components (parallel after services exist):
T031: components/wallet/WalletBalance.tsx
T032: components/wallet/BuyVBucksSection.tsx
T033: components/wallet/FortniteUsernameForm.tsx
T034: app/(shop)/checkout/success/page.tsx
T035: app/(shop)/checkout/cancel/page.tsx

# Integration:
T036: THEN: app/(shop)/wallet/page.tsx (depends on T031–T033)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — CRITICAL
3. Complete Phase 3: User Story 1 (Buy V-Bucks)
4. **STOP and VALIDATE**: Purchase flow, balance update, idempotency
5. Deploy to Vercel staging

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 complete → Users can buy V-Bucks (MVP)
3. US2 complete → Users can order skins
4. US3 complete → Admins can fulfill orders (full loop)
5. Polish → Production-ready

### Parallel Team Strategy

With 3 developers (after Phase 2 complete):
- Developer A: User Story 1 (payments)
- Developer B: User Story 2 (catalog + orders)
- Developer C: User Story 3 (admin fulfillment)

---

## Notes

- `[P]` = different files, no in-flight dependencies — safe to parallelize
- `[Story]` label maps task to user story for independent delivery tracking
- Tests MUST fail before implementation begins
- Always reset loading state in `finally` — test buttons re-enable on error
- `lib/supabase/admin.ts` MUST only be imported in `app/api/**` — never in components
- Money amounts in cents throughout — never floats
- Commit after each completed checkpoint
