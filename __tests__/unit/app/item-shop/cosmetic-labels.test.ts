import { describe, it, expect } from 'vitest';
import {
  capitalise,
  rarityTextClass,
  typeLabel,
} from '@/app/(shop)/item-shop/[offerId]/_lib/cosmetic-labels';

describe('cosmetic-labels — typeLabel', () => {
  it('returns a Bulgarian label for known cosmetic types', () => {
    expect(typeLabel('outfit')).toBe('Скин');
    expect(typeLabel('glider')).toBe('Делтапланер');
    expect(typeLabel('pickaxe')).toBe('Кирка');
    expect(typeLabel('bundle')).toBe('Пакет');
  });

  it('is case-insensitive on the lookup', () => {
    expect(typeLabel('OUTFIT')).toBe('Скин');
    expect(typeLabel('Bundle')).toBe('Пакет');
  });

  it('falls back to the raw type when unknown', () => {
    expect(typeLabel('contraildart')).toBe('contraildart');
  });
});

describe('cosmetic-labels — rarityTextClass', () => {
  it('returns a tailwind text colour class per rarity', () => {
    expect(rarityTextClass('epic')).toBe('text-purple-300');
    expect(rarityTextClass('marvel')).toBe('text-red-400');
    expect(rarityTextClass('icon')).toBe('text-cyan-300');
  });

  it('is case-insensitive', () => {
    expect(rarityTextClass('Epic')).toBe('text-purple-300');
  });

  it('falls back to the brand text colour when unknown', () => {
    expect(rarityTextClass('legendary-mythic-omega')).toBe('text-brand-text');
  });
});

describe('cosmetic-labels — capitalise', () => {
  it('uppercases the first character only', () => {
    expect(capitalise('epic')).toBe('Epic');
    expect(capitalise('marvel')).toBe('Marvel');
  });

  it('returns an empty string unchanged', () => {
    expect(capitalise('')).toBe('');
  });
});
