# Feature Specification: VBucks Shop Core System

**Feature Branch**: `001-vbucks-shop-core`
**Created**: 2026-04-17
**Status**: Draft
**Input**: Full-system specification for the VBucks Shop e-commerce platform

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Buy V-Bucks with Real Money (Priority: P1)

A registered user visits the V-Bucks purchase page, selects a V-Bucks bundle,
completes payment with a credit or debit card, and sees their wallet balance
updated immediately after a successful transaction.

**Why this priority**: All other features depend on users having a V-Bucks balance.
Without this flow working end-to-end, the rest of the platform has no value.

**Independent Test**: A test user can navigate to the purchase page, choose any bundle,
complete a test payment, and confirm the wallet balance on their profile reflects the
credited amount — without needing the skin catalog or order system.

**Acceptance Scenarios**:

1. **Given** a registered, authenticated user with a wallet balance of 0,
   **When** they select a 1,000 V-Bucks bundle and complete payment,
   **Then** their wallet balance shows 1,000 V-Bucks and a credit transaction
   appears in their transaction history.

2. **Given** a payment is initiated and the payment provider confirms success,
   **When** the confirmation event is received more than once (duplicate),
   **Then** the wallet is credited only once and no error is surfaced to the user.

3. **Given** a payment is initiated,
   **When** the confirmation event is delayed or temporarily unavailable,
   **Then** the wallet balance is not updated until confirmation is received, and
   the user sees a "payment pending" status.

4. **Given** a user is not authenticated,
   **When** they attempt to access the purchase page,
   **Then** they are redirected to the sign-in screen.

---

### User Story 2 — Browse Skins and Spend V-Bucks (Priority: P2)

An authenticated user with a sufficient V-Bucks balance browses the skin catalog,
selects a skin, reviews the cost, confirms the purchase, and sees their V-Bucks
balance deducted and an order created in "pending" status awaiting admin fulfillment.

**Why this priority**: This is the core value exchange of the platform — converting
V-Bucks into in-game items. Without this, the product has no purpose.

**Independent Test**: A test user with a pre-loaded wallet can open the catalog, select
a skin, confirm purchase, and verify their balance decreased by the skin's cost while
a new pending order appears in their order history.

**Acceptance Scenarios**:

1. **Given** an authenticated user with 2,800 V-Bucks,
   **When** they select a skin costing 2,000 V-Bucks and confirm the purchase,
   **Then** their wallet shows 800 V-Bucks, a new order appears as "pending", and
   a transaction entry records the deduction.

2. **Given** an authenticated user with 500 V-Bucks,
   **When** they attempt to purchase a skin costing 2,000 V-Bucks,
   **Then** the purchase is blocked with a clear "insufficient balance" message and
   no deduction is made.

3. **Given** a skin is displayed in the catalog,
   **When** a user views the skin detail page,
   **Then** they see the skin name, image, rarity, and V-Bucks cost before
   committing to a purchase.

4. **Given** the external skin catalog source is temporarily unavailable,
   **When** a user opens the catalog,
   **Then** the last successfully fetched catalog is shown (or a graceful empty state)
   and no unhandled error is surfaced.

---

### User Story 3 — Admin Fulfills Skin Orders (Priority: P3)

An admin user logs into the admin dashboard, views all pending skin orders, selects
an order, manually gifts the skin in-game via Fortnite, and then marks the order as
"fulfilled" in the system — triggering a notification to the customer.

**Why this priority**: Fulfillment closes the purchase loop and is necessary for end-
to-end integrity, but the system can accumulate orders while admin capacity is
available. Not a blocker for the core purchase flows.

**Independent Test**: With at least one pending order in the system, an admin can
log into the dashboard, view the order details, mark it as fulfilled, and confirm
the order status changes to "fulfilled" while the buyer receives a notification.

**Acceptance Scenarios**:

1. **Given** an admin user viewing the orders dashboard,
   **When** they mark a pending order as "fulfilled",
   **Then** the order status updates to "fulfilled", a notification is sent to
   the buyer, and the change is timestamped.

2. **Given** an admin user marks an order as "failed",
   **When** the status is saved,
   **Then** the buyer's V-Bucks balance is refunded by the order amount and a
   "failed" notification is sent to the buyer.

3. **Given** a non-admin authenticated user,
   **When** they attempt to access the admin dashboard,
   **Then** they receive an access-denied response and the page is not rendered.

4. **Given** an unauthenticated visitor,
   **When** they attempt to access any admin route,
   **Then** they are redirected to the sign-in screen.

---

### Edge Cases

- What happens when a skin becomes unavailable after an order is created but before
  fulfillment? Admin must still be able to fulfill or fail the order manually; the
  skin's availability state in the catalog does not block order resolution.
- How does the system handle a V-Bucks deduction that fails mid-transaction (e.g.,
  database error)? The order MUST NOT be created and the balance MUST remain
  unchanged — no partial state.
- What if the same user submits a skin order twice in rapid succession for the same
  skin? The system MUST accept both as separate orders (skins are gifted manually,
  so duplicates are a user choice) but MUST deduct balance for each.
- What if the payment confirmation event arrives before the checkout session record
  is fully persisted? The system MUST handle this via idempotent event processing,
  retrying or queuing the credit until the session is available.

---

## Requirements *(mandatory)*

### Functional Requirements

**Wallet & Balance**

- **FR-001**: The system MUST maintain a V-Bucks wallet for every registered user,
  initialised at zero balance on account creation.
- **FR-002**: V-Bucks balance MUST only be modified server-side; client applications
  MUST NOT have direct write access to balance data.
