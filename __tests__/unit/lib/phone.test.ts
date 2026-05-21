import { describe, it, expect } from 'vitest';
import { isValidPhone } from '@/lib/phone';

describe('isValidPhone', () => {
  // ── valid formats ────────────────────────────────────────────────────────
  it('accepts Bulgarian international format', () => {
    expect(isValidPhone('+359881234567')).toBe(true);
  });

  it('accepts Bulgarian international with spaces', () => {
    expect(isValidPhone('+359 88 123 4567')).toBe(true);
  });

  it('accepts Bulgarian local format (leading 0)', () => {
    expect(isValidPhone('0881234567')).toBe(true);
  });

  it('accepts US international format with parentheses and dashes', () => {
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
  });

  it('accepts UK format with dashes', () => {
    expect(isValidPhone('+44-20-7946-0958')).toBe(true);
  });

  it('accepts minimal 7-digit number', () => {
    expect(isValidPhone('1234567')).toBe(true);
  });

  it('accepts 15-digit number (E.164 maximum)', () => {
    expect(isValidPhone('123456789012345')).toBe(true);
  });

  it('accepts number with dots as separators', () => {
    expect(isValidPhone('+1.555.123.4567')).toBe(true);
  });

  it('trims surrounding whitespace before validating', () => {
    expect(isValidPhone('  +359881234567  ')).toBe(true);
  });

  // ── too short / too long ─────────────────────────────────────────────────
  it('rejects fewer than 7 digits', () => {
    expect(isValidPhone('123456')).toBe(false);
  });

  it('rejects more than 15 digits', () => {
    expect(isValidPhone('1234567890123456')).toBe(false);
  });

  // ── invalid characters ───────────────────────────────────────────────────
  it('rejects alphabetic characters', () => {
    expect(isValidPhone('abc1234567')).toBe(false);
  });

  it('rejects hash / asterisk (dialpad extras)', () => {
    expect(isValidPhone('+359#1234567')).toBe(false);
    expect(isValidPhone('+359*1234567')).toBe(false);
  });

  it('rejects forward slash', () => {
    expect(isValidPhone('+359/1234567')).toBe(false);
  });

  // ── misplaced + ──────────────────────────────────────────────────────────
  it('rejects + embedded after the first character', () => {
    expect(isValidPhone('359+881234567')).toBe(false);
  });

  it('rejects multiple leading + signs', () => {
    expect(isValidPhone('++359881234567')).toBe(false);
  });

  // ── edge cases ───────────────────────────────────────────────────────────
  it('rejects empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(isValidPhone('   ')).toBe(false);
  });

  it('rejects a lone + sign', () => {
    expect(isValidPhone('+')).toBe(false);
  });
});
