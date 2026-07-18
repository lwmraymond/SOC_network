import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/analyzer/search');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('heading', { name: 'Event Search & Hunt' })).toBeVisible();
  await expect(page.getByText('Loading query execution')).toBeHidden();
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

test('query, URL, pagination, filter, flyout, export receipt, history', async ({ page }) => {
  const query = page.getByRole('searchbox', { name: 'Event query' });
  await query.fill('analyst1');
  await page.getByRole('button', { name: 'Run query' }).click();
  await expect(page).toHaveURL(/q=analyst1/);

  await page.getByRole('button', { name: 'Advanced filter builder' }).click();
  await expect(page.getByRole('heading', { name: 'Advanced filter builder' })).toBeVisible();
  await page.getByRole('button', { name: 'Add severity:high' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Severity is high')).toBeVisible();

  const firstEvent = page.getByRole('button', { name: /evt-/ }).first();
  if (await firstEvent.isVisible()) {
    await firstEvent.click();
    await expect(page.getByRole('heading', { name: 'Event inspector' })).toBeVisible();
    await expect(page.getByText(/Route, row, field, action and export/)).toBeVisible();
    await page.keyboard.press('Escape');
  }

  await page.getByRole('button', { name: 'Export results' }).click();
  await expect(page.getByRole('heading', { name: 'Create export job' })).toBeVisible();
  await page.getByRole('button', { name: 'Queue export' }).click();
  await expect(page.getByRole('heading', { name: 'Action receipt' })).toBeVisible();
  await expect(page.getByText(/queued are not completed/i)).toBeVisible();
  await page.goBack();
});

test('structured error denied stale partial states', async ({ page }) => {
  for (const [query, label] of [
    ['network:error', 'error'],
    ['denied:true', 'denied'],
    ['stale:true', 'stale'],
    ['partial:true', 'partial'],
  ]) {
    await page.goto(`/analyzer/search?q=${encodeURIComponent(query)}`);
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
});

test('axe ready, builder and modal', async ({ page }) => {
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole('button', { name: 'Advanced filter builder' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Export results' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
