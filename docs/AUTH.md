# Auth

Clerk is the single auth provider. Supabase is NOT used for auth.
Clerk userId is the primary key in the `profiles` table.

## Route protection
- All routes protected by default via `middleware.ts`
- Public routes: `/`, `/sign-in`, `/sign-up`, `/api/webhooks/*`
- Admin routes (`/admin`, `/api/admin/*`): check userId against `ADMIN_USER_IDS` env var (comma-separated list of Clerk user IDs)

## User sync
On first login, call `POST /api/user/sync` to upsert the profiles row.
Triggered client-side once Clerk reports `isSignedIn === true`.

## Rules
- Server components: use `auth()` from `@clerk/nextjs/server`
- Client components: use `useUser()` from `@clerk/nextjs`
- Always null-check userId — middleware protects routes but API routes must also validate
- Fortnite username must be set before a skin can be purchased — enforce in `buy-skin` API route