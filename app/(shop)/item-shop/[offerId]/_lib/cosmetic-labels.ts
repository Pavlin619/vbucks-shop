/**
 * Display helpers for the cosmetic `type` and `rarity` fields surfaced on
 * the detail page. Kept here (route-only `_lib`) because no other route
 * needs them yet — promote to `lib/` if a second consumer appears.
 */

const TYPE_LABELS_BG: Record<string, string> = {
  outfit: 'Скин',
  glider: 'Делтапланер',
  pickaxe: 'Кирка',
  emote: 'Танц',
  backpack: 'Раница',
  wrap: 'Обвивка',
  music: 'Музика',
  loadingscreen: 'Loading screen',
  bundle: 'Пакет',
  cosmetic: 'Козметика',
};

/** Friendly Bulgarian label for a cosmetic type. Falls back to the raw value. */
export function typeLabel(type: string): string {
  return TYPE_LABELS_BG[type.toLowerCase()] ?? type;
}

/**
 * Rarity → text color class. Mirrors Fortnite's in-game accent colours so a
 * Marvel skin looks distinct from an Epic skin without us having to hand-pick.
 * Unknown values fall back to the brand text colour.
 */
const RARITY_TEXT_CLASS: Record<string, string> = {
  common: 'text-zinc-200',
  uncommon: 'text-green-300',
  rare: 'text-blue-300',
  epic: 'text-purple-300',
  legendary: 'text-orange-300',
  mythic: 'text-yellow-300',
  marvel: 'text-red-400',
  dc: 'text-sky-300',
  icon: 'text-cyan-300',
  gaming: 'text-pink-300',
  starwars: 'text-amber-300',
  dark: 'text-fuchsia-300',
};

export function rarityTextClass(rarity: string): string {
  return RARITY_TEXT_CLASS[rarity.toLowerCase()] ?? 'text-brand-text';
}

/** Capitalise an arbitrary string for display: `'epic'` → `'Epic'`. */
export function capitalise(value: string): string {
  if (value.length === 0) return value;
  return value[0].toUpperCase() + value.slice(1);
}
