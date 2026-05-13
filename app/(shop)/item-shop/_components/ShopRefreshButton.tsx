'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ShopRefreshButton() {
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => router.refresh()}
      data-testid="shop-refresh-btn"
    >
      <RefreshCw className="w-4 h-4" />
      Опресни
    </Button>
  );
}
