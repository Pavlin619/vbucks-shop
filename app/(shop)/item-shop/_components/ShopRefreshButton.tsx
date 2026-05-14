'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default function ShopRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
      <LoadingOverlay visible={isPending} />
      <Button
        size="sm"
        variant="secondary"
        onClick={handleRefresh}
        disabled={isPending}
        data-testid="shop-refresh-btn"
      >
        <RefreshCw className={['w-4 h-4', isPending ? 'animate-spin' : ''].join(' ')} />
        Опресни
      </Button>
    </>
  );
}
