import type { Page } from '@playwright/test';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { getE2ECreds } from './env';

let setupPromise: Promise<unknown> | null = null;

/**
 * Lazily call `clerkSetup()` exactly once per Playwright worker. Pulls
 * Clerk's frontend API config and mints the testing token Playwright
 * uses to bypass bot protection on /sign-in.
 */
async function ensureSetup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = clerkSetup();
  }
  await setupPromise;
}

/**
 * Sign the test user in via Clerk's official Playwright integration.
 *
 * Lands the page at `/` first because `clerk.signIn` requires a Clerk
 * frontend instance to be present in the DOM. Throws if credentials
 * aren't configured — callers should `test.skip(!hasE2ECreds(), ...)`
 * upstream rather than relying on this for graceful degradation.
 */
export async function signInTestUser(page: Page): Promise<void> {
  const creds = getE2ECreds();
  if (!creds) {
    throw new Error(
      'signInTestUser called without E2E credentials configured.',
    );
  }

  await ensureSetup();

  await page.goto('/');
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: creds.clerkUsername,
      password: creds.clerkPassword,
    },
  });
}

/**
 * Sign the current Clerk session out so worker isolation between specs
 * is real (Playwright reuses contexts inside a worker).
 */
export async function signOutTestUser(page: Page): Promise<void> {
  try {
    await clerk.signOut({ page });
  } catch {
    // Already signed out / no Clerk instance loaded — that's fine.
  }
}
