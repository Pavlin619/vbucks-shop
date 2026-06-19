import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Forwards Server Component render errors to Sentry with the real message and
// digest — without this, production builds only surface the digest placeholder.
export const onRequestError = Sentry.captureRequestError;
