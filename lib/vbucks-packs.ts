import type { VBucksPack } from '@/types';

export const VBUCKS_PACKS: Record<string, VBucksPack> = {
  '200': {
    id: '200',
    vbucks: 200,
    price_cents: 199,
    label: '200 V-Bucks',
  },
  '500': {
    id: '500',
    vbucks: 500,
    price_cents: 499,
    label: '500 V-Bucks',
  },
  '1000': {
    id: '1000',
    vbucks: 1000,
    price_cents: 799,
    label: '1,000 V-Bucks',
  },
  '2800': {
    id: '2800',
    vbucks: 2800,
    price_cents: 1999,
    label: '2,800 V-Bucks',
  },
};

export function getPackById(id: string): VBucksPack | undefined {
  return VBUCKS_PACKS[id];
}
