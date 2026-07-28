import { expect, test, type Page } from '@playwright/test';
import { collectRuntimeErrors, expectNoDocumentOverflow, expectNoRuntimeErrors } from './testSupport';

test.use({ screenshot: 'off', trace: 'off', video: 'off' });

test.describe.configure({ mode: 'serial' });

const sections = ['Metadata', 'Schema', 'Workflow', 'Versions', 'Simulation', 'Runs'] as const;
const routes = [
  '/itsm/automation',
  '/itsm/automation/templates',
  '/itsm/automation/runtime',
  '/itsm/automation/runs/run-9001',
  ...sections.map((section) => `/itsm/automation/templates/template-major-incident?section=${section}`),
];

async function waitForReady(page: Page) {
  await expect(page.locator('.itsmCapabilityPage[data-capability-state="ready"]')).toBeVisible();
  await page.evaluate(async () => document.fonts.ready);
}

test('all Automation routes and Template Detail sections render without console or page errors', async ({ context }) => {
  for (const route of routes) {
    const page = await context.newPage();
    const errors = collectRuntimeErrors(page);
    const separator = route.includes('?') ? '&' : '?';
    await page.goto(`${route}${separator}theme=light`, { waitUntil: 'networkidle' });
    await waitForReady(page);
    await expect(page.getByRole('heading', { name: 'Route not found' })).toHaveCount(0);
    if (route.includes('section=Versions')) {
      await expect(page.getByRole('heading', { name: 'Version diff' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    }
    await expectNoRuntimeErrors(errors);
    await page.close();
  }
});

test('Automation pages have no document-level horizontal overflow at 1280 and 1440', async ({ context }) => {
  for (const width of [1280, 1440]) {
    for (const route of routes) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
      const separator = route.includes('?') ? '&' : '?';
      await page.goto(`${route}${separator}theme=light`, { waitUntil: 'networkidle' });
      await waitForReady(page);
      await expectNoDocumentOverflow(page);
      await page.close();
    }
  }
});
