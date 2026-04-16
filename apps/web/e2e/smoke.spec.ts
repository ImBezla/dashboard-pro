import { test, expect } from '@playwright/test';

test('Login-Seite lädt', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('img', { name: 'Dashboard Pro' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
});
