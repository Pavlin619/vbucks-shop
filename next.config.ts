import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  // Prevent other sites from embedding this app in an iframe (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers from MIME-sniffing the content type declared in the response.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send the origin (no path/query) in the Referer header for cross-origin requests.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Tell browsers to lock this domain to HTTPS for 1 year.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Opt out of browser features this app doesn't use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js injects inline scripts; Clerk loads its own script bundle.
      // unsafe-eval is dev-only: React uses eval() for call-stack reconstruction
      // in development. Production builds never need it.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://*.clerk.accounts.dev https://js.stripe.com`,
      // Tailwind v4 and Next.js both emit inline styles.
      "style-src 'self' 'unsafe-inline'",
      // Fortnite API artwork + Clerk user avatar CDN.
      "img-src 'self' data: blob: https://fortnite-api.com https://*.fortnite-api.com https://img.clerk.com",
      "font-src 'self'",
      // Clerk's auth SDK and Stripe API calls from the browser.
      "connect-src 'self' https://*.clerk.accounts.dev https://api.stripe.com",
      // Clerk sign-in/sign-up components render inside an iframe from their CDN.
      "frame-src https://*.clerk.accounts.dev https://js.stripe.com",
      // Belt-and-suspenders alongside X-Frame-Options for modern browsers.
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  images: {
    // Allow Next/Image to optimise the live Fortnite-API artwork
    // instead of falling back to `unoptimized`.
    remotePatterns: [
      { protocol: 'https', hostname: 'fortnite-api.com' },
      { protocol: 'https', hostname: '**.fortnite-api.com' },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
