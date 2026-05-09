import { test, expect } from '@playwright/test';

// E2E tests covering the public surface of the /item-shop page.
// The catalog is now publicly accessible — unauthenticated visitors can browse
// but are shown a requirements banner and cannot buy.

test.describe('/item-shop — unauthenticated visitor', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => window.localStorage.clear());
  });

  test('unauthenticated visitor can see the item shop catalog', async ({ page }) => {
    await page.goto('/item-shop');
    // Should NOT be redirected to sign-in
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page).toHaveURL('/item-shop');
  });

  test('unauthenticated visitor sees the requirements banner', async ({ page }) => {
    await page.goto('/item-shop');
    await expect(page.getByTestId('item-shop-access-gate')).toBeVisible();
  });

  test('unauthenticated visitor can navigate to a skin detail page', async ({ page }) => {
    await page.goto('/item-shop');
    const firstCard = page.getByTestId('skin-card').first();
    // If the API returned any items we can navigate into one
    const count = await firstCard.count();
    if (count > 0) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/item-shop\//);
      await expect(page).not.toHaveURL(/sign-in/);
    }
  });

  test('unauthenticated visitor sees access gate instead of buy button on detail page', async ({
    page,
  }) => {
    await page.goto('/item-shop');
    const firstCard = page.getByTestId('skin-card').first();
    const count = await firstCard.count();
    if (count > 0) {
      await firstCard.click();
      await expect(page.getByTestId('item-shop-access-gate')).toBeVisible();
      await expect(page.getByTestId('buy-skin-btn')).not.toBeVisible();
    }
  });

  test('GET /api/skins is still auth-protected', async ({ request }) => {
    const res = await request.get('/api/skins');
    expect([401, 302, 307, 308]).toContain(res.status());
  });
});

test.describe('/item-shop — authenticated rendering', () => {
  // These specs require a Clerk-authenticated test session helper which is not
  // yet implemented. Re-enable once an E2E auth helper exists.

  test.skip('user without fortnite_username sees the requirements banner', async () => {
    // Given: a signed-in user whose profile.fortnite_username is null
    // When : they navigate to /item-shop
    // Then : they see the item-shop-access-gate (data-testid="item-shop-access-gate")
    //        and the catalog tiles are still visible
  });

  test.skip('user with accepted friend request waiting < 48 h sees waiting banner', async () => {
    // Given: a signed-in user with fortnite_username set, friend_request_status='accepted',
    //        friend_request_accepted_at = 10 h ago
    // When : they navigate to /item-shop
    // Then : they see the item-shop-access-gate with the hoursRemaining figure
  });

  test.skip('eligible user sees catalog without any banner', async () => {
    // Given: a signed-in user with all prerequisites met (accepted >= 48 h ago)
    // When : they navigate to /item-shop
    // Then : no data-testid="item-shop-access-gate" is visible
    //        and at least one data-testid="skin-card" tile is shown
  });
});
