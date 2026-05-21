'use client';

import 'client-only';
import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { apiFetch, ApiError } from '@/lib/api-client';

interface UseSavePhoneResult {
  saving: boolean;
  error: string | null;
  savePhone: (phone: string) => Promise<void>;
}

export function useSavePhone(): UseSavePhoneResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clerk = useClerk();

  async function savePhone(phone: string) {
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/profile/phone-number', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone.trim() }),
      });
      // Force a fresh JWT so the middleware sees onboardingComplete: true
      // before the browser navigates. Without this, the cached token causes
      // a redirect loop back to /onboarding for up to ~60 seconds.
      await clerk.session?.reload();
      window.location.href = '/profile';
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

  return { saving, error, savePhone };
}
