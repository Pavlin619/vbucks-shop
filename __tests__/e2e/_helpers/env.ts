/**
 * Environment-variable accessors for the E2E suite.
 *
 * The buy-skin specs need real credentials: a Clerk test user and the
 * Supabase service-role key (so we can seed the user's profile with a
 * known V-Bucks balance and Fortnite username). To keep CI green for
 * contributors who don't have these credentials, every spec checks
 * `hasE2ECreds()` and skips when anything is missing.
 *
 * Required vars (see `.env.example` for documentation):
 *   - E2E_CLERK_USER_USERNAME
 *   - E2E_CLERK_USER_PASSWORD
 *   - E2E_CLERK_USER_ID
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

export interface E2ECreds {
  clerkUsername: string;
  clerkPassword: string;
  clerkUserId: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export function getE2ECreds(): E2ECreds | null {
  const clerkUsername = process.env.E2E_CLERK_USER_USERNAME;
  const clerkPassword = process.env.E2E_CLERK_USER_PASSWORD;
  const clerkUserId = process.env.E2E_CLERK_USER_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !clerkUsername ||
    !clerkPassword ||
    !clerkUserId ||
    !supabaseUrl ||
    !supabaseServiceKey
  ) {
    return null;
  }

  return {
    clerkUsername,
    clerkPassword,
    clerkUserId,
    supabaseUrl,
    supabaseServiceKey,
  };
}

/** Cheap predicate for `test.skip(!hasE2ECreds(), ...)`. */
export function hasE2ECreds(): boolean {
  return getE2ECreds() !== null;
}
