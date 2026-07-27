import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { collectRuntimeErrors, expectNoDocumentOverflow, expectNoRuntimeErrors, waitForCanonicalSurface } from './testSupport';

const ticketCases = [
  { route: '/itsm/tickets/REQ-6201', heading: /REQ-6201/, kind: 'Service request', specificTab: 'Request form' },
  { route: '/itsm/tickets/INC-7001', heading: /INC-7001/, kind: 'Incident', specificText: 'Affected objects' },
  { route: '/itsm/tickets/PRB-3104', heading: /PRB-3104/, kind: 'Problem', specificTab: 'RCA' },
  { route: '/itsm/tickets/CHG-4208', heading: /CHG-4208/, kind: 'Change', specificTab: 'Rollback' },
] as const;

const visualRoutes = [
  { name: 'ticket-conversation', route: '/itsm/tickets/INC-7001', heading: /INC-7001/, afterLoad: async (page: Page) => page.getByRole('tab', { name: 'Conversation' }).click(), management: false },
  { name: 'sla-administration', route: '/itsm/sla', heading: 'SLA administration', management: true },
  { name: 'automation-administration', route: '/itsm/automation', heading: 'Automation administration', management: true },
  { name: 'notifications-inbound-mail', route: '/itsm/notifications', heading: 'Notifications & inbound mail', management: true },
] as const;

const viewports = [
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
  { width: 3840, height: 2160 },
] as const;

const themes = ['light', 'dark'] as const;

async function waitForItsmReady(page: Page, heading: string | RegExp) {
  await expect(page.locator('.itsmCapabilityPage[data-capability-state="ready"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await page.evaluate(async () => document.fonts.ready);
}

async function expectCapabilityContextInFlow(page: Page) {
  const metrics = await page.locator('.itsmCapabilityContext').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const badgeWidth = element.querySelector('.euiBadge')?.getBoundingClientRect().width ?? 0;
    let next = element.nextElementSibling;
    while (next && (next.getBoundingClientRect().height === 0 || next.classList.contains('euiSpacer'))) next = next.nextElementSibling;
    return {
      position: getComputedStyle(element).position,
      contextBottom: rect.bottom,
      nextTop: next?.getBoundingClientRect().top ?? rect.bottom,
      badgeWidth,
    };
  });
  expect(['absolute', 'fixed', 'sticky']).not.toContain(metrics.position);
  expect(metrics.nextTop).toBeGreaterThanOrEqual(metrics.contextBottom - 1);
  expect(metrics.badgeWidth).toBeGreaterThan(0);
  expect(metrics.badgeWidth).toBeLessThan(420);
}

