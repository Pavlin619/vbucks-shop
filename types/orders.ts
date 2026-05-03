export type OrderStatus = 'pending' | 'gifted' | 'refunded';

export interface SkinOrder {
  id: string;
  user_id: string;
  skin_id: string;
  skin_name: string;
  vbucks_cost: number;
  status: OrderStatus;
  created_at: string;
  resolved_at: string | null;
}
