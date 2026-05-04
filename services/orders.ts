import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getProfile } from '@/services/wallet';
import { fetchShopEntries } from '@/services/skins';

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
 *   1. Read profile — confirm a Fortnite username is linked.
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

  if (!profile.fortnite_username || profile.fortnite_username.trim() === '') {
    return { ok: false, reason: 'USERNAME_NOT_SET' };
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
