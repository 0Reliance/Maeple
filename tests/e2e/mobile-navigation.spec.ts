import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation Redesign', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('should navigate through main sections and user menu on mobile', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/MAEPLE/);

    // 2. Sign up a test user
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();
    
    const testEmail = `test-${Date.now()}@example.com`;
    await page.getByPlaceholder('Your name').fill('Test User');
    await page.getByPlaceholder('you@example.com').fill(testEmail);
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for navigation to journal
    await expect(page).toHaveURL(/\/journal/);

    // 3. Verify Top Header is minimal
    const header = page.locator('div.sticky.top-0');
    await expect(header).toContainText('MAEPLE');
    // Ensure sync indicator and user menu from old header are gone (should not be in this header)
    await expect(header.locator('button:has-text("Install")')).toBeHidden(); // Hidden on mobile

    // 4. Verify Bottom Navigation
    const bottomNav = page.locator('div.fixed.bottom-0');
    await expect(bottomNav.getByRole('link', { name: 'Patterns' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Reflect' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Capture' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Guide' })).toBeVisible();

    // 5. Test Navigation - Patterns
    await bottomNav.getByRole('link', { name: 'Patterns' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 6. Test Navigation - Reflect
    await bottomNav.getByRole('link', { name: 'Reflect' }).click();
    await expect(page).toHaveURL(/\/bio-mirror/);

    // 7. Test Navigation - Guide
    await bottomNav.getByRole('link', { name: 'Guide' }).click();
    await expect(page).toHaveURL(/\/coach/);

    // 8. Test User Menu
    const userPrefix = testEmail.split('@')[0];
    const userInitial = testEmail[0].toUpperCase();
    const userButtonLabel = `${userInitial} ${userPrefix}`;
    
    // The button might have multiple elements, so we use a more flexible selector if needed
    // In our manual test it was "T test" for "test@example.com"
    const userButton = bottomNav.getByRole('button', { name: new RegExp(`${userInitial}\\s*${userPrefix}`, 'i') });
    await userButton.click();

    // Verify Menu Items
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Guide' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();

    // 9. Navigate to Settings
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings/);

    // 10. Sign Out
    await userButton.click();
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
