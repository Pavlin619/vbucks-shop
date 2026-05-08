export type FriendRequestStatus = 'not_sent' | 'pending' | 'accepted';

export interface Profile {
  id: string;
  fortnite_username: string | null;
  phone_number: string | null;
  vbucks_balance: number;
  friend_request_status: FriendRequestStatus;
  friend_request_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}
