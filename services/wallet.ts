import { supabaseAdmin } from '@/lib/supabase/admin';

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
