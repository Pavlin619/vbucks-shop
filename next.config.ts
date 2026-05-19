import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    // Allow Next/Image to optimise the live Fortnite-API artwork
    // instead of falling back to `unoptimized`.
    remotePatterns: [
      { protocol: 'https', hostname: 'fortnite-api.com' },
      { protocol: 'https', hostname: '**.fortnite-api.com' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Silences the Sentry CLI output during builds unless there is an error.
  silent: !process.env.CI,
  // Upload source maps to Sentry so stack traces show original TypeScript.
  // Requires SENTRY_AUTH_TOKEN and SENTRY_ORG / SENTRY_PROJECT env vars in CI.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  webpack: {
    // Tree-shake Sentry's internal debug logging from the production bundle.
    treeshake: { removeDebugLogging: true },
    // Disable auto-created Vercel cron monitors — we don't use Vercel crons.
    automaticVercelMonitors: false,
  },
});
