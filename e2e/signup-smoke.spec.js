import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('welcome screen loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/welcome|vítejte/i)).toBeVisible({ timeout: 30_000 });
});
