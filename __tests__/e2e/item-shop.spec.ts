import { test, expect } from '@playwright/test';

// E2E tests covering the public surface of the /item-shop page and its API.
// Authenticated paths (catalog rendering, username gate) require a Clerk
// test session helper that doesn't yet exist in the repo and will be added
// alongside the skin-purchase flow.

test.describe('/item-shop — public surface', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => window.localStorage.clear());
  });

  test('unauthenticated visitor is redirected to sign-in', async ({ page }) => {
    await page.goto('/item-shop');
    await page.waitForURL(/sign-in/, { timeout: 15_000 });
  });

  test('GET /api/skins is auth-protected', async ({ request }) => {
    const res = await request.get('/api/skins');
    // Middleware returns 401 for unauthenticated API requests
    // (`middleware.ts`). A 3xx is also acceptable for transport-level
    // redirects (e.g. middleware future-proofing).
    expect([401, 302, 307, 308]).toContain(res.status());
  });
});

test.describe('/item-shop — authenticated rendering', () => {
  // These specs require a Clerk-authenticated test session helper which is not
  // yet implemented. They are intentionally skipped so the file documents the
  // intended coverage without producing flaky failures. Re-enable once an
  // E2E auth helper exists (planned alongside the skin-purchase flow).

  test.skip('user without fortnite_username is blocked from /item-shop', async () => {
    // Given: a signed-in user whose profile.fortnite_username is null
    // When : they navigate to /item-shop
    // Then : they see the "Set your Fortnite username" gate and no skin cards
    //        (data-testid="fortnite-username-gate"), and no data-testid="skin-card"
  });

  test.skip('user with fortnite_username sees the sectioned shop catalog', async () => {
    // Given: a signed-in user with a fortnite_username set and the external
    //        Fortnite API reachable (or a populated server cache)
    // When : they navigate to /item-shop
    // Then : at least one data-testid="shop-section" is visible and contains
    //        one or more data-testid="skin-card" tiles, each with a name,
    //        image, and V-Bucks cost.
  });
});
