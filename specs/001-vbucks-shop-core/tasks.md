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

- [x] T024 [P] [US1] E2E test: full V-Bucks purchase flow in `__tests__/e2e/vbucks-purchase.spec.ts` — sign in, navigate to `/wallet`, click buy, complete Stripe test checkout, assert balance displays correct amount; use `data-testid="vbucks-balance"` and `data-testid="buy-pack-{packId}"`
- [x] T025 [P] [US1] Unit test for `POST /api/checkout` in `__tests__/unit/api/checkout.test.ts`: 401 unauthenticated, 400 invalid packId, 200 returns Stripe URL
- [x] T026 [P] [US1] Unit test for `POST /api/webhooks/stripe` in `__tests__/unit/api/webhook-stripe.test.ts`: 400 bad signature, 200 first event credits wallet, 200 duplicate event skipped (idempotent), 500 DB error retried
- [x] T027 [P] [US1] Unit test for `services/wallet.ts` in `__tests__/unit/services/wallet.test.ts`: `getProfile` returns profile, `setFortniteUsername` updates username

### Implementation for User Story 1

- [x] T028 [US1] Implement `services/wallet.ts`: `getProfile(userId: string): Promise<Profile>` using `supabaseAdmin`; `setFortniteUsername(userId: string, username: string): Promise<void>` — validate non-empty string, update `profiles.fortnite_username`
- [x] T029 [US1] Implement `POST /api/checkout` in `app/api/checkout/route.ts`: `auth()` check → validate `packId` via `getPackById` → create Stripe Checkout session with metadata `{ userId, vbucks, packId }`, `success_url`, `cancel_url` → return `{ url }`
- [x] T030 [US1] Implement `POST /api/webhooks/stripe` in `app/api/webhooks/stripe/route.ts`: verify signature with raw body → handle `checkout.session.completed` → attempt INSERT into `purchases` (catch unique violation for idempotency) → call `increment_vbucks` RPC → throw on DB error (Stripe retry)
- [x] T031 [P] [US1] Create `WalletBalance` server component in `components/wallet/WalletBalance.tsx`: accept `balance: number` prop; render with `data-testid="vbucks-balance"`
- [x] T032 [P] [US1] Create `BuyVBucksSection` server component in `components/wallet/BuyVBucksSection.tsx`: render pack grid from `VBUCKS_PACKS`; each pack button has `data-testid="buy-pack-{packId}"`; clicking POSTs to `/api/checkout` and redirects to Stripe URL
- [x] T033 [P] [US1] Create `FortniteUsernameForm` client component in `components/wallet/FortniteUsernameForm.tsx`: form with text input and submit; POSTs to Server Action wrapping `setFortniteUsername`; shows inline error/success; `data-testid="fortnite-username-input"` and `data-testid="fortnite-username-submit"`
- [x] T034 [P] [US1] Create checkout success page at `app/(shop)/checkout/success/page.tsx`: display success message and link back to `/wallet`
- [x] T035 [P] [US1] Create checkout cancel page at `app/(shop)/checkout/cancel/page.tsx`: display cancelled message and link back to `/wallet`
- [x] T036 [US1] Implement wallet page at `app/(shop)/wallet/page.tsx`: server component; fetch profile via `getProfile(userId)`; render `<WalletBalance>`, `<FortniteUsernameForm>`, `<BuyVBucksSection>`

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

- [~] T037 [P] [US2] E2E test: full skin purchase flow — _(catalog-fetch slice covered in `__tests__/e2e/item-shop.spec.ts`; purchase slice deferred until ordering is implemented)_
- [~] T038 [P] [US2] E2E test: Fortnite username gate — _(public-surface checks live in `__tests__/e2e/item-shop.spec.ts`; authenticated assertions stay `test.skip` pending a Clerk E2E auth helper)_
- [x] T039 [P] [US2] Unit test for `GET /api/skins` in `__tests__/unit/api/skins.test.ts`: 401 unauthenticated, 200 returns cached catalog, 502 when external API unavailable and no cache
- [x] T040 [P] [US2] Unit test for `POST /api/orders` in `__tests__/unit/api/orders.test.ts`: 401 unauthenticated, 422 username not set, 404 skin not in catalog, 409 insufficient balance, 201 success creates order
- [x] T041 [P] [US2] Unit test for `services/skins.ts` in `__tests__/unit/services/skins.test.ts`: returns catalog from cache, falls back gracefully on external API failure
- [x] T042 [P] [US2] Unit test for `services/orders.ts` (user functions) in `__tests__/unit/services/orders.test.ts`: `createOrder` covers username-not-set, catalog miss, insufficient balance (pre-check + RPC race), DB error, and success paths. _(`getOrders` deferred — depends on the wallet page which is intentionally out of scope; will land with US3 admin work.)_

### Implementation for User Story 2

- [x] T043 [US2] Implement `services/skins.ts`: `fetchSkins(): Promise<Skin[]>` — fetch from external Fortnite API (or mock endpoint), wrap in `unstable_cache` with 1-hour revalidation; return empty array on failure (never throw to caller)
- [x] T044 [US2] Implement `GET /api/skins` in `app/api/skins/route.ts`: `auth()` check → call `fetchSkins()` → return `{ skins }`; return 502 only if cache is also empty
- [x] T045 [US2] Implement `services/orders.ts` (user functions): `createOrder(userId, skinId)` returns a discriminated `CreateOrderResult` — validates Fortnite username, looks up the skin in the live shop catalog, pre-checks balance, and calls the atomic `buy_skin` RPC. Maps SQLSTATE 23514 (CHECK violation) back to `INSUFFICIENT_BALANCE` so concurrent debits surface a consistent status. _(`getOrders` deferred — see T042 note.)_
- [x] T046 [US2] Implement `POST /api/orders` in `app/api/orders/route.ts`: `auth()` → validate `skinId` (string + non-empty + trimmed) → delegate to `createOrder` → 201 with `{ orderId, skinName, vbucksCost, remainingBalance }`; service errors map to 400/404/409/422/500 per `contracts/api-contracts.md`.
- [x] T047 [P] [US2] Create `SkinCard` server component _(superseded — replaced by `components/shop/ShopTile.tsx` with Epic-style gradient tiles, sale badge, and tile-size grid spans driven by the API's `tileSize`)_
- [x] T048 [P] [US2] Create `SkinCatalog` server component _(superseded — replaced by `components/shop/ShopGrid.tsx` + `components/shop/ShopSection.tsx`, which group entries by Fortnite "layout" the same way Epic does)_
- [x] T049 [P] [US2] Create `BuySkinButton` client component at `app/(shop)/item-shop/[offerId]/_components/BuySkinButton.tsx` (route-only, colocated under `_components/` per AGENTS.md). Disables itself when balance < cost, POSTs to `/api/orders` via the `usePlaceOrder` hook in `_lib/use-place-order.ts`, and renders `<OrderOutcome>` on success — the user stays on the detail page (no `/wallet` exists) and reads the receipt instead of being bounced. `data-testid="buy-skin-btn"`.
- [~] T050 [P] [US2] `OrderHistory` — _(deferred: lives on the `/wallet` page which is intentionally out of scope for this slice. Will land when the wallet/profile surface is reintroduced.)_
- [x] T051 [US2] Implement Item Shop catalog page at `app/(shop)/item-shop/page.tsx`: server component; calls `fetchShopEntries()` and renders `<ShopGrid>` (sectioned by Fortnite layout). Also gated by `profile.fortnite_username`. _(URL changed from `/skins` to `/item-shop` to match the existing nav tab; old `/skins` page removed.)_
- [x] T052 [US2] Implement skin detail page at `app/(shop)/item-shop/[offerId]/page.tsx` (server component; URL changed from `/skins/[skinId]` to `/item-shop/[offerId]` to match the live shop route and `ShopEntry.offerId`). Auth-gates, redirects to `/item-shop` if `fortnite_username` is missing, looks up the entry in the live catalog, 404s if absent, and composes `<SkinDetailPanel>` + `<VBucksBalanceCard>` + `<BuySkinButton>`. `ShopTile` was made into a `<Link>` so clicking any tile navigates here.
- [~] T053 [US2] Update wallet page — _(deferred along with T050; the wallet page is out of scope for this slice.)_

**Checkpoint**: User Stories 1 and 2 independently functional

---

## Phase 5: User Story 3 — Admin Notifications & Friend Request Management (Priority: P3)

**Goal**: After a user buys V-Bucks (with their Fortnite username on file), the admin
sees them in the dashboard and manages the Fortnite friend request lifecycle so the
platform can later gift skins in-game. Users see their current friend request status
and understand what they need to do next.

**Updated checkout pre-condition**: A user must have `fortnite_username` set on their
profile before `POST /api/checkout` creates a Stripe session. `BuyVBucksSection`
already renders `FortniteUsernameForm`, but the API must enforce this server-side.

**New DB columns on `profiles`**:
- `friend_request_status text NOT NULL DEFAULT 'not_sent' CHECK IN ('not_sent','pending','accepted')`
- `friend_request_accepted_at timestamptz NULLABLE` — set when status transitions to `accepted`

**Independent Test**: Sign in as admin, navigate to `/admin/orders`. Find a user who
has completed a V-Bucks purchase. Toggle their friend request status through all three
states and confirm the DB and UI update accordingly.

### Schema & Types

- [x] T054 Write Supabase migration `supabase/migrations/20260505_profiles_friend_request.sql`: `ALTER TABLE profiles ADD COLUMN friend_request_status text NOT NULL DEFAULT 'not_sent' CHECK (friend_request_status IN ('not_sent','pending','accepted')), ADD COLUMN friend_request_accepted_at timestamptz`; add RLS note — only service role may update these columns
- [x] T055 [P] Update `types/index.ts`: add `export type FriendRequestStatus = 'not_sent' | 'pending' | 'accepted'`; extend `Profile` interface with `friend_request_status: FriendRequestStatus` and `friend_request_accepted_at: string | null`

### Checkout Gate

- [x] T056 Update `POST /api/checkout` in `app/api/checkout/route.ts`: after auth check, fetch profile via `supabaseAdmin`; return `422 { error: 'fortnite_username_required' }` if `profile.fortnite_username` is null; proceed to Stripe session creation only when username is set

### Tests for User Story 3

> **Write these tests FIRST and ensure they FAIL before implementation**

- [x] T057 [P] [US3] Unit test for `services/admin.ts` in `__tests__/unit/services/admin.test.ts`: `getRecentVBucksPurchasers` returns purchases joined with profile data; `updateFriendRequestStatus` updates status; sets `friend_request_accepted_at` when transitioning to `accepted`; clears it when transitioning away
- [x] T058 [P] [US3] Unit test for `PATCH /api/admin/profiles/[userId]/friend-request` in `__tests__/unit/api/admin-friend-request.test.ts`: 401 unauthenticated, 403 non-admin, 400 invalid status value, 404 profile not found, 200 status updated, 200 sets `friend_request_accepted_at` on `accepted` transition
- [x] T059 [P] [US3] E2E test in `__tests__/e2e/admin-friend-request.spec.ts`: sign in as admin, navigate to `/admin/orders`, find purchaser row, click through all three friend request states and assert badge changes; `data-testid="friend-request-toggle-{userId}"`

### Implementation for User Story 3

- [x] T060 [US3] Implement `services/admin.ts`: `getRecentVBucksPurchasers(): Promise<PurchaserWithStatus[]>` — join `purchases` with `profiles` (fortnite_username, friend_request_status, friend_request_accepted_at), ordered by `purchases.created_at DESC`; `updateFriendRequestStatus(userId: string, status: FriendRequestStatus): Promise<void>` — update `profiles` via `supabaseAdmin`; set `friend_request_accepted_at = now()` when `status = 'accepted'`, set `null` otherwise; add `import 'server-only'` guard
- [x] T061 [US3] Implement `services/email.ts`: `sendVBucksPurchaseNotificationToAdmin(adminEmails: string[], fortniteUsername: string, vbucksAmount: number): Promise<void>` and `sendOrderPlacedNotificationToAdmin(adminEmails: string[], fortniteUsername: string, skinName: string, vbucksCost: number): Promise<void>` — send emails to all admin addresses using `resend.emails.send`; log errors server-side, never throw to caller; add `import 'server-only'` guard
- [x] T062 [US3] Implement `PATCH /api/admin/profiles/[userId]/friend-request` in `app/api/admin/profiles/[userId]/friend-request/route.ts`: `auth.protect()` → admin check against `ADMIN_USER_IDS` → validate body `status` is a valid `FriendRequestStatus` → call `updateFriendRequestStatus` → return `{ ok: true }`
- [x] T063 [P] [US3] Create `PurchasersPanel` server component in `app/(admin)/orders/_components/PurchasersPanel.tsx`: accept `purchasers: PurchaserWithStatus[]` prop; render table with Fortnite username, V-Bucks amount, purchase timestamp, and `<FriendRequestToggle>` per row
- [x] T064 [P] [US3] Create `FriendRequestToggle` client component in `app/(admin)/orders/_components/FriendRequestToggle.tsx`: accept `userId: string` and `initialStatus: FriendRequestStatus` props; three-state toggle buttons (Not Sent / Pending / Accepted); `PATCH /api/admin/profiles/{userId}/friend-request` on change; optimistic UI update; `data-testid="friend-request-toggle-{userId}"`
- [x] T065 [US3] Update `POST /api/webhooks/stripe` in `app/api/webhooks/stripe/route.ts`: after `increment_vbucks` succeeds, fetch user profile and call `sendVBucksPurchaseNotificationToAdmin` with admin emails from env var `ADMIN_EMAILS` (comma-separated); log email errors but continue webhook success response
- [x] T066 [US3] Implement admin dashboard page at `app/(admin)/orders/page.tsx`: server component; `auth.protect()` + admin guard (redirect to `/` if not admin); fetch via `getRecentVBucksPurchasers()`; render `<PurchasersPanel>` — pending orders section will be added in Phase 6
- [x] T067 [P] [US3] Update wallet page at `app/(shop)/wallet/page.tsx` to show friend request status banner: if `not_sent` or `pending` — "We'll send you a Fortnite friend request to `{fortnite_username}`. Accept it to unlock the item shop."; if `accepted` and within 48-hour window — "Friend request accepted! Item shop unlocks in `{N}` hours."; if eligible — show nothing extra; use `data-testid="friend-request-status-banner"`

**Checkpoint**: Admin receives emails for V-Bucks purchases; admin can track and manage friend request state per purchaser; users see instructions on wallet page

---

## Phase 6: User Story 4 — Item Shop Access Gate & Order Fulfillment (Priority: P4)

**Goal**: The item shop enforces a gate (friend request must be `accepted` AND 48 hours
must have elapsed). Admin fulfills pending skin orders by gifting them in-game; the
buyer receives an email notification and can track order status in their profile.

**48-hour gate rule**: `profile.friend_request_status = 'accepted'` AND
`now() >= profile.friend_request_accepted_at + INTERVAL '48 hours'`.

**Independent Test**: Set a test profile's `friend_request_accepted_at` to 49 hours ago
and `friend_request_status` to `accepted`. Navigate to `/item-shop` — catalog must be
accessible. Place an order. Sign in as admin, navigate to `/admin/orders`, and mark
the order as gifted — buyer receives email and order status updates.

### Tests for User Story 4

> **Write these tests FIRST and ensure they FAIL before implementation**

- [ ] T068 [P] [US4] Unit test for `services/access-gate.ts` in `__tests__/unit/services/access-gate.test.ts`: `no_username` when fortnite_username null; `friend_request_not_accepted` when status is `not_sent` or `pending`; `waiting_period` when accepted < 48 h ago (includes `hoursRemaining`); `eligible` when accepted >= 48 h ago
- [ ] T069 [P] [US4] Unit test for order placement admin notification in `__tests__/unit/api/orders.test.ts`: `POST /api/orders` success case sends admin email via `sendOrderPlacedNotificationToAdmin`
- [ ] T070 [P] [US4] Unit test for `services/orders.ts` admin functions in `__tests__/unit/services/orders-admin.test.ts`: `getPendingOrders` returns all `status='pending'` rows joined with `fortnite_username`; `fulfillOrder` with `'gifted'` updates status + `resolved_at` + calls `sendOrderFulfilledNotificationToAdmin`; `fulfillOrder` with `'refunded'` calls `increment_vbucks` + updates status + `resolved_at` + calls `sendOrderRefundedNotificationToAdmin`
- [ ] T071 [P] [US4] Unit test for `PATCH /api/admin/orders/[orderId]` in `__tests__/unit/api/admin-orders.test.ts`: 401 unauthenticated, 403 non-admin, 400 invalid status, 404 order not found, 409 order not pending, 200 gifted success (admin email sent), 200 refunded success (balance credit + admin email sent)
- [ ] T072 [P] [US4] E2E test in `__tests__/e2e/admin-fulfillment.spec.ts`: sign in as admin, navigate to `/admin/orders`, see pending order with Fortnite username, mark as gifted, assert status badge changes; verify non-admin receives 403; `data-testid="gift-order-btn"`, `data-testid="refund-order-btn"`

### Implementation for User Story 4

- [ ] T073 [US4] Implement `services/access-gate.ts`: export `canAccessItemShop(profile: Profile): AccessGateResult` where `AccessGateResult = { allowed: boolean; reason: 'no_username' | 'friend_request_not_accepted' | 'waiting_period' | 'eligible'; hoursRemaining?: number }`; add `import 'server-only'` guard
- [ ] T074 [US4] Update item shop page at `app/(shop)/item-shop/page.tsx`: call `canAccessItemShop(profile)` server-side; if not `eligible`, render a full-page gate message appropriate to the reason (`no_username` → set username prompt; `friend_request_not_accepted` → accept friend request instruction; `waiting_period` → "Item shop unlocks in `{N}` hours"); render catalog only when `eligible`
- [ ] T075 [P] [US4] Update item shop detail page at `app/(shop)/item-shop/[offerId]/page.tsx`: call `canAccessItemShop(profile)`; redirect to `/item-shop` if not `eligible` (gate message is shown there — no duplicate UI)
- [ ] T076 [US4] Extend `services/email.ts`: add `sendOrderPlacedNotificationToAdmin(adminEmails: string[], fortniteUsername: string, skinName: string, vbucksCost: number): Promise<void>`, `sendOrderFulfilledNotificationToAdmin(adminEmails: string[], fortniteUsername: string, skinName: string): Promise<void>`, and `sendOrderRefundedNotificationToAdmin(adminEmails: string[], fortniteUsername: string, skinName: string, vbucksRefunded: number): Promise<void>` — send emails to all admin addresses using `resend.emails.send`; log errors server-side, never throw to caller
- [ ] T077 [US4] Extend `services/orders.ts` with admin functions: `getPendingOrders(): Promise<SkinOrderWithUsername[]>` — join `skin_orders` with `profiles` to include `fortnite_username`; `fulfillOrder(orderId: string, status: 'gifted' | 'refunded'): Promise<void>` — validate order is `pending`, update `status` + `resolved_at`, call `increment_vbucks` for `'refunded'`, call appropriate admin notification email function
- [ ] T078 [US4] Implement `PATCH /api/admin/orders/[orderId]` in `app/api/admin/orders/[orderId]/route.ts`: `auth.protect()` → admin check → validate `status` body (`'gifted' | 'refunded'`) → call `fulfillOrder` → return `{ ok: true }`
- [ ] T079 [P] [US4] Create `PendingOrdersTable` server component in `app/(admin)/orders/_components/PendingOrdersTable.tsx`: accept `orders: SkinOrderWithUsername[]` prop; render table with Fortnite username, skin name, V-Bucks cost, created timestamp, and `<OrderActionButtons>` per row
- [ ] T080 [P] [US4] Create `OrderActionButtons` client component in `app/(admin)/orders/_components/OrderActionButtons.tsx`: accept `orderId: string` prop; "Gift" and "Refund" buttons; `PATCH /api/admin/orders/{orderId}`; disable both after action; `data-testid="gift-order-btn"` and `data-testid="refund-order-btn"`
- [ ] T081 [US4] Update `POST /api/orders` in `app/api/orders/route.ts`: after order is successfully created, call `sendOrderPlacedNotificationToAdmin` with admin emails from env var `ADMIN_EMAILS` (comma-separated) and order details; log email errors but continue API success response with 201
- [ ] T082 [US4] Update admin orders page at `app/(admin)/orders/page.tsx`: fetch via `getPendingOrders()`; add pending orders section below purchasers panel; render `<PendingOrdersTable orders={pendingOrders} />`; show `<EmptyState>` when no orders pending
- [ ] T083 [P] [US4] Add order history section to wallet page at `app/(shop)/wallet/page.tsx`: fetch user's `skin_orders` via `supabaseAdmin` ordered by `created_at DESC`; render list with skin name, V-Bucks cost, status badge (pending / gifted / refunded), and `resolved_at` timestamp when set; `data-testid="order-status-{orderId}"`

**Checkpoint**: Full loop functional — admins receive real-time notifications for V-Bucks purchases and orders; users buy V-Bucks, admin manages friend requests, users buy items once eligible, admin gifts items

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Shared UI, edge case handling, and final validation

- [ ] T084 [P] Create shared UI components in `components/ui/`: `LoadingSpinner.tsx`, `ErrorMessage.tsx` (accept `message: string`), `EmptyState.tsx` (accept `message: string`) — used by catalog, order history, admin dashboard
- [ ] T085 [P] Create landing page at `app/page.tsx`: redirect authenticated users to `/wallet`; show sign-in / sign-up links for unauthenticated visitors
- [ ] T086 [P] Unit test for `lib/vbucks-packs.ts` in `__tests__/unit/lib/vbucks-packs.test.ts`: all four packs present, prices in cents, `getPackById` returns correct pack and undefined for unknown id
- [ ] T087 [P] E2E test: auth flows in `__tests__/e2e/auth.spec.ts` — sign up new account, sign in, sign out; protected routes redirect unauthenticated users
- [ ] T088 Audit all interactive elements for `data-testid` attributes — ensure `vbucks-balance`, `buy-pack-{packId}`, `buy-skin-btn`, `order-status-{orderId}`, `gift-order-btn`, `refund-order-btn`, `fortnite-username-input`, `fortnite-username-submit`, `friend-request-toggle-{userId}`, `friend-request-status-banner` are all present; fix any gaps
- [ ] T089 Add `try/catch` and loading state reset (`finally` block) to all client components that call API routes (`BuySkinButton`, `BuyVBucksSection`, `FortniteUsernameForm`, `OrderActionButtons`, `FriendRequestToggle`) — test that buttons re-enable after errors
- [ ] T090 Run quickstart.md validation: follow steps 6–8 end-to-end in development to confirm full purchase + friend request + fulfillment flow works; verify admin receives emails for vbucks purchases and skin orders; fix any issues found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Requires Foundational — no dependency on US2/US3/US4
- **US2 (Phase 4)**: Requires Foundational — no dependency on US1/US3/US4 (T053 extends wallet page after US1 checkpoint)
- **US3 (Phase 5)**: Requires Foundational + T054 migration; T056 updates existing checkout route from Phase 3
- **US4 (Phase 6)**: Requires Phase 5 complete (access gate reads `friend_request_accepted_at`); T075 extends `services/orders.ts` from T045
- **Polish (Phase 7)**: Requires all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2
- **US2 (P2)**: Can start after Phase 2; T053 extends wallet page from T036 (add after US1 checkpoint)
- **US3 (P3)**: Requires T054 migration; T056 patches the checkout route from US1
- **US4 (P4)**: Requires US3 complete (access gate reads `friend_request_accepted_at`); fulfillOrder extends T045

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
- Phase 5 T057–T059 (tests) can all run in parallel; T060–T067 (impl) can run in parallel after tests
- Phase 6 T068–T072 (tests) can all run in parallel; T073–T083 (impl) can run in parallel after tests

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
4. US3 complete → Admin tracks friend requests; users see status
5. US4 complete → Full loop: access gate enforced, admin gifts items
6. Polish → Production-ready

### Parallel Team Strategy

With 3 developers (after Phase 2 complete):
- Developer A: User Story 1 (payments) + User Story 3 (admin/friend requests)
- Developer B: User Story 2 (catalog + orders)
- Developer C: User Story 4 (access gate + order fulfillment)

---

## Notes

- `[P]` = different files, no in-flight dependencies — safe to parallelize
- `[Story]` label maps task to user story for independent delivery tracking
- Tests MUST fail before implementation begins
- Always reset loading state in `finally` — test buttons re-enable on error
- `lib/supabase/admin.ts` MUST only be imported in `app/api/**` — never in components
- `services/` files MUST start with `import 'server-only'`
- Money amounts in cents throughout — never floats
- `friend_request_accepted_at` is always set/cleared atomically with `friend_request_status` — never let them drift
- Commit after each completed checkpoint
