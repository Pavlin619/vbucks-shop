import { describe, it, expect } from 'vitest';
import { canAccessItemShop } from '@/services/access-gate';
import type { Profile } from '@/types';

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user_123',
    fortnite_username: 'TestPlayer',
    phone_number: null,
    vbucks_balance: 0,
    friend_request_status: 'not_sent',
    friend_request_accepted_at: null,
    fortnite_username_set_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

// 10:00 AM Sofia (UTC+2 winter) — shop is open, safe to use in eligible assertions.
const OPEN_TIME = new Date('2026-01-15T08:00:00Z');
// 01:30 AM Sofia (UTC+2 winter) — inside the 01:00–03:00 closed window.
const CLOSED_TIME = new Date('2026-01-14T23:30:00Z');
// 02:59 AM Sofia (UTC+2 winter) — last minute before reopening.
const CLOSED_TIME_NEAR_END = new Date('2026-01-15T00:59:00Z');
// Exactly 03:00 AM Sofia (UTC+2 winter) — shop should be open again.
const REOPEN_TIME = new Date('2026-01-15T01:00:00Z');
// 00:59 AM Sofia (UTC+2 winter) — just before the closed window starts.
const BEFORE_CLOSE_TIME = new Date('2026-01-14T22:59:00Z');

describe('canAccessItemShop', () => {
  it('returns unauthenticated when profile is null', () => {
    const result = canAccessItemShop(null);
    expect(result).toEqual({ allowed: false, reason: 'unauthenticated' });
  });

  it('returns no_username when fortnite_username is null', () => {
    const result = canAccessItemShop(makeProfile({ fortnite_username: null }));
    expect(result).toEqual({ allowed: false, reason: 'no_username' });
  });

  it('returns no_username when fortnite_username is empty string', () => {
    const result = canAccessItemShop(makeProfile({ fortnite_username: '   ' }));
    expect(result).toEqual({ allowed: false, reason: 'no_username' });
  });

  it('returns awaiting_friend_request when status is not_sent', () => {
    const result = canAccessItemShop(
      makeProfile({ friend_request_status: 'not_sent' }),
    );
    expect(result).toEqual({ allowed: false, reason: 'awaiting_friend_request' });
  });

  it('returns friend_request_not_accepted when status is pending', () => {
    const result = canAccessItemShop(
      makeProfile({ friend_request_status: 'pending' }),
    );
    expect(result).toEqual({ allowed: false, reason: 'friend_request_not_accepted' });
  });

  it('returns waiting_period with hoursRemaining and minutesRemaining when accepted < 48 h ago', () => {
    const result = canAccessItemShop(
      makeProfile({
        friend_request_status: 'accepted',
        friend_request_accepted_at: hoursAgo(10),
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('waiting_period');
    if (result.reason === 'waiting_period') {
      expect(result.hoursRemaining).toBeGreaterThanOrEqual(0);
      expect(result.hoursRemaining).toBeLessThanOrEqual(38);
      expect(result.minutesRemaining).toBeGreaterThanOrEqual(0);
      expect(result.minutesRemaining).toBeLessThan(60);
    }
  });

  it('returns minutesRemaining of 1 and hoursRemaining of 0 when only seconds remain', () => {
    const result = canAccessItemShop(
      makeProfile({
        friend_request_status: 'accepted',
        friend_request_accepted_at: hoursAgo(47.99),
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('waiting_period');
    if (result.reason === 'waiting_period') {
      expect(result.hoursRemaining).toBe(0);
      expect(result.minutesRemaining).toBe(1);
    }
  });

  it('returns eligible when accepted >= 48 h ago', () => {
    const result = canAccessItemShop(
      makeProfile({
        friend_request_status: 'accepted',
        friend_request_accepted_at: hoursAgo(49),
      }),
      OPEN_TIME,
    );
    expect(result).toEqual({ allowed: true, reason: 'eligible' });
  });

  it('returns eligible when accepted exactly 48 h ago', () => {
    const result = canAccessItemShop(
      makeProfile({
        friend_request_status: 'accepted',
        friend_request_accepted_at: hoursAgo(48),
      }),
      OPEN_TIME,
    );
    expect(result).toEqual({ allowed: true, reason: 'eligible' });
  });

  describe('shop_closed window (01:00–03:00 Sofia time)', () => {
    const eligibleProfile = makeProfile({
      friend_request_status: 'accepted',
      friend_request_accepted_at: hoursAgo(49),
    });

    it('returns shop_closed during the closed window', () => {
      const result = canAccessItemShop(eligibleProfile, CLOSED_TIME);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('shop_closed');
      if (result.reason === 'shop_closed') {
        expect(result.minutesUntilOpen).toBeGreaterThan(0);
        expect(result.minutesUntilOpen).toBeLessThanOrEqual(120);
      }
    });

    it('returns shop_closed with 1 minute remaining at 02:59', () => {
      const result = canAccessItemShop(eligibleProfile, CLOSED_TIME_NEAR_END);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('shop_closed');
      if (result.reason === 'shop_closed') {
        expect(result.minutesUntilOpen).toBe(1);
      }
    });

    it('returns eligible at exactly 03:00 Sofia time', () => {
      const result = canAccessItemShop(eligibleProfile, REOPEN_TIME);
      expect(result).toEqual({ allowed: true, reason: 'eligible' });
    });

    it('returns eligible at 00:59 Sofia time (before the window opens)', () => {
      const result = canAccessItemShop(eligibleProfile, BEFORE_CLOSE_TIME);
      expect(result).toEqual({ allowed: true, reason: 'eligible' });
    });

    it('does not return shop_closed for ineligible users', () => {
      const result = canAccessItemShop(
        makeProfile({ friend_request_status: 'pending' }),
        CLOSED_TIME,
      );
      expect(result.reason).toBe('friend_request_not_accepted');
    });
  });

  it('returns friend_request_not_accepted (not waiting_period) when status is pending even if timestamp is set', () => {
    // Status drives the gate; a stale timestamp must not override it.
    const result = canAccessItemShop(
      makeProfile({
        friend_request_status: 'pending',
        friend_request_accepted_at: hoursAgo(50),
      }),
    );
    expect(result).toEqual({ allowed: false, reason: 'friend_request_not_accepted' });
  });

  it('returns awaiting_friend_request (not waiting_period) when status is not_sent even if timestamp is set', () => {
    const result = canAccessItemShop(
      makeProfile({
        friend_request_status: 'not_sent',
        friend_request_accepted_at: hoursAgo(50),
      }),
    );
    expect(result).toEqual({ allowed: false, reason: 'awaiting_friend_request' });
  });
});
