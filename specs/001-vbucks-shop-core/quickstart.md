# Quickstart: VBucks Shop Core System

**Feature**: 001-vbucks-shop-core
**Date**: 2026-04-17

A step-by-step guide to get the full system running locally from scratch.

---

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase CLI (`npm install -g supabase`)
- Stripe CLI (`brew install stripe/stripe-cli/stripe`)
- A Clerk account with a Next.js application created
- A Stripe account (test mode)
- A Resend account

---

## 1. Clone and install

```bash
git clone <repo-url>
cd vbucks-shop
npm install
```

---

## 2. Environment variables

Copy the example and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/wallet
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/wallet

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Admin
ADMIN_USER_IDS=user_clerk_id_1,user_clerk_id_2

# App URL (for Stripe redirect URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Database setup

Start Supabase locally (or use a remote project):

```bash
supabase start
```

Run migrations:

```bash
supabase db push
```

Verify tables exist:

```bash
supabase db diff  # should show no diff after migrations apply
```

---

## 4. Start the development server

```bash
npm run dev
```

App is available at `http://localhost:3000`.

---

## 5. Forward Stripe webhooks (local development)

In a separate terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed webhook signing secret into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## 6. Validate the V-Bucks purchase flow

1. Sign up at `http://localhost:3000/sign-up`.
2. After sign-in, the app calls `POST /api/user/sync` automatically.
3. Navigate to `/wallet`.
4. Click "Buy V-Bucks" and select a pack.
5. Complete the Stripe test checkout with card `4242 4242 4242 4242`, any future expiry,
   any CVC.
6. Return to `/wallet` — balance should reflect the purchased V-Bucks.
7. Check the `purchases` table in Supabase to confirm the ledger row.

---

## 7. Validate the skin order flow

1. Set your Fortnite username at `/wallet` (required before ordering).
2. Navigate to `/skins`.
3. Select any skin and click "Buy with V-Bucks".
4. Confirm the order — balance decreases, order appears at `/wallet` as "pending".

---

## 8. Validate the admin fulfillment flow

1. Ensure your Clerk user ID is in `ADMIN_USER_IDS`.
2. Navigate to `/admin/orders`.
3. Find the pending order from step 7 and click "Mark as Gifted".
4. Confirm the order status changes to "gifted" and the buyer receives a
   notification email (check Resend logs in development).

---

## 9. Run the test suite

Unit tests:

```bash
npm run test:run
```

E2E tests (requires a running dev server):

```bash
npm run test:e2e
```

---

## Common Issues

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Webhook returns 400 | Wrong `STRIPE_WEBHOOK_SECRET` | Copy secret from `stripe listen` output |
| Balance not updating | Webhook not forwarded | Ensure `stripe listen` is running |
| `/admin/orders` returns 403 | User ID not in `ADMIN_USER_IDS` | Add your Clerk user ID to the env var |
| Skin purchase blocked | `fortnite_username` not set | Set username at `/wallet` first |
| Supabase 42501 error | RLS policy violation | Ensure admin routes use `supabaseAdmin` client |
