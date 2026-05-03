/** Locale-aware V-Bucks number formatting (e.g. `1500` → `"1 500"`). */
export function formatVbucks(amount: number): string {
  return amount.toLocaleString('bg-BG');
}

/**
 * Returns the rounded discount percentage between regular and final price,
 * or `null` if the entry isn't actually discounted (final >= regular, or
 * regular is non-positive).
 */
export function discountPercent(regular: number, final: number): number | null {
  if (regular <= 0 || final >= regular) return null;
  return Math.round(((regular - final) / regular) * 100);
}
