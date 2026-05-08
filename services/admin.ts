import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { FriendRequestStatus, PurchaserWithStatus } from '@/types';

export interface PurchasersPage {
  data: PurchaserWithStatus[];
  total: number;
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
    return { data: [], total: 0 };
  }

  if (!purchases || purchases.length === 0) return { data: [], total: count ?? 0 };

  const userIds = [...new Set(purchases.map((p: { user_id: string }) => p.user_id))];

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, fortnite_username, phone_number, friend_request_status, friend_request_accepted_at')
    .in('id', userIds);

  if (profilesError) {
    console.error('[services/admin] profiles fetch failed', profilesError.message);
    return { data: [], total: count ?? 0 };
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
        vbucks_amount: purchase.vbucks_amount,
        amount_cents: purchase.amount_cents,
        purchased_at: purchase.created_at,
        friend_request_status: (profile?.friend_request_status ?? 'not_sent') as FriendRequestStatus,
        friend_request_accepted_at: profile?.friend_request_accepted_at ?? null,
      };
    },
  );

  return { data, total: count ?? data.length };
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
