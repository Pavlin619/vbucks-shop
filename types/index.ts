export type OrderStatus = 'pending' | 'gifted' | 'refunded';

export interface Profile {
  id: string;
  fortnite_username: string | null;
  vbucks_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  stripe_session_id: string;
  vbucks_amount: number;
  amount_cents: number;
  created_at: string;
}

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

export interface Skin {
  id: string;
  name: string;
  image_url: string;
  rarity: string;
  vbucks_cost: number;
}

export interface VBucksPack {
  id: string;
  vbucks: number;
  price_cents: number;
  label: string;
}
