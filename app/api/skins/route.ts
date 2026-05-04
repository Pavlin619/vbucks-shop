import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { fetchShopEntries } from '@/services/skins';

export async function GET() {
  // Middleware gates unauthenticated callers with a 401. This call is
  // defence-in-depth — the userId itself isn't needed by the handler.
  await auth.protect();

  const entries = await fetchShopEntries();

  // Empty array = upstream Fortnite shop down AND nothing in cache.
  // Per api-contracts.md this is the only condition that returns 502.
  if (entries.length === 0) {
    return NextResponse.json({ error: 'Shop catalog unavailable' }, { status: 502 });
  }

  return NextResponse.json({ entries });
}
