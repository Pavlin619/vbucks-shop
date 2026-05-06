import { test, expect } from '@playwright/test';

// These tests require:
//   - ADMIN_USER_IDS env var set to the test admin's Clerk userId
//   - E2E_CLERK_USER_* env vars for admin session auth
//   - At least one completed V-Bucks purchase in the DB

test.describe('Admin friend request management', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_ID,
    'Skipping: E2E_CLERK_USER_ID not configured',
  );

  test('admin can see purchasers and advance friend request state', async ({
    page,
  }) => {
    // TODO: implement Clerk admin session setup (clerk-auth helper)
    await page.goto('/admin/orders');

    // Should see the purchasers panel
    await expect(page.getByRole('heading', { name: /recent purchases/i })).toBeVisible();

    // Find a purchaser row that is in "not_sent" state (has the action button)
    const row = page.locator('[data-testid^="friend-request-toggle-"]').first();
    await expect(row).toBeVisible();

    // Row should have the "Sent Friend Request" button (not_sent state)
    const sentBtn = row.getByRole('button', { name: /sent friend request/i });
    await expect(sentBtn).toBeVisible();

    // Advance to pending — row turns amber
    await sentBtn.click();

    // Row now shows the "Accepted by User" button (pending state)
    const acceptedBtn = row.getByRole('button', { name: /accepted by user/i });
    await expect(acceptedBtn).toBeVisible();

    // Advance to accepted — row turns green
    await acceptedBtn.click();

    // Row now shows the "✓ Friends" badge (accepted state, no further button)
    await expect(row.getByText('✓ Friends')).toBeVisible();
    await expect(row.getByRole('button')).toHaveCount(0);
  });

  test('non-admin user is redirected away from admin orders page', async ({
    page,
  }) => {
    // Unauthenticated visit
    await page.goto('/admin/orders');
    // Middleware redirects to sign-in
    await expect(page).not.toHaveURL('/admin/orders');
  });
});