async function expectLightKibanaHierarchy(page: Page) {
  const metrics = await page.evaluate(() => {
    const parse = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
    const luminance = (value: string) => {
      const [r, g, b] = parse(value).map((component) => component / 255).map((component) => component <= 0.03928 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const header = document.querySelector('.itsmCapabilityPage .euiPageHeader') as HTMLElement | null;
    const title = document.querySelector('.itsmCapabilityPage h1') as HTMLElement | null;
    const bodyBackground = getComputedStyle(document.body).backgroundColor;
    const headerBackground = header ? getComputedStyle(header).backgroundColor : 'rgb(255,255,255)';
    return {
      bodyLuminance: luminance(bodyBackground),
      headerLuminance: luminance(headerBackground),
      headerHeight: header?.getBoundingClientRect().height ?? 0,
      titleColorLuminance: title ? luminance(getComputedStyle(title).color) : 1,
    };
  });
  expect(metrics.bodyLuminance).toBeGreaterThan(0.65);
  expect(metrics.headerLuminance).toBeGreaterThan(0.55);
  expect(metrics.headerHeight).toBeLessThan(132);
  expect(metrics.titleColorLuminance).toBeLessThan(0.45);
}

async function expectWarningContrast(page: Page) {
  const failures = await page.evaluate(() => {
    const parse = (value: string) => {
      const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return { r: parts[0] ?? 0, g: parts[1] ?? 0, b: parts[2] ?? 0, a: parts[3] ?? 1 };
    };
    const relative = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const values = [r, g, b].map((value) => value / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
    };
    const ratio = (a: ReturnType<typeof parse>, b: ReturnType<typeof parse>) => {
      const one = relative(a);
      const two = relative(b);
      return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
    };
    const backgroundFor = (element: Element) => {
      let current: Element | null = element;
      while (current) {
        const style = getComputedStyle(current);
        const background = parse(style.backgroundColor);
        if (background.a > 0.05) return background;
        const before = parse(getComputedStyle(current, '::before').backgroundColor);
        if (before.a > 0.05) return before;
        current = current.parentElement;
      }
      return parse(getComputedStyle(document.body).backgroundColor);
    };
    return Array.from(document.querySelectorAll('.euiCallOut--warning, .euiCallOut--danger, .euiBadge'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (element.textContent?.trim().length ?? 0) > 0;
      })
      .map((element) => {
        const style = getComputedStyle(element);
        const contrast = ratio(parse(style.color), backgroundFor(element));
        return { text: element.textContent?.trim().slice(0, 80), contrast };
      })
      .filter((item) => item.contrast < 3.8);
  });
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
}

async function expectManagementDensity(page: Page) {
  const ratio = await page.locator('.itsmManagementContent').evaluate((element) => element.getBoundingClientRect().height / window.innerHeight);
  expect(ratio).toBeGreaterThanOrEqual(0.35);
  await expect(page.locator('.itsmKpiStrip .euiPanel')).toHaveCount(5);
  await expect(page.locator('.itsmManagementSecondary > .euiPanel')).toHaveCount(3);
}

test.describe.configure({ mode: 'serial' });

test.describe('ITSM v2 integration and acceptance', () => {
  test('renders four differentiated ticket types through the shared workspace', async ({ context }) => {
    for (const item of ticketCases) {
      const page = await context.newPage();
      const runtimeErrors = collectRuntimeErrors(page);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${item.route}?theme=light`, { waitUntil: 'networkidle' });
      await waitForItsmReady(page, item.heading);
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

  test('P16 service impact uses the owned grid without concatenated geometry', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/itsm/incidents?theme=light', { waitUntil: 'networkidle' });
    await waitForCanonicalSurface(page, 'P16', 'Incident Management');
    const geometry = await page.locator('.page-p16 .serviceImpactMap').evaluate((element) => {
      const children = Array.from(element.children) as HTMLElement[];
      const rects = children.map((child) => ({
        text: child.firstChild?.textContent?.trim() ?? child.textContent?.trim() ?? '',
        position: getComputedStyle(child).position,
        left: child.getBoundingClientRect().left,
        right: child.getBoundingClientRect().right,
        top: child.getBoundingClientRect().top,
        bottom: child.getBoundingClientRect().bottom,
      }));
      const overlaps: string[] = [];
      for (let index = 0; index < rects.length; index += 1) {
        for (let other = index + 1; other < rects.length; other += 1) {
          const a = rects[index];
          const b = rects[other];
          const intersects = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
          if (intersects) overlaps.push(`${a.text}/${b.text}`);
        }
      }
      return { display: getComputedStyle(element).display, columns: getComputedStyle(element).gridTemplateColumns, rects, overlaps };
    });
    expect(geometry.display).toBe('grid');
    expect(geometry.columns).not.toBe('none');
    expect(geometry.rects.every((item) => item.position === 'static')).toBe(true);
    expect(geometry.overlaps).toEqual([]);
    await expectNoDocumentOverflow(page);
    await expectNoRuntimeErrors(runtimeErrors);
  });

  test('conversation rehydrates public/internal comments, mentions, email source and attachment placeholders', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/itsm/tickets/INC-7001?theme=light', { waitUntil: 'networkidle' });
    await waitForItsmReady(page, /INC-7001/);
    await page.getByRole('tab', { name: 'Conversation' }).click();
    await expect(page.getByText(/sourceMessageId <msg-7001@example.invalid>/)).toBeVisible();

    await page.getByRole('button', { name: 'Add attachment placeholder' }).click();
    await expect(page.getByText(/No bytes were uploaded/)).toBeVisible();
    await page.getByPlaceholder('Write a requester-visible update…').fill('Public review update for @requester.');
    await page.getByRole('button', { name: 'Preview before send' }).click();
    await expect(page.getByRole('button', { name: 'Confirm queued send' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm queued send' }).click();
    await expect(page.getByText('Public review update for @requester.')).toBeVisible();
    await expect(page.getByText('Mentions: @requester')).toBeVisible();
    await expect(page.getByText(/authoritative:false/)).toBeVisible();

    await page.getByRole('tab', { name: 'Internal note' }).click();
    await page.getByPlaceholder('Write an internal operational note…').fill('Internal review note for @identity-oncall.');
    await page.getByRole('button', { name: 'Preview before send' }).click();
    await page.getByRole('button', { name: 'Confirm queued send' }).click();
    const internal = page.locator('[data-comment-visibility="internal"]', { hasText: 'Internal review note' });
    await expect(internal).toBeVisible();
    await expect(internal.getByText('Mentions: @identity-oncall')).toBeVisible();
    await expectNoRuntimeErrors(runtimeErrors);
  });

  test('sidebar excludes detail workflow and P14-P18 enter it with restorable parent context', async ({ context }) => {
    const cases = [
      { route: '/itsm/queues?review=sla-risk', pageId: 'P14', title: 'Work Queues', open: async (page: Page) => page.locator('[data-visual-region="queue-command-and-grid"] tbody tr').first().locator('td').nth(2).locator('button').first().click() },
      { route: '/itsm/requests?review=my-requests', pageId: 'P15', title: 'Requests & Service Catalog', open: async (page: Page) => { await page.getByRole('tab', { name: 'My requests' }).click(); await page.locator('[data-visual-region="my-requests-grid"] tbody tr').first().locator('button').first().click(); } },
      { route: '/itsm/incidents?review=active', pageId: 'P16', title: 'Incident Management', open: async (page: Page) => page.locator('[data-visual-region="incident-queue"] tbody tr').first().locator('button').first().click() },
      { route: '/itsm/problems?review=rca', pageId: 'P17', title: 'Problem Management', open: async (page: Page) => page.getByRole('button', { name: 'Open shared detail' }).first().click() },
      { route: '/itsm/changes?review=cab', pageId: 'P18', title: 'Change Management', open: async (page: Page) => { await page.getByRole('tab', { name: 'Queue' }).click(); await page.locator('[data-visual-region="change-queue"] tbody tr').first().locator('button').first().click(); } },
    ] as const;

    for (const item of cases) {
      const page = await context.newPage();
      await page.goto(`${item.route}&theme=light`, { waitUntil: 'networkidle' });
      await waitForCanonicalSurface(page, item.pageId, item.title);
      await expect(page.locator('aside.sidebar')).not.toContainText('Ticket Detail Workspace');
      await item.open(page);
      await expect(page).toHaveURL(/\/itsm\/tickets\//);
      await waitForItsmReady(page, /REQ-|INC-|PRB-|CHG-/);
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(item.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await page.goForward();
      await expect(page).toHaveURL(/\/itsm\/tickets\//);
      await page.getByRole('button', { name: item.title }).click();
      await expect(page).toHaveURL(new RegExp(item.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await page.close();
    }
  });

  test('P22 exposes the three dedicated administration entry points', async ({ page }) => {
    await page.goto('/itsm/settings?theme=light', { waitUntil: 'networkidle' });
    await waitForCanonicalSurface(page, 'P22', 'ITSM Settings');
    await expect(page.getByRole('link', { name: 'SLA Administration' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Automation Administration' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Notifications & Inbound Mail' })).toBeVisible();
  });

  test('captures light and dark acceptance evidence at all target viewports', async ({ context }) => {
    for (const theme of themes) {
      for (const viewport of viewports) {
        const baseDirectory = join('artifacts', 'itsm-capability-screenshots', theme, `${viewport.width}x${viewport.height}`);
        await mkdir(join(baseDirectory, 'first-viewport'), { recursive: true });
        await mkdir(join(baseDirectory, 'full-page'), { recursive: true });
        for (const item of visualRoutes) {
          const page = await context.newPage();
          const runtimeErrors = collectRuntimeErrors(page);
          await page.setViewportSize(viewport);
          const separator = item.route.includes('?') ? '&' : '?';
          await page.goto(`${item.route}${separator}theme=${theme}`, { waitUntil: 'networkidle' });
          await waitForItsmReady(page, item.heading);
          if ('afterLoad' in item) await item.afterLoad(page);
          await expectCapabilityContextInFlow(page);
          if (item.name === 'ticket-conversation') {
            const panelTops = await page.locator('.itsmConversationLayout > .euiPanel').evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().top)));
            expect(new Set(panelTops).size).toBe(1);
          }
          if (item.management && viewport.width === 3840) await expectManagementDensity(page);
          if (theme === 'light') await expectLightKibanaHierarchy(page);
          await expectWarningContrast(page);
          await expectNoDocumentOverflow(page);
          await page.screenshot({ path: join(baseDirectory, 'first-viewport', `${item.name}.png`), fullPage: false, animations: 'disabled' });
          await page.screenshot({ path: join(baseDirectory, 'full-page', `${item.name}.png`), fullPage: true, animations: 'disabled' });
          await expectNoRuntimeErrors(runtimeErrors);
          await page.close();
        }
      }
    }
  });
});
