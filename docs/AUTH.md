# Auth

Clerk is the single auth provider. Supabase is NOT used for auth.
Clerk userId is the primary key in the `profiles` table.

## Route protection
- All routes protected by default via `middleware.ts`
- Public routes: `/`, `/cart`, `/sign-in`, `/sign-up`, `/api/webhooks/*`
- Admin routes (`/admin`, `/api/admin/*`): check userId against `ADMIN_USER_IDS` env var (comma-separated list of Clerk user IDs)
- Middleware behaviour for unauthenticated callers:
  - **Pages**: redirect to Clerk sign-in (preserves return-to URL)
  - **API routes**: respond `401 { error: 'Unauthorized' }` (we override Clerk's default `404`; nothing in this app needs route obscurity)

## User sync
On first login, call `POST /api/user/sync` to upsert the profiles row.
Triggered client-side once Clerk reports `isSignedIn === true`.

## Rules
- Server Components and route handlers: use `await auth.protect()` from `@clerk/nextjs/server`. It throws (Next renders 404 / NEXT_NOT_FOUND) if unauthenticated and narrows `userId` to a non-null string. **Never** hand-roll `if (!userId) return 401` — that path is unreachable under the new middleware contract.
- Client components: use `useUser()` from `@clerk/nextjs`. For fetches against protected APIs, branch on `res.status === 401` and redirect to `/sign-in` (handles session-expiry mid-flow).
- Fortnite username must be set before a skin can be purchased — enforced in `services/orders.ts` (returns `{ ok: false, reason: 'USERNAME_NOT_SET' }` → 422).