// Epic Games display names: 3–16 chars, alphanumeric + _ . -
// Must start and end with an alphanumeric character.
export const FORTNITE_USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,14}[a-zA-Z0-9]$/;

export const FORTNITE_USERNAME_ERROR =
  'Само букви, цифри, _, . или - (3–16 знака). Трябва да започва и завършва с буква или цифра.';

export function isValidFortniteUsername(username: string): boolean {
  return FORTNITE_USERNAME_REGEX.test(username);
}
