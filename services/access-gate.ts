import 'server-only';
import type { Profile } from '@/types';

export type AccessGateResult =
  | { allowed: false; reason: 'unauthenticated' }
  | { allowed: false; reason: 'no_username' }
  | { allowed: false; reason: 'awaiting_friend_request' }
  | { allowed: false; reason: 'friend_request_not_accepted' }
  | { allowed: false; reason: 'waiting_period'; hoursRemaining: number; minutesRemaining: number }
  | { allowed: false; reason: 'shop_closed'; minutesUntilOpen: number }
  | { allowed: true; reason: 'eligible' };

const GATE_HOURS = 48;
// Shop closes at 23:00 UTC (01:00 Sofia, EET/UTC+2) and reopens at 01:00 UTC
// (03:00 Sofia), giving admin 2 hours to gift pending orders before the
// Fortnite shop refreshes. The window crosses midnight UTC, so both branches
// of the hour check are needed.
const CLOSE_HOUR_UTC = 23;
const OPEN_HOUR_UTC = 1;

function shopClosedWindow(now: Date = new Date()): { closed: boolean; minutesUntilOpen: number } {
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // Closed window spans midnight: [23:00, 01:00) UTC.
  const closed = hour >= CLOSE_HOUR_UTC || hour < OPEN_HOUR_UTC;
  if (!closed) {
    return { closed: false, minutesUntilOpen: 0 };
  }

  const minutesToOpen =
    hour >= CLOSE_HOUR_UTC
      ? (24 - hour) * 60 - minute + OPEN_HOUR_UTC * 60
      : (OPEN_HOUR_UTC - hour) * 60 - minute;

  return { closed: true, minutesUntilOpen: Math.max(1, minutesToOpen) };
}

export function canAccessItemShop(profile: Profile | null, now?: Date): AccessGateResult {
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

  // User is fully eligible — enforce the nightly closing window.
  const { closed, minutesUntilOpen } = shopClosedWindow(now);
  if (closed) {
    return { allowed: false, reason: 'shop_closed', minutesUntilOpen };
  }

  return { allowed: true, reason: 'eligible' };
}
