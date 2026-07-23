import { test } from '@playwright/test';
import { canonicalRoutes } from './canonicalRoutes';
import { expectNoDocumentOverflow, waitForCanonicalSurface } from './testSupport';

test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1231, height: 768 } });

test.describe('42 canonical page visual evidence', () => {
  for (const route of canonicalRoutes) {
    test(`${route.id} captures first viewport and full page`, async ({ page }) => {
      await page.goto(route.path);
      await waitForCanonicalSurface(page, route.id, route.title);
      await expectNoDocumentOverflow(page);

      await page.screenshot({
        path: `test-results/density-review/${route.id}-first.png`,
        animations: 'disabled',
      });
      await page.screenshot({
        path: `test-results/density-review/${route.id}-full.png`,
        animations: 'disabled',
        fullPage: true,
      });
    });
  }
});
