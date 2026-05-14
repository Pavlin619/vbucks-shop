'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const STORAGE_KEY = 'cookie-notice-dismissed';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-purple border-t border-brand-border">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-4">
        <p className="flex-1 text-brand-muted text-sm leading-relaxed">
          Този сайт използва само задължителни бисквитки за управление на сесията и удостоверяване
          на потребители. Не се използват бисквитки за проследяване или реклама.{' '}
          <Link
            href="/privacy-policy"
            className="text-brand-accent hover:text-brand-accent-hover underline"
          >
            Научете повече
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 text-brand-muted hover:text-brand-text transition-colors"
          aria-label="Затвори известието за бисквитки"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
