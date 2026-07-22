import { test, expect } from '@playwright/test';
import { canonicalRoutes, p0Routes } from './canonicalRoutes';
import { expectNoDocumentOverflow, waitForCanonicalSurface } from './testSupport';

test.describe.configure({ mode: 'serial' });

test.describe('canonical routes at 1440 × 900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of canonicalRoutes) {
    test(`${route.id} resolves and contains horizontal overflow`, async ({ page }) => {
      await page.goto(route.path);
      await waitForCanonicalSurface(page, route.id, route.title);
      await expectNoDocumentOverflow(page);
    });
  }
});

test.describe('P0 focused height at 1280 × 720', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const route of p0Routes) {
    test(`${route.id} default state remains within 2.5 viewports`, async ({ page }) => {
      await page.goto(route.path);
      await waitForCanonicalSurface(page, route.id, route.title);
      const metrics = await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        viewport: window.innerHeight,
        width: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(metrics.height, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewport * 2.5);
      expect(metrics.width, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    });
  }
});