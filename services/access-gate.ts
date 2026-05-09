import 'server-only';
import type { Profile } from '@/types';

export type AccessGateResult =
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'no_username' }
  | { allowed: false; reason: 'awaiting_friend_request' }
  | { allowed: false; reason: 'friend_request_not_accepted' }
  | { allowed: false; reason: 'waiting_period'; hoursRemaining: number; minutesRemaining: number }
  | { allowed: true; reason: 'eligible' };

const GATE_HOURS = 48;

export function canAccessItemShop(profile: Profile | null): AccessGateResult {
  if (!profile) {
    return { allowed: false, reason: 'unauthenticated' };
  }

  if (!profile.fortnite_username || profile.fortnite_username.trim() === '') {
    return { allowed: false, reason: 'no_username' };
  }

  if (profile.friend_request_status === 'not_sent') {
    return { allowed: false, reason: 'awaiting_friend_request' };
  }

  if (profile.friend_request_status === 'pending') {
    return { allowed: false, reason: 'friend_request_not_accepted' };
  }

  // Status is 'accepted' — check the 48-hour window.
  // friend_request_accepted_at should always be set when status = 'accepted',
  // but treat a missing timestamp conservatively as still waiting.
  if (!profile.friend_request_accepted_at) {
    return { allowed: false, reason: 'waiting_period', hoursRemaining: GATE_HOURS, minutesRemaining: 0 };
  }

  const acceptedAt = new Date(profile.friend_request_accepted_at).getTime();
  const elapsedMs = Date.now() - acceptedAt;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  if (elapsedHours < GATE_HOURS) {
    const remainingHours = GATE_HOURS - elapsedHours;
    // Ceil to the nearest minute so we never show "0 remaining" before the gate opens.
    const totalMinutes = Math.max(1, Math.ceil(remainingHours * 60));
    const hoursRemaining = Math.floor(totalMinutes / 60);
    const minutesRemaining = totalMinutes % 60;
    return { allowed: false, reason: 'waiting_period', hoursRemaining, minutesRemaining };
  }

  return { allowed: true, reason: 'eligible' };
}
