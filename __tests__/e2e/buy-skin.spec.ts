import { test, expect } from '@playwright/test';
import { hasE2ECreds } from './_helpers/env';
import { signInTestUser, signOutTestUser } from './_helpers/clerk-auth';
import { resetProfile, seedProfile } from './_helpers/seed-profile';

// ---------------------------------------------------------------------------
// E2E coverage for the "buy a skin from the item shop" flow.
//
// Auth is real (Clerk testing token + a real test user). Catalog data is real
// (live Fortnite shop). The `POST /api/orders` call is mocked via
// page.route() in the success-path test so we don't pollute Supabase with
// real orders on every run — the route handler's status-code mapping is
// already covered by `__tests__/unit/api/orders.test.ts`.
//
// The whole suite skips when E2E credentials aren't configured. Document
// setup lives in `.env.example` under the `E2E_*` section.
// ---------------------------------------------------------------------------

test.describe('Buy a skin from the item shop', () => {
  test.skip(
    !hasE2ECreds(),
    'Set E2E_CLERK_USER_*, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run.',
  );

  test.beforeEach(async ({ page }) => {
    // Always start signed in. Seed step happens per-test because each spec
    // wants a different starting balance.
    await signInTestUser(page);
  });

  test.afterEach(async ({ page }) => {
    await resetProfile();
    await signOutTestUser(page);
  });

  test('clicking a tile in the shop navigates to the detail page', async ({
    page,
  }) => {
    await seedProfile({
      fortniteUsername: 'E2EFakeAccount',
      vbucksBalance: 0, // any balance works for this test
    });

    await page.goto('/item-shop');

    // Wait until the catalog has rendered at least one tile. The Fortnite
    // shop is occasionally empty for a few seconds at midnight UTC during
    // the rotation; a generous timeout covers that without flake.
    const firstTile = page.getByTestId('skin-card').first();
    await expect(firstTile).toBeVisible({ timeout: 30_000 });

    const offerId = await firstTile.getAttribute('data-offer-id');
    expect(offerId).toBeTruthy();

    await firstTile.click();
    await page.waitForURL(/\/item-shop\/.+/);

    await expect(page.getByTestId('skin-detail-name')).toBeVisible();
    await expect(page.getByTestId('skin-detail-hero')).toBeVisible();
    await expect(page.getByTestId('back-to-shop')).toBeVisible();
  });

  test('detail page surfaces meta pills and the price card', async ({ page }) => {
    await seedProfile({
      fortniteUsername: 'E2EFakeAccount',
      vbucksBalance: 0,
    });

    await page.goto('/item-shop');
    await page.getByTestId('skin-card').first().click();
    await page.waitForURL(/\/item-shop\/.+/);

    await expect(page.getByTestId('meta-pill-rarity')).toBeVisible();
    await expect(page.getByTestId('meta-pill-type')).toBeVisible();
    await expect(page.getByTestId('price-card-cost')).toBeVisible();
  });

  test('insufficient balance disables the buy button and shows a hint', async ({
    page,
  }) => {
    await seedProfile({
      fortniteUsername: 'E2EFakeAccount',
      vbucksBalance: 0, // every shop entry costs > 0, so always insufficient
    });

    await page.goto('/item-shop');
    await page.getByTestId('skin-card').first().click();
    await page.waitForURL(/\/item-shop\/.+/);

    const buyButton = page.getByTestId('buy-skin-btn');
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toBeDisabled();
    await expect(page.getByTestId('buy-skin-insufficient')).toBeVisible();
  });

  test('successful order replaces the buy CTA with a receipt', async ({
    page,
  }) => {
    // Seed a giant balance so the page-level sufficiency check enables the
    // button. The actual order is mocked below to avoid DB writes.
    await seedProfile({
      fortniteUsername: 'E2EFakeAccount',
      vbucksBalance: 1_000_000,
    });

    // Mock POST /api/orders to return a deterministic 201. We don't need
    // to know what skin is on offer today — the response is what drives
    // the OrderOutcome receipt.
    await page.route('**/api/orders', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          orderId: 'e2e-order-fixture-1234',
          skinName: 'Test Outfit',
          vbucksCost: 1500,
          remainingBalance: 998_500,
        }),
      });
    });

    await page.goto('/item-shop');
    await page.getByTestId('skin-card').first().click();
    await page.waitForURL(/\/item-shop\/.+/);

    const buyButton = page.getByTestId('buy-skin-btn');
    await expect(buyButton).toBeEnabled();
    await buyButton.click();

    const receipt = page.getByTestId('order-success');
    await expect(receipt).toBeVisible();
    await expect(page.getByTestId('order-id')).toHaveText(
      'e2e-order-fixture-1234',
    );
  });

  test('API failure surfaces an inline error and re-enables the button', async ({
    page,
  }) => {
    await seedProfile({
      fortniteUsername: 'E2EFakeAccount',
      vbucksBalance: 1_000_000,
    });

    await page.route('**/api/orders', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Order placement failed' }),
      });
    });

    await page.goto('/item-shop');
    await page.getByTestId('skin-card').first().click();
    await page.waitForURL(/\/item-shop\/.+/);

    const buyButton = page.getByTestId('buy-skin-btn');
    await buyButton.click();

    await expect(page.getByTestId('buy-skin-error')).toBeVisible();
    await expect(buyButton).toBeEnabled();
    // No receipt should appear on a failure.
    await expect(page.getByTestId('order-success')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Public-surface checks — these don't need credentials and cover the bits
// of the buy flow that should be exercised on every CI run.
// ---------------------------------------------------------------------------

test.describe('Buy a skin from the item shop — public surface', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => window.localStorage.clear());
  });

  test('unauthenticated visitor cannot reach a detail page', async ({ page }) => {
    await page.goto('/item-shop/v2:%2Fanything');
    await page.waitForURL(/sign-in/, { timeout: 15_000 });
  });

  test('POST /api/orders is auth-protected', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: { skinId: 'v2:/anything' },
    });
    // Middleware returns 401 for unauthenticated API requests
    // (`middleware.ts`). A 3xx is also acceptable for transport-level
    // redirects (e.g. middleware future-proofing).
    expect([401, 302, 307, 308]).toContain(res.status());
  });
});
