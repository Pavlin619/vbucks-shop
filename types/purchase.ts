export interface Purchase {
  id: string;
  user_id: string;
  stripe_session_id: string;
  vbucks_amount: number;
  amount_cents: number;
  created_at: string;
}

export interface VBucksPack {
  id: string;
  vbucks: number;
  price_cents: number;
  label: string;
  popular?: boolean;
}
