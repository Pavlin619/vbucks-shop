import 'server-only';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { FriendRequestEntry, FriendRequestStatus, PurchaserWithStatus } from '@/types';

const STATUS_ORDER: Record<FriendRequestStatus, number> = { not_sent: 0, pending: 1, accepted: 2 };

export interface PurchasersPage {
  data: PurchaserWithStatus[];
  total: number;
  dbError: boolean;
}

export async function getRecentVBucksPurchasers({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}): Promise<PurchasersPage> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: purchases, error: purchasesError, count } = await supabaseAdmin
    .from('purchases')
    .select('id, user_id, vbucks_amount, amount_cents, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (purchasesError) {
    console.error('[services/admin] getRecentVBucksPurchasers failed', purchasesError.message);
    return { data: [], total: 0, dbError: true };
  }

  if (!purchases || purchases.length === 0) return { data: [], total: count ?? 0, dbError: false };

  const userIds = [...new Set(purchases.map((p: { user_id: string }) => p.user_id))];

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, fortnite_username, phone_number, friend_request_status, friend_request_accepted_at')
    .in('id', userIds);

  if (profilesError) {
    console.error('[services/admin] profiles fetch failed', profilesError.message);
    return { data: [], total: count ?? 0, dbError: true };
  }

  const profileMap = new Map(
    (profiles ?? []).map(
      (p: {
        id: string;
        fortnite_username: string | null;
        phone_number: string | null;
        friend_request_status: FriendRequestStatus;
        friend_request_accepted_at: string | null;
      }) => [p.id, p],
    ),
  );

  const clerk = await clerkClient();
  const { data: clerkUsers } = await clerk.users.getUserList({ userId: userIds, limit: userIds.length });
  const emailMap = new Map(
    clerkUsers.map((u) => [u.id, u.emailAddresses[0]?.emailAddress ?? null]),
  );

  const data = purchases.map(
    (purchase: {
      id: string;
      user_id: string;
      vbucks_amount: number;
      amount_cents: number;
      created_at: string;
    }) => {
      const profile = profileMap.get(purchase.user_id);
      return {
        purchase_id: purchase.id,
        user_id: purchase.user_id,
        fortnite_username: profile?.fortnite_username ?? null,
        phone_number: profile?.phone_number ?? null,
        email: emailMap.get(purchase.user_id) ?? null,
        vbucks_amount: purchase.vbucks_amount,
        amount_cents: purchase.amount_cents,
        purchased_at: purchase.created_at,
        friend_request_status: (profile?.friend_request_status ?? 'not_sent') as FriendRequestStatus,
        friend_request_accepted_at: profile?.friend_request_accepted_at ?? null,
      };
    },
  );

  return { data, total: count ?? data.length, dbError: false };
}

export async function getFriendRequestQueue(): Promise<{
  data: FriendRequestEntry[];
  dbError: boolean;
}> {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, fortnite_username, phone_number, friend_request_status, friend_request_accepted_at, fortnite_username_set_at')
    .not('fortnite_username', 'is', null);

  if (error) {
    console.error('[services/admin] getFriendRequestQueue failed', error.message);
    return { data: [], dbError: true };
  }

  if (!profiles || profiles.length === 0) return { data: [], dbError: false };

  const userIds = profiles.map((p: { id: string }) => p.id);

  const clerk = await clerkClient();
  const { data: clerkUsers } = await clerk.users.getUserList({ userId: userIds, limit: userIds.length });
  const emailMap = new Map(
    clerkUsers.map((u) => [u.id, u.emailAddresses[0]?.emailAddress ?? null]),
  );

  const data: FriendRequestEntry[] = profiles.map(
    (p: {
      id: string;
      fortnite_username: string;
      phone_number: string | null;
      friend_request_status: FriendRequestStatus;
      friend_request_accepted_at: string | null;
      fortnite_username_set_at: string | null;
    }) => ({
      user_id: p.id,
      fortnite_username: p.fortnite_username,
      phone_number: p.phone_number,
      email: emailMap.get(p.id) ?? null,
      friend_request_status: (p.friend_request_status ?? 'not_sent') as FriendRequestStatus,
      friend_request_accepted_at: p.friend_request_accepted_at,
      username_set_at: p.fortnite_username_set_at,
    }),
  );

  data.sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.friend_request_status] - STATUS_ORDER[b.friend_request_status];
    if (statusDiff !== 0) return statusDiff;
    if (!a.username_set_at && !b.username_set_at) return 0;
    if (!a.username_set_at) return 1;
    if (!b.username_set_at) return -1;
    return b.username_set_at.localeCompare(a.username_set_at);
  });

  return { data, dbError: false };
}

export interface FlaggedAccount {
  user_id: string;
  fortnite_username: string | null;
  phone_number: string | null;
}

export async function getFlaggedAccounts(): Promise<{ data: FlaggedAccount[]; dbError: boolean }> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, fortnite_username, phone_number')
    .eq('is_flagged', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[services/admin] getFlaggedAccounts failed', error.message);
    return { data: [], dbError: true };
  }

  return {
    data: (data ?? []).map((p: { id: string; fortnite_username: string | null; phone_number: string | null }) => ({
      user_id: p.id,
      fortnite_username: p.fortnite_username,
      phone_number: p.phone_number,
    })),
    dbError: false,
  };
}

export async function getFailedNotificationsCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('failed_notifications')
    .select('id', { count: 'exact', head: true })
    .is('retried_at', null);

  if (error) {
    console.error('[services/admin] getFailedNotificationsCount failed', error.message);
    return 0;
  }
  return count ?? 0;
}

export async function updateFriendRequestStatus(
  userId: string,
  status: FriendRequestStatus,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      friend_request_status: status,
      friend_request_accepted_at: status === 'accepted' ? new Date().toISOString() : null,
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}
