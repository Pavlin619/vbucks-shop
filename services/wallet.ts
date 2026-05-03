import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Profile } from '@/types';

/**
 * Idempotent: ensures a profiles row exists for the given Clerk user.
 * Called from the Stripe webhook before crediting V-Bucks, so the
 * increment_vbucks RPC always finds a row to update.
 */
export async function syncProfile(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

/**
 * Fetches the profile row for a given Clerk user. If no row exists yet,
 * one is created (idempotent) before returning — this lets server pages
 * call getProfile on first visit without requiring an explicit /api/user/sync
 * round-trip first.
 */
export async function getProfile(userId: string): Promise<Profile> {
  await syncProfile(userId);

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, fortnite_username, vbucks_balance, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}
