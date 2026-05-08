import type { FriendRequestStatus } from '@/types/profile';
import type { SkinOrder } from '@/types/orders';

export interface PurchaserWithStatus {
  purchase_id: string;
  user_id: string;
  fortnite_username: string | null;
  phone_number: string | null;
  vbucks_amount: number;
  amount_cents: number;
  purchased_at: string;
  friend_request_status: FriendRequestStatus;
  friend_request_accepted_at: string | null;
}

export interface SkinOrderWithUsername extends SkinOrder {
  fortnite_username: string | null;
}
