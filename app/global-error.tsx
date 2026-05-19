'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // digest lets you match this Sentry event to the corresponding server-side log line
    Sentry.captureException(error, { extra: { digest: error.digest } });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#011627', color: '#f6f7f8', minHeight: '100vh' }}>
        <main
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Нещо се обърка</h1>
          <p style={{ marginTop: '12px', color: '#9ca3af', maxWidth: '420px' }}>
            Възникна неочаквана грешка в приложението. Опитайте да презаредите страницата.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              background: '#ff3366',
              color: '#f6f7f8',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Опитайте отново
          </button>
        </main>
      </body>
    </html>
  );
}
