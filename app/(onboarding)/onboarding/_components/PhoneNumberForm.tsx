'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useSavePhone } from '@/app/(onboarding)/onboarding/_lib/use-save-phone';
import { isValidPhone, PHONE_ERROR } from '@/lib/phone';

interface PhoneNumberFormProps {
  initialPhone?: string | null;
}

export default function PhoneNumberForm({ initialPhone }: PhoneNumberFormProps) {
  const [value, setValue] = useState(initialPhone ?? '');
  const [touched, setTouched] = useState(false);
  const { saving, error: apiError, savePhone } = useSavePhone();

  const isValid = isValidPhone(value.trim());
  const showError = touched && value.trim() !== '' && !isValid;
  const canSubmit = isValid && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await savePhone(value);
  }

  return (
    <>
      <LoadingOverlay visible={saving} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="phone-number"
            className="block text-sm font-medium text-brand-text mb-1.5"
          >
            Телефонен номер
          </label>
          <input
            id="phone-number"
            type="tel"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setTouched(true);
            }}
            placeholder="+359 88 123 4567"
            aria-invalid={showError}
            aria-describedby={showError ? 'phone-error' : undefined}
            className={`w-full rounded-xl bg-brand-dark border px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none transition-colors ${
              showError
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-white/15 focus:border-brand-accent'
            }`}
          />
          {showError && (
            <p id="phone-error" className="mt-1.5 text-xs text-rose-400">
              {PHONE_ERROR}
            </p>
          )}
          {apiError && (
            <Alert variant="error" className="mt-2 text-xs">
              {apiError}
            </Alert>
          )}
        </div>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {saving ? 'Запазване...' : 'Продължи'}
        </Button>
      </form>
    </>
  );
}
