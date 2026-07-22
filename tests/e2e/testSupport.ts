import { expect, type Page } from '@playwright/test';

export function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

export async function waitForCanonicalSurface(page: Page, pageId: string, title: string) {
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  if (pageId === 'P07') {
    await expect(page.locator('.p07Composition')).toBeVisible();
  } else {
    await expect(page.locator(`[data-page-id="${pageId}"][data-fixture-ready="true"]`)).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: 'Route not found' })).toHaveCount(0);
}

export async function expectNoDocumentOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(overflow.documentWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(overflow.bodyWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

export async function expectNoRuntimeErrors(errors: string[]) {
  expect(errors, errors.join('\n')).toEqual([]);
}