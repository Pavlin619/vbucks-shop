import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // 10% of sessions recorded as replays — enough to diagnose UX bugs without
  // storing user data in bulk.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
  // Traces help tie slow API calls to specific errors.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
});
