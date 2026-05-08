'use client';

import 'client-only';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseSaveUsernameResult {
  saving: boolean;
  error: string | null;
  saveUsername: (username: string) => Promise<void>;
}

export function useSaveUsername(): UseSaveUsernameResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function saveUsername(username: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/fortnite-username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fortnite_username: username.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Неуспешно запазване');
      }
      // Refresh server component to pick up the saved username.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неуспешно запазване');
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, saveUsername };
}
