# Auth

Clerk is the single auth provider. Supabase is NOT used for auth.
The Clerk userId is the primary key in the `profiles` table.

## Route protection
- All routes protected by default via [`middleware.ts`](../middleware.ts).
- Public routes: `/`, `/cart`, `/sign-in`, `/sign-up`, `/api/webhooks/*`.
- Admin routes (`/admin`, `/api/admin/*`) — when implemented, gate via `assertAdmin(userId)` that checks `userId` against `ADMIN_USER_IDS` (comma-separated Clerk user IDs in env). Not yet implemented; the env var is reserved.
- Middleware behaviour for unauthenticated callers:
  - **Pages**: redirect to Clerk sign-in (preserves return-to URL).
  - **API routes**: respond `401 { error: 'Unauthorized' }` (we override Clerk's default `404`; nothing in this app needs route obscurity).

## Profile bootstrap
There is no explicit `/api/user/sync` route. Profiles are upserted on first read by [`getProfile`](../services/wallet.ts) (`INSERT ... ON CONFLICT (id) DO NOTHING`), so any server component or service that needs the profile can call `getProfile(userId)` on first visit and get back a row.

## Rules
- Server Components and route handlers: use `await auth.protect()` from `@clerk/nextjs/server`. It throws (Next renders 404 / NEXT_NOT_FOUND) if unauthenticated and narrows `userId` to a non-null string. **Never** hand-roll `if (!userId) return 401` — that path is unreachable under the current middleware contract.
- Client components: use `useUser()` from `@clerk/nextjs`. For fetches against protected APIs, branch on `res.status === 401` and redirect to `/sign-in` (handles session-expiry mid-flow — see [`use-place-order.ts`](../app/(shop)/item-shop/[offerId]/_lib/use-place-order.ts) and [`use-checkout.ts`](../app/(shop)/cart/_lib/use-checkout.ts)).
- Fortnite username must be set before a skin can be purchased — enforced in `services/orders.ts` (returns `{ ok: false, reason: 'USERNAME_NOT_SET' }` → 422).
