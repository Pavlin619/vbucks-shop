export type WalletTransactionType = 'stripe_credit' | 'skin_purchase' | 'refund';

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: WalletTransactionType;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}
