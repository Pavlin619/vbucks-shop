'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useSaveFortniteUsername } from '@/lib/hooks/use-save-fortnite-username';
import { isValidFortniteUsername, FORTNITE_USERNAME_ERROR } from '@/lib/fortnite-username';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

const DEBOUNCE_MS = 500;

export default function FortniteUsernameForm() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState('');
  const { saving, error: apiError, saveUsername } = useSaveFortniteUsername();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const isTyping = value !== debouncedValue;
  const showValidation = touched && !isTyping && value.trim() !== '';
  const isValid = isValidFortniteUsername(debouncedValue.trim());
  const canSubmit = showValidation && isValid && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await saveUsername(value);
  }

  return (
    <>
    <LoadingOverlay visible={saving} />
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="fortnite-username"
          className="block text-sm font-medium text-brand-text mb-1.5"
        >
          Fortnite потребителско име
        </label>
        <div className="relative">
          <input
            id="fortnite-username"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setTouched(true);
            }}
            placeholder="Вашето Fortnite потребителско име"
            aria-invalid={showValidation && !isValid}
            aria-describedby={showValidation && !isValid ? 'fn-error' : undefined}
            className={`w-full rounded-xl bg-brand-dark border px-4 py-2.5 pr-10 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none transition-colors ${
              !showValidation
                ? 'border-white/15 focus:border-brand-accent'
                : isValid
                  ? 'border-green-500 focus:border-green-500'
                  : 'border-rose-500 focus:border-rose-500'
            }`}
          />
          {showValidation && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isValid ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
            </span>
          )}
        </div>
        {showValidation && !isValid && (
          <p id="fn-error" className="mt-1.5 text-xs text-rose-400">
            {FORTNITE_USERNAME_ERROR}
          </p>
        )}
        {apiError && (
          <Alert variant="error" className="mt-2 text-xs">
            {apiError}
          </Alert>
        )}
      </div>
      <Button type="submit" size="sm" disabled={!canSubmit}>
        {saving ? 'Запазване...' : 'Запази'}
      </Button>
    </form>
    </>
  );
}
