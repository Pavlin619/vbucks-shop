import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Auth-by-default. Anything not in this matcher requires a Clerk session.
 * Webhooks are public because they authenticate via Stripe's signature
 * header, not Clerk.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/cart',
  '/item-shop',
  '/item-shop/(.*)',
  '/privacy-policy',
  '/terms-of-use',
  '/refund-policy',
  '/contact',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin/(.*)']);
const isApiRoute = createRouteMatcher(['/api/(.*)']);

function buildCsp(nonce: string): string {
  const h = (parts: (string | false)[]) => parts.filter(Boolean).join(' ');

  return [
    "default-src 'self'",
    h([
      "script-src 'self'",
      `'nonce-${nonce}'`,
      // Scripts loaded by a nonce-trusted script are implicitly trusted.
      // URL allowlist below is only used by browsers that don't support strict-dynamic.
      "'strict-dynamic'",
      isDev && "'unsafe-eval'", // React reconstructs call stacks with eval() in dev
      'https://*.clerk.accounts.dev',
      'https://js.clerk.com',
      'https://js.stripe.com',
      // Clerk bot-protection widget (Cloudflare Turnstile)
      'https://challenges.cloudflare.com',
    ]),
    // Tailwind v4 and Next.js emit inline styles; nonces don't apply to style-src in practice
    "style-src 'self' 'unsafe-inline'",
    h([
      "img-src 'self' data: blob:",
      'https://img.clerk.com',
      'https://lh3.googleusercontent.com', // Google OAuth profile pictures
      'https://*.fbcdn.net',               // Facebook/Meta OAuth profile pictures
    ]),
    "font-src 'self'",
    h([
      "connect-src 'self'",
      'https://*.clerk.accounts.dev',
      'https://api.clerk.com',
      'https://clerk-telemetry.com',
      'https://api.stripe.com',
      isDev && 'ws://localhost:* wss://localhost:*', // Next.js HMR
    ]),
    h([
      'frame-src',
      'https://*.clerk.accounts.dev', // Clerk sign-in / sign-up modal UI
      'https://accounts.clerk.com',
      'https://js.stripe.com',        // Stripe Payment Element
      'https://hooks.stripe.com',     // Stripe 3DS redirect frames
      'https://challenges.cloudflare.com', // Clerk bot-protection widget
    ]),
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * Single source of truth for "is this user allowed to see this URL?".
 *
 * - Pages: redirect to the configured Clerk sign-in URL (default Clerk
 *   behaviour, preserves the return-to URL).
 * - API routes: respond with `401 { error: 'Unauthorized' }` so the FE
 *   can branch cleanly on the status code. Clerk's default for
 *   unauthenticated API requests is `404` (it hides the route's
 *   existence); we override that here because every API route in this
 *   app exists at a public, predictable path — there's nothing to hide
 *   — and `401` is the semantically correct status.
 *
 * Route handlers and Server Components further down the stack still call
 * `auth.protect()` themselves as a defence-in-depth fallback.
 */
export default clerkMiddleware(async (auth, req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestHeaders = new Headers(req.headers);
  // x-nonce is read by Next.js to stamp its own injected inline scripts,
  // and by the root layout to pass to ClerkProvider.
  requestHeaders.set('x-nonce', nonce);

  if (!isPublicRoute(req)) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return isApiRoute(req)
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : (await auth()).redirectToSignIn();
    }

    if (isAdminRoute(req) && sessionClaims?.metadata?.role !== 'admin') {
      return isApiRoute(req)
        ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        : NextResponse.redirect(new URL('/', req.url));
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
