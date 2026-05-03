/**
 * Type declarations describing the subset of the Fortnite-API.com `/v2/shop`
 * response that we actually consume. Kept private to the `services/skins`
 * module — these mirror the upstream wire format and should never leak into
 * UI / type imports.
 *
 * If the upstream payload changes shape, update this file and the mapper —
 * nothing else should need touching.
 */

export interface RawImage {
  image?: string;
  productTag?: string;
}

export interface RawNewDisplayAsset {
  renderImages?: RawImage[];
}

export interface RawBrItem {
  id?: string;
  name?: string;
  description?: string | null;
  type?: { value?: string } | null;
  rarity?: { value?: string } | null;
  images?: { icon?: string; featured?: string | null; smallIcon?: string } | null;
}

export interface RawBundle {
  name?: string;
  info?: string;
  image?: string;
}

export interface RawLayout {
  id?: string;
  name?: string;
  rank?: number;
  index?: number;
}

export interface RawColors {
  color1?: string;
  color3?: string;
  textBackgroundColor?: string;
}

export interface RawShopEntry {
  offerId?: string;
  regularPrice?: number;
  finalPrice?: number;
  layout?: RawLayout | null;
  layoutId?: string;
  tileSize?: string;
  sortPriority?: number;
  colors?: RawColors | null;
  newDisplayAsset?: RawNewDisplayAsset;
  brItems?: RawBrItem[];
  bundle?: RawBundle | null;
}

export interface RawShopResponse {
  status?: number;
  data?: { entries?: RawShopEntry[] };
}
