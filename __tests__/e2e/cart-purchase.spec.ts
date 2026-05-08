import { test, expect } from '@playwright/test';

// E2E tests for the cart-based purchase flow.
//
// These tests cover the public part of the flow (anyone can browse, add to
// cart, view cart). Stripe checkout itself is not exercised here — clicking
// "Към плащането" while unauthenticated redirects to /sign-in, which is the
// extent of what we test without real Clerk + Stripe credentials.

test.describe('Cart flow — adding & viewing', () => {
  test.beforeEach(async ({ context }) => {
    // Start every test with a clean cart
    await context.clearCookies();
    await context.addInitScript(() => window.localStorage.clear());
  });

  test('clicking a pack opens the "added to cart" modal', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('buy-pack-1000').click();
    await expect(page.getByTestId('added-to-cart-modal')).toBeVisible();
  });

  test('"Continue shopping" closes the modal and stays on home', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('buy-pack-1000').click();
    await page.getByTestId('continue-shopping').click();
    await expect(page.getByTestId('added-to-cart-modal')).not.toBeVisible();
    expect(page.url()).toMatch(/\/$/);
  });

  test('"Go to cart" navigates to /cart with the item shown', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('buy-pack-1000').click();
    await page.getByTestId('go-to-cart').click();
    await page.waitForURL('**/cart');
    await expect(page.getByTestId('cart-item-1000')).toBeVisible();
  });

  test('cart count in header reflects the number of added items', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('cart-count')).toHaveText('0');

    await page.getByTestId('buy-pack-500').click();
    await page.getByTestId('continue-shopping').click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    await page.getByTestId('buy-pack-1000').click();
    await page.getByTestId('continue-shopping').click();
    await expect(page.getByTestId('cart-count')).toHaveText('2');
  });

  test('adding the same pack twice increments quantity, not row count', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('buy-pack-1000').click();
    await page.getByTestId('continue-shopping').click();
    await page.getByTestId('buy-pack-1000').click();
    await page.getByTestId('go-to-cart').click();

    // Only one row in the cart for pack '1000'
    await expect(page.getByTestId('cart-item-1000')).toBeVisible();
    expect(await page.getByTestId('cart-item-1000').count()).toBe(1);
    // Header should show 2 items
    await expect(page.getByTestId('cart-count')).toHaveText('2');
  });
});

test.describe('Cart page actions', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => window.localStorage.clear());
  });

  test('removing the last item shows the empty state', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('buy-pack-500').click();
    await page.getByTestId('go-to-cart').click();
    await page.getByTestId('remove-item-500').click();
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });

  test('cart-total updates as items are added', async ({ page }) => {
    await page.goto('/');

    // 500 V-Bucks pack costs €2,99
    await page.getByTestId('buy-pack-500').click();
    await page.getByTestId('go-to-cart').click();
    await expect(page.getByTestId('cart-total')).toContainText('€2,99');
  });

  test('unauthenticated user sees sign-in step and checkout button is disabled', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('buy-pack-1000').click();
    await page.getByTestId('go-to-cart').click();
    // Step 1 of the purchase process is active — sign-in link visible
    await expect(page.getByTestId('step-signin-link')).toBeVisible();
    // Checkout button is disabled until auth + username are provided
    await expect(page.getByTestId('checkout-btn')).toBeDisabled();
  });

  test('unauthenticated user can navigate to sign-in from the purchase steps', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('buy-pack-1000').click();
    await page.getByTestId('go-to-cart').click();
    await page.getByTestId('step-signin-link').click();
    await page.waitForURL(/sign-in/, { timeout: 15_000 });
  });
});

test.describe('Empty cart', () => {
  test('visiting /cart with no items shows the empty state', async ({ page, context }) => {
    await context.clearCookies();
    await context.addInitScript(() => window.localStorage.clear());

    await page.goto('/cart');
    await expect(page.getByTestId('cart-empty')).toBeVisible();
  });
});
