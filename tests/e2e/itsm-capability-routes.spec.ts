import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { canonicalRoutes } from './canonicalRoutes';
import { collectRuntimeErrors, expectNoDocumentOverflow, expectNoRuntimeErrors, waitForCanonicalSurface } from './testSupport';

const ticketCases = [
  { route: '/itsm/tickets/REQ-6201', heading: /REQ-6201/, kind: 'Service request', specificTab: 'Request form' },
  { route: '/itsm/tickets/INC-7001', heading: /INC-7001/, kind: 'Incident', specificText: 'Affected objects' },
  { route: '/itsm/tickets/PRB-3104', heading: /PRB-3104/, kind: 'Problem', specificTab: 'RCA' },
  { route: '/itsm/tickets/CHG-4208', heading: /CHG-4208/, kind: 'Change', specificTab: 'Rollback' },
] as const;

const visualRoutes = [
  { name: 'ticket-conversation', route: '/itsm/tickets/INC-7001', heading: /INC-7001/, afterLoad: async (page: import('@playwright/test').Page) => page.getByRole('tab', { name: 'Conversation' }).click() },
  { name: 'sla-administration', route: '/itsm/sla', heading: 'SLA administration' },
  { name: 'automation-administration', route: '/itsm/automation', heading: 'Automation administration' },
  { name: 'notifications-inbound-mail', route: '/itsm/notifications', heading: 'Notifications & inbound mail' },
] as const;

const existingItsmAuditRoutes = canonicalRoutes.filter(({ id }) =>
  ['P13', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P34'].includes(id),
);

const viewports = [
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
  { width: 3840, height: 2160 },
] as const;

async function expectCapabilityContextInFlow(page: import('@playwright/test').Page) {
  const metrics = await page.locator('.itsmCapabilityContext').evaluate((element) => {
    const contextRect = element.getBoundingClientRect();
    const badgeWidth = element.querySelector('.euiBadge')?.getBoundingClientRect().width ?? 0;
    let next = element.nextElementSibling;
    while (next && (next.getBoundingClientRect().height === 0 || next.classList.contains('euiSpacer'))) next = next.nextElementSibling;
    return {
      position: getComputedStyle(element).position,
      contextBottom: contextRect.bottom,
      nextTop: next?.getBoundingClientRect().top ?? contextRect.bottom,
      badgeWidth,
    };
  });
  expect(['absolute', 'fixed', 'sticky']).not.toContain(metrics.position);
  expect(metrics.nextTop).toBeGreaterThanOrEqual(metrics.contextBottom - 1);
  expect(metrics.badgeWidth).toBeGreaterThan(0);
  expect(metrics.badgeWidth).toBeLessThan(320);
}

test.describe('ITSM capability framework', () => {
  test('renders four differentiated ticket types through the shared workspace', async ({ context }) => {
    for (const item of ticketCases) {
      const page = await context.newPage();
      const runtimeErrors = collectRuntimeErrors(page);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(item.route, { waitUntil: 'networkidle' });
      await expect(page.locator('.itsmCapabilityPage[data-capability-state="ready"]')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: item.heading })).toBeVisible();
      await expect(page.getByText(item.kind, { exact: true }).first()).toBeVisible();
      if ('specificTab' in item) await expect(page.getByRole('tab', { name: item.specificTab })).toBeVisible();
      if ('specificText' in item) await expect(page.getByText(item.specificText, { exact: true })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Conversation' })).toBeVisible();
      await expect(page.getByText('Production adapter unavailable')).toHaveCount(0);
      await expectCapabilityContextInFlow(page);
      await expectNoDocumentOverflow(page);
      await expectNoRuntimeErrors(runtimeErrors);
      await page.close();
    }
  });

  test('captures the four critical capability routes at all target viewports', async ({ context }) => {
    for (const viewport of viewports) {
      const directory = join('artifacts', 'itsm-capability-screenshots', `${viewport.width}x${viewport.height}`);
      await mkdir(directory, { recursive: true });
      for (const item of visualRoutes) {
        const page = await context.newPage();
        const runtimeErrors = collectRuntimeErrors(page);
        await page.setViewportSize(viewport);
        await page.goto(item.route, { waitUntil: 'networkidle' });
        await expect(page.locator('.itsmCapabilityPage[data-capability-state="ready"]')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1, name: item.heading })).toBeVisible();
        await page.evaluate(async () => document.fonts.ready);
        if ('afterLoad' in item) await item.afterLoad(page);
        await expectCapabilityContextInFlow(page);
        if (item.name === 'ticket-conversation') {
          const panelTops = await page.locator('.itsmConversationLayout > .euiPanel').evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().top)));
          expect(new Set(panelTops).size).toBe(1);
        }
        await expectNoDocumentOverflow(page);
        await page.screenshot({ path: join(directory, `${item.name}.png`), fullPage: true, animations: 'disabled' });
        await expectNoRuntimeErrors(runtimeErrors);
        await page.close();
      }
    }
  });

  for (const route of existingItsmAuditRoutes) {
    test(`captures ${route.id} ${route.title} first viewport and full page`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page);
      const firstViewportDirectory = join('artifacts', 'itsm-existing-page-audit', '1440x900', 'first-viewport');
      const fullPageDirectory = join('artifacts', 'itsm-existing-page-audit', '1440x900', 'full-page');
      await Promise.all([
        mkdir(firstViewportDirectory, { recursive: true }),
        mkdir(fullPageDirectory, { recursive: true }),
      ]);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path);
      await waitForCanonicalSurface(page, route.id, route.title);
      await page.evaluate(async () => document.fonts.ready);
      await expectNoDocumentOverflow(page);
      await page.screenshot({ path: join(firstViewportDirectory, `${route.id}.png`), animations: 'disabled' });
      await page.screenshot({ path: join(fullPageDirectory, `${route.id}.png`), fullPage: true, animations: 'disabled' });
      await expectNoRuntimeErrors(runtimeErrors);
    });
  }
});
