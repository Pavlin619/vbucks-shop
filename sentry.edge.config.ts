import * as Sentry from '@sentry/nextjs';

// Edge runtime is used by Next.js middleware (Clerk auth gate). Keep this
// config minimal — the edge SDK has a smaller API surface than Node.js.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
});
