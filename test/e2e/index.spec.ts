import { describe, expect, test } from 'vitest';
import { createPage, setup } from '@nuxt/test-utils/e2e';

describe('Homepage', async () => {
  await setup({});

  describe('when user is logged out', () => {
    test('user sees intro and sign in button', async () => {
      const page = await createPage('/');

      const intro = page
        .locator('p')
        .filter({
          hasText:
            /highly secure garden where only those with a Dragon Cave account can enter/,
        })
        .first();

      expect(await intro.isVisible()).to.be.true;

      const signInButton = page
        .locator('[data-test-id="nav"]')
        .getByRole('button', { name: /^sign in$/i });

      expect(await signInButton.isVisible()).to.be.true;
    });

    test('user is redirected to dragcave oauth after clicking sign in', async () => {
      const page = await createPage('/');

      const signInButton = page
        .locator('[data-test-id="nav"]')
        .getByRole('button', { name: /^sign in$/i });

      await signInButton.click();
      await page.waitForURL(/https:\/\/dragcave.net\/login/);
    });
  });
});