- **FR-003**: Every balance change (credit or debit) MUST produce a corresponding
  transaction record with amount, type, timestamp, and reference ID.
- **FR-004**: Balance reads for display MUST reflect the authoritative server-side
  value; cached or stale values MUST NOT be shown as current balance.

**V-Bucks Purchase (Payment)**

- **FR-005**: The system MUST provide at least two pre-defined V-Bucks bundle options
  with fixed real-money prices.
- **FR-006**: Payment MUST be processed through an external payment provider; card
  details MUST NOT pass through or be stored by the application.
- **FR-007**: Wallet credits MUST only be applied after confirmed payment success from
  the payment provider's server-to-server callback — not on client redirect alone.
- **FR-008**: The payment flow MUST be idempotent: receiving the same confirmed payment
  event more than once MUST credit the wallet exactly once.
- **FR-009**: A payment that is initiated but not confirmed MUST NOT alter the user's
  V-Bucks balance.

**Skin Catalog**

- **FR-010**: The system MUST display a catalog of available Fortnite skins with name,
  image, rarity classification, and V-Bucks cost for each item.
- **FR-011**: Catalog data MUST be fetched from an external source and cached
  server-side; the application MUST degrade gracefully if the external source is
  unavailable, showing the last known catalog.
- **FR-012**: The catalog MUST NOT expose any external API credentials or raw external
  responses to the browser.

**Skin Orders**

- **FR-013**: Users MUST be able to place an order for any skin in the catalog provided
  they have sufficient V-Bucks balance.
- **FR-014**: Placing an order MUST atomically deduct the skin's V-Bucks cost from the
  user's wallet and create an order record in "pending" status; if either step fails
  the entire operation MUST be rolled back.
- **FR-015**: Users MUST be able to view their own order history including status and
  timestamp.
- **FR-016**: Users MUST NOT be able to view or modify another user's orders.

**Admin Fulfillment**

- **FR-017**: An admin MUST be able to view all pending orders, including buyer
  identity, skin requested, and order timestamp.
- **FR-018**: An admin MUST be able to mark any pending order as "fulfilled" or
  "failed".
- **FR-019**: Marking an order as "failed" MUST automatically refund the V-Bucks cost
  to the buyer's wallet and record a credit transaction.
- **FR-020**: Fulfillment and failure events MUST trigger a notification to the buyer.
- **FR-021**: Only users with an admin role MUST be permitted to perform fulfillment
  actions; all other users MUST receive an access-denied response.

**Logging & Audit**

- **FR-022**: All critical actions MUST be logged: payment events (initiated, confirmed,
  duplicate), balance changes, order creations, and admin fulfillment actions.

### Key Entities

- **User**: A registered account linked to an external identity provider. Has a single
  wallet. Can place multiple orders. May optionally hold an admin role.
- **Wallet**: Stores the current V-Bucks balance for one user. Balance is always
  non-negative. Updated only via server-side transactions.
- **Transaction**: An immutable record of a balance change. Types: `topup` (payment
  credit), `purchase` (order debit), `refund` (failed-order credit).
  Attributes: amount, type, reference ID, timestamp, user ID.
- **Skin**: A Fortnite cosmetic item sourced from an external catalog. Attributes:
  external ID, name, image URL, rarity, V-Bucks cost.
- **Order**: A request by a user to receive a specific skin. Attributes: user ID,
  skin reference, V-Bucks cost at time of order, status, created timestamp,
  fulfilled/failed timestamp.
- **Order Status**: Enumeration — `pending`, `fulfilled`, `failed`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a V-Bucks purchase (from bundle selection to confirmed
  balance update) in under 3 minutes on a standard connection.
- **SC-002**: A user's displayed V-Bucks balance is always accurate — zero cases of a
  balance showing an incorrect value after a confirmed transaction.
- **SC-003**: Duplicate payment events result in zero double-credits; verified by
  processing the same event ID more than once in any test scenario.
- **SC-004**: Skin order placement is transactional — zero cases of a balance deduction
  without a corresponding order record, or vice versa.
- **SC-005**: Admin can review all pending orders and mark one as fulfilled or failed
  within 2 minutes of accessing the dashboard.
- **SC-006**: Users receive an order status notification within 60 seconds of an admin
  fulfillment or failure action.
- **SC-007**: The skin catalog degrades gracefully — users see a non-empty catalog
  (last cached version) 100% of the time even when the external source is
  unavailable.
- **SC-008**: Non-admin users are blocked from all admin actions — zero successful
  fulfillment attempts from non-admin accounts in any test scenario.

---

## Assumptions

- Users must create an account and sign in before purchasing V-Bucks or ordering skins;
  guest checkout is out of scope.
- V-Bucks bundles have fixed, pre-configured prices defined at deploy time; dynamic
  pricing is out of scope for v1.
- Admin role is assigned manually (e.g., via the identity provider dashboard) rather
  than through an in-app role management UI, which is out of scope for v1.
- Skin delivery is entirely manual — an admin physically gifts the skin via the
  Fortnite game client; the system only tracks the request and outcome, not the
  delivery mechanics.
- The external Fortnite skin catalog is treated as unreliable; the application is
  responsible for caching and serving the last known good state.
- Refunds are V-Bucks credits only; real-money refunds are out of scope for v1
  (only applicable when the admin marks an order as "failed").
- A single user can place multiple orders for the same skin (repeat purchases are
  allowed by design).
- Payment currency is USD; multi-currency support is out of scope for v1.
- The notification channel for buyers is email; in-app notifications are out of scope.
- Mobile-specific UI optimisation is out of scope; a responsive web layout is
  sufficient for v1.
