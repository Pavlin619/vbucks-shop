import { createClient } from '@supabase/supabase-js';
import { getE2ECreds } from './env';

interface SeedProfileInput {
  /** Override the Clerk user id; defaults to E2E_CLERK_USER_ID. */
  userId?: string;
  /** Fortnite username to set; pass `null` to clear it. */
  fortniteUsername?: string | null;
  /** V-Bucks balance to set on the row. */
  vbucksBalance: number;
}

/**
 * Direct-write the test user's profile row via Supabase admin so the
 * detail-page server component sees a deterministic state. Bypasses RLS
 * by design — these helpers are only ever called from the E2E suite,
 * where the service-role key is loaded from `.env.local`.
 *
 * Throws (failing the test) if the credentials aren't available so a
 * misconfigured run is loud, not silently skipped.
 */
export async function seedProfile(input: SeedProfileInput): Promise<void> {
  const creds = getE2ECreds();
  if (!creds) {
    throw new Error(
      'seedProfile called without E2E credentials configured. ' +
        'Set E2E_CLERK_USER_* and SUPABASE_SERVICE_ROLE_KEY before running.',
    );
  }

  const userId = input.userId ?? creds.clerkUserId;
  const supabase = createClient(creds.supabaseUrl, creds.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        fortnite_username: input.fortniteUsername ?? null,
        vbucks_balance: input.vbucksBalance,
      },
      { onConflict: 'id' },
    );

  if (error) {
    throw new Error(`seedProfile failed: ${error.message}`);
  }
}

/**
 * Best-effort cleanup: revert the test user's profile to a harmless state
 * after a spec runs. Doesn't throw on failure — the next test's
 * `seedProfile` call will overwrite anyway.
 */
export async function resetProfile(): Promise<void> {
  try {
    await seedProfile({ vbucksBalance: 0, fortniteUsername: null });
  } catch (err) {
    console.warn('[e2e] resetProfile failed (non-fatal):', err);
  }
}
