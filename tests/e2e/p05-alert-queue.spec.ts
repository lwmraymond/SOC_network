import { test, expect } from '@playwright/test';
import { collectRuntimeErrors, expectNoRuntimeErrors, waitForCanonicalSurface } from './testSupport';

test.describe('P05 Alert Queue interactions', () => {
  test('default selection does not open an overlay and Page details remains reachable', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/analyzer/alerts');
    await waitForCanonicalSurface(page, 'P05', 'Alert Queue');

    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    const detailTrigger = page.getByRole('button', { name: 'Open full detail' });
    await expect(detailTrigger).toBeVisible();
    await detailTrigger.click();
    await expect(page.getByRole('heading', { name: 'Alert group evidence and rule outcome' })).toBeVisible();
    await page.getByRole('button', { name: 'Close detail' }).click();
    await expect(detailTrigger).toBeFocused();

    await page.getByRole('button', { name: 'Page details' }).click();
    await expect(page.getByRole('heading', { name: 'Page details' })).toBeVisible();
    await expectNoRuntimeErrors(runtimeErrors);
  });

  test('governed triage receipt remains queued and pending rehydration', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/analyzer/alerts');
    await waitForCanonicalSurface(page, 'P05', 'Alert Queue');

    await page.getByLabel('Select visible alert page').check();
    await page.getByRole('button', { name: /Triage selected/ }).click();
    await expect(page.getByRole('heading', { name: 'Alert triage impact preview' })).toBeVisible();
    await page.getByLabel('Confirm prototype queue submission').check();
    await page.getByRole('button', { name: 'Queue prototype action' }).click();

    const receipt = page.locator('.inlineReceipt');
    await expect(receipt).toBeVisible();
    await expect(receipt).toContainText('queued');
    await expect(receipt).toContainText('Authoritative rehydration: pending');
    await expectNoRuntimeErrors(runtimeErrors);
  });
});