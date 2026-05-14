const TYPE_LABELS: Record<string, string> = {
  outfit: 'Outfits',
  emote: 'Emotes',
  glider: 'Gliders',
  pickaxe: 'Pickaxes',
  backbling: 'Back Blings',
  wrap: 'Wraps',
  contrail: 'Contrails',
  loadingscreen: 'Loading Screens',
  music: 'Music',
  toy: 'Toys',
  spray: 'Sprays',
  banner: 'Banners',
  bundle: 'Bundles',
  cosmetic: 'Cosmetics',
  vehicle: 'Vehicles',
  kicks: 'Kicks',
  umbrella: 'Umbrellas',
  pet: 'Pets',
};

export function labelForType(type: string): string {
  return (
    TYPE_LABELS[type] ??
    type.charAt(0).toUpperCase() + type.slice(1) + 's'
  );
}
