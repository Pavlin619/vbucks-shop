import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Profile } from '@/types';

export async function syncProfile(userId: string, phoneNumber?: string | null): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, phone_number: phoneNumber ?? null }, { onConflict: 'id', ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

export async function updatePhoneNumber(userId: string, phoneNumber: string | null): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ phone_number: phoneNumber })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

export async function updateFortniteUsername(userId: string, username: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ fortnite_username: username, fortnite_username_set_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, fortnite_username, phone_number, vbucks_balance, friend_request_status, friend_request_accepted_at, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}
