import { test, expect } from '@playwright/test';

test('Dashboard ohne Session leitet zur Anmeldung um', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
