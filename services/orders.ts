import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getProfile } from '@/services/wallet';
import { canAccessItemShop } from '@/services/access-gate';
import { fetchShopEntries } from '@/services/skins';
import {
  sendOrderFulfilledNotificationToAdmin,
  sendOrderRefundedNotificationToAdmin,
} from '@/services/email';
import type { SkinOrder, SkinOrderWithUsername } from '@/types';

/**
 * Outcome of a `createOrder` call. The discriminated `ok` flag lets the
 * route handler map every variant to a single HTTP status code without
 * inspecting service internals.
 */
export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      skinName: string;
      vbucksCost: number;
      remainingBalance: number;
    }
  | { ok: false; reason: 'USERNAME_NOT_SET' }
  | { ok: false; reason: 'ACCESS_GATE_BLOCKED' }
  | { ok: false; reason: 'SKIN_NOT_FOUND' }
  | {
      ok: false;
      reason: 'INSUFFICIENT_BALANCE';
      balance: number;
      cost: number;
    }
  | { ok: false; reason: 'DB_ERROR' };

// Postgres SQLSTATE 23514 is the canonical "check_violation" — raised when
// the `vbucks_balance >= 0` constraint refuses a debit. Matching on the
// code (not the message) keeps the mapping locale-stable.
const CHECK_VIOLATION_CODE = '23514';

/**
 * Place a skin order on behalf of a user.
 *
 * Validation order (auth-first, validate-second, mutate-third):
 *   1. Read profile — run the full access gate (username set, friend
 *      request accepted, 48-hour waiting period elapsed).
 *   2. Look up the skin in the live shop catalog.
 *   3. Sanity-check the buyer's balance against the shop price.
 *   4. Call the atomic `buy_skin` RPC, which deducts the balance and
 *      inserts the `skin_orders` row in a single Postgres transaction.
 *
 * The pre-balance-check is best-effort: the authoritative gate is the
 * Postgres CHECK constraint, which the RPC surfaces as SQLSTATE 23514.
 * That race-window error is mapped back to `INSUFFICIENT_BALANCE` so the
 * route handler always returns a consistent HTTP code.
 */
export async function createOrder(
  userId: string,
  offerId: string,
): Promise<CreateOrderResult> {
  const profile = await getProfile(userId);
  const gate = canAccessItemShop(profile);

  if (!gate.allowed) {
    if (gate.reason === 'no_username') {
      return { ok: false, reason: 'USERNAME_NOT_SET' };
    }
    return { ok: false, reason: 'ACCESS_GATE_BLOCKED' };
  }

  const entries = await fetchShopEntries();
  const entry = entries.find((e) => e.offerId === offerId);

  if (!entry) {
    return { ok: false, reason: 'SKIN_NOT_FOUND' };
  }

  if (profile.vbucks_balance < entry.vbucks_cost) {
    return {
      ok: false,
      reason: 'INSUFFICIENT_BALANCE',
      balance: profile.vbucks_balance,
      cost: entry.vbucks_cost,
    };
  }

  const { data, error } = await supabaseAdmin.rpc('buy_skin', {
    p_user_id: userId,
    p_skin_id: entry.offerId,
    p_skin_name: entry.name,
    p_vbucks_cost: entry.vbucks_cost,
  });

  if (error) {
    if (error.code === CHECK_VIOLATION_CODE) {
      return {
        ok: false,
        reason: 'INSUFFICIENT_BALANCE',
        balance: profile.vbucks_balance,
        cost: entry.vbucks_cost,
      };
    }
    console.error('[services/orders] buy_skin RPC failed', error.message);
    return { ok: false, reason: 'DB_ERROR' };
  }

  if (typeof data !== 'string' || data.length === 0) {
    console.error('[services/orders] buy_skin returned no orderId');
    return { ok: false, reason: 'DB_ERROR' };
  }

  return {
    ok: true,
    orderId: data,
    skinName: entry.name,
    vbucksCost: entry.vbucks_cost,
    remainingBalance: profile.vbucks_balance - entry.vbucks_cost,
  };
}

export async function getAllOrders(userId: string): Promise<SkinOrder[]> {
  const { data, error } = await supabaseAdmin
    .from('skin_orders')
    .select('id, user_id, skin_id, skin_name, vbucks_cost, status, created_at, resolved_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[services/orders] getAllOrders failed', error.message);
    return [];
  }
  return (data ?? []) as SkinOrder[];
}

export async function getPendingOrders(): Promise<SkinOrderWithUsername[]> {
  const { data: orders, error } = await supabaseAdmin
    .from('skin_orders')
    .select('id, user_id, skin_id, skin_name, vbucks_cost, status, created_at, resolved_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[services/orders] getPendingOrders failed', error.message);
    return [];
  }
  if (!orders || orders.length === 0) return [];

  const userIds = [...new Set(orders.map((o: { user_id: string }) => o.user_id))];
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, fortnite_username')
    .in('id', userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; fortnite_username: string | null }) => [
      p.id,
      p.fortnite_username,
    ]),
  );

  return orders.map(
    (order: {
      id: string;
      user_id: string;
      skin_id: string;
      skin_name: string;
      vbucks_cost: number;
      status: string;
      created_at: string;
      resolved_at: string | null;
    }) => ({
      ...order,
      status: order.status as SkinOrderWithUsername['status'],
      fortnite_username: profileMap.get(order.user_id) ?? null,
    }),
  );
}

export async function fulfillOrder(
  orderId: string,
  action: 'gifted' | 'refunded',
): Promise<void> {
  const { data: order, error: fetchError } = await supabaseAdmin
    .from('skin_orders')
    .select('id, status, user_id, vbucks_cost, skin_name')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) throw new Error('Order not found');
  if (order.status !== 'pending') throw new Error('Order is not pending');

  if (action === 'gifted') {
    const { error } = await supabaseAdmin
      .from('skin_orders')
      .update({ status: 'gifted', resolved_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw new Error(error.message);
  } else {
    // refund_order atomically: updates status, credits balance, writes ledger entry.
    const { error } = await supabaseAdmin.rpc('refund_order', { p_order_id: orderId });
    if (error) throw new Error(error.message);
  }

  // Fire admin email non-blocking — errors must not roll back the fulfilled state
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('fortnite_username')
      .eq('id', order.user_id)
      .single();
    const username = profile?.fortnite_username ?? order.user_id;

    if (action === 'gifted') {
      sendOrderFulfilledNotificationToAdmin(adminEmails, username, order.skin_name).catch((err) =>
        console.error('[services/orders] fulfillment email failed', err),
      );
    } else {
      sendOrderRefundedNotificationToAdmin(
        adminEmails,
        username,
        order.skin_name,
        order.vbucks_cost,
      ).catch((err) => console.error('[services/orders] refund email failed', err));
    }
  }
}
