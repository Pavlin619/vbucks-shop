import type { VBucksPack } from '@/types';

export const VBUCKS_PACKS: Record<string, VBucksPack> = {
  '500': {
    id: '500',
    vbucks: 500,
    price_cents: 299,
    label: '500 V-Bucks',
  },
  '1000': {
    id: '1000',
    vbucks: 1000,
    price_cents: 499,
    label: '1000 V-Bucks',
  },
  '1500': {
    id: '1500',
    vbucks: 1500,
    price_cents: 699,
    label: '1500 V-Bucks',
    popular: true,
  },
  '2800': {
    id: '2800',
    vbucks: 2800,
    price_cents: 1149,
    label: '2800 V-Bucks',
  },
  '5000': {
    id: '5000',
    vbucks: 5000,
    price_cents: 1799,
    label: '5000 V-Bucks',
  },
};

export function getPackById(id: string): VBucksPack | undefined {
  return VBUCKS_PACKS[id];
}

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}
