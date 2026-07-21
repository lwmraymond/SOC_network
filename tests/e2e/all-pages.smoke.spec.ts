import { test, expect } from '@playwright/test';
import { canonicalRoutes } from './canonicalRoutes';
import { collectRuntimeErrors, expectNoDocumentOverflow, expectNoRuntimeErrors, waitForCanonicalSurface } from './testSupport';

test.describe.configure({ mode: 'serial' });

test.describe('42 canonical page smoke', () => {
  for (const route of canonicalRoutes) {
    test(`${route.id} ${route.title} renders without fatal error or overflow`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page);
      await page.goto(route.path);
      await waitForCanonicalSurface(page, route.id, route.title);

      if (route.id === 'P05') {
        await expect(page.locator('[role="dialog"]')).toHaveCount(0);
      }
      if (route.id === 'P32') {
        await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 20_000 });
      }

      await expectNoDocumentOverflow(page);
      await expectNoRuntimeErrors(runtimeErrors);
    });
  }
});