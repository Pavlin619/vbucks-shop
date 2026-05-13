'use client';

import 'client-only';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';

interface UseSaveFortniteUsernameResult {
  saving: boolean;
  error: string | null;
  saveUsername: (username: string) => Promise<void>;
}

/**
 * Shared hook for PUT /api/profile/fortnite-username. 401s redirect to the
 * sign-in page through `apiFetch`, so a session expiry mid-form bounces the
 * user instead of looking like a save error.
 */
export function useSaveFortniteUsername(): UseSaveFortniteUsernameResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function saveUsername(username: string) {
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/profile/fortnite-username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fortnite_username: username.trim() }),
      });
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Неуспешно запазване');
      }
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, saveUsername };
}
