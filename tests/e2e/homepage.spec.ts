import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test('should load the homepage and display correct title', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads and has the correct title
    await expect(page).toHaveTitle(/Garden of Eden/);
    
    // Check for key elements on the homepage
    await expect(page.locator('text=Garden of Eden')).toBeVisible();
    await expect(page.locator('text=Dragon Cave account')).toBeVisible();
  });

  test('should display login prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Should show login-related content for unauthenticated users
    await expect(page.locator('text=sign in')).toBeVisible();
    await expect(page.locator('text=Dragon Cave account')).toBeVisible();
    
    // Should not show authenticated user elements
    await expect(page.locator('[data-testid="user-scroll"]')).not.toBeVisible();
  });
});