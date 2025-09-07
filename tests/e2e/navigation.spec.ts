import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should navigate to different pages correctly', async ({ page }) => {
    await page.goto('/');

    // Test navigation to various pages
    await page.goto('/statistics');
    await expect(page).toHaveURL(/.*\/statistics/);
    await expect(page.locator('text=Statistics')).toBeVisible();

    await page.goto('/badges');
    await expect(page).toHaveURL(/.*\/badges/);

    await page.goto('/shop');
    await expect(page).toHaveURL(/.*\/shop/);
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/');

    // Test responsive behavior by checking viewport-specific elements
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size

    // The page should still load and be functional on mobile
    await expect(page.locator('text=Garden of Eden')).toBeVisible();

    // Set back to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('text=Garden of Eden')).toBeVisible();
  });
});
