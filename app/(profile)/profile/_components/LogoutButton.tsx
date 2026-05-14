'use client';

import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default function LogoutButton() {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut({ redirectUrl: '/' });
  }

  return (
    <>
      <LoadingOverlay visible={loading} />
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        disabled={loading}
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4" />
        Изход
      </Button>
    </>
  );
}
