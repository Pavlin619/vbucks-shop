'use client';

import 'client-only';
import { X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import Alert from '@/components/ui/Alert';

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
    >
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          variant={toast.variant}
          className="pointer-events-auto shadow-lg"
          action={
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Затвори"
              className="text-brand-muted hover:text-brand-text"
            >
              <X className="w-4 h-4" />
            </button>
          }
        >
          {toast.message}
        </Alert>
      ))}
    </div>
  );
}
