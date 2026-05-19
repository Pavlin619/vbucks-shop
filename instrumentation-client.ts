import * as Sentry from '@sentry/nextjs';
import './sentry.client.config';

// Required by @sentry/nextjs to capture client-side navigations with Turbopack.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
