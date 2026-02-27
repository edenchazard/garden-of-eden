import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test.describe('when user is logged out', () => {
    test('user sees intro and sign in button', async ({ page }) => {
      await page.goto('/');

      const intro = page
        .locator('p')
        .filter({
          hasText:
            /highly secure garden where only those with a Dragon Cave account can enter/,
        })
        .first();

      await expect(
        page.locator('[data-test-id="nav"] button', { hasText: 'Sign in' })
      ).toBeVisible();

      await expect(intro).toBeVisible();
    });

    test('user is redirected to dragcave oauth after clicking sign in', async ({
      page,
    }) => {
      await page.goto('/');

      const signInButton = page.locator('[data-test-id="nav"] button', {
        hasText: 'Sign in',
      });

      await expect(signInButton).toBeVisible();
      await signInButton.click();
      await expect(page).toHaveURL(/https:\/\/dragcave.net\/login/);
    });
  });
});
