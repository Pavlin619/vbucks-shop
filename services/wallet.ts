import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Profile } from '@/types';

export async function syncProfile(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, fortnite_username, vbucks_balance, friend_request_status, friend_request_accepted_at, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}
