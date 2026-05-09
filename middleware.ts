import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin/(.*)']);
const isApiRoute = createRouteMatcher(['/api/(.*)']);

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
  if (isPublicRoute(req)) return;

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
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
