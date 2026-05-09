'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <Button
      variant="secondary"
      size="sm"
      fullWidth
      onClick={() => signOut({ redirectUrl: '/' })}
    >
      <LogOut className="w-4 h-4" />
      Изход
    </Button>
  );
}
