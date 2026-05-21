// Only digits, +, spaces, dashes, dots, and parentheses are permitted.
// + is restricted to the leading position (E.164 country-code prefix).
// Digit count 7–15 follows ITU-T E.164.
const PHONE_CHARS_REGEX = /^[+\d\s\-().]+$/;

export const PHONE_ERROR =
  'Въведете валиден телефонен номер (напр. +359 88 123 4567 или 0881234567).';

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();

  if (!PHONE_CHARS_REGEX.test(trimmed)) return false;

  // Embedded + (after position 0) is not valid.
  if (trimmed.slice(1).includes('+')) return false;

  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
