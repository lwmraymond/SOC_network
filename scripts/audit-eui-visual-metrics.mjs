import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/* global document, getComputedStyle */

const routes = [
  ['P01', '/dashboard/soc'], ['P02', '/dashboard/executive'], ['P03', '/dashboard/platform-health'],
  ['P04', '/analyzer/cases'], ['P05', '/analyzer/alerts'], ['P06', '/analyzer/response-actions'],
  ['P07', '/analyzer/search'], ['P08', '/devices/inventory'], ['P09', '/devices/vulnerabilities'],
  ['P10', '/devices/vulnerability-matches'], ['P11', '/devices/remediation'], ['P12', '/devices/assets/asset-demo'],
  ['P13', '/itsm/overview'], ['P14', '/itsm/queues'], ['P15', '/itsm/requests'],
  ['P16', '/itsm/incidents'], ['P17', '/itsm/problems'], ['P18', '/itsm/changes'],
  ['P19', '/itsm/approvals'], ['P20', '/itsm/analytics'], ['P21', '/itsm/reports'],
  ['P22', '/itsm/settings'], ['P23', '/copilot'], ['P24', '/agents'], ['P25', '/agents/tasks'],
  ['P26', '/agents/runtime-access'], ['P27', '/runtime?audit=1'], ['P28', '/runtime/data-sources'],
  ['P29', '/runtime/rules'], ['P30', '/runtime/events'], ['P31', '/runtime/objects'],
  ['P32', '/runtime/script-workbench'], ['P33', '/knowledge/sources'], ['P34', '/knowledge/playbooks'],
  ['P35', '/knowledge/detection-notes'], ['P36', '/projects/responses'], ['P37', '/admin/users'],
  ['P38', '/admin/roles'], ['P39', '/admin/permissions'], ['P40', '/settings?audit=1'],
  ['P41', '/settings/authentication'], ['P42', '/settings/theme'],
];

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const screenshots = args.has('--screenshots');
const baseUrl = process.env.SOC_E2E_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5174';
const outputDir = path.resolve(process.env.EUI_AUDIT_OUTPUT_DIR ?? 'artifacts/eui-visual-audit');
const viewport = { width: Number(process.env.EUI_AUDIT_WIDTH ?? 1231), height: Number(process.env.EUI_AUDIT_HEIGHT ?? 768) };

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport, colorScheme: 'dark', reducedMotion: 'reduce' });
const page = await context.newPage();
const results = [];

for (const [id, route] of routes) {
  const runtimeErrors = [];
  const onPageError = (error) => runtimeErrors.push(error.message);
  page.on('pageerror', onPageError);
  await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'networkidle' });
  await page.locator(id === 'P07' ? '.p07Composition' : `[data-page-id="${id}"]`).waitFor({ state: 'visible', timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);

  const metrics = await page.evaluate(({ pageId, viewportWidth }) => {
    const issues = [];
    const add = (rule, severity, message, element, value, threshold) => {
      const rect = element?.getBoundingClientRect?.();
      issues.push({
        rule, severity, message, value, threshold,
        selector: element ? describe(element) : undefined,
        rect: rect ? { x: round(rect.x), y: round(rect.y), width: round(rect.width), height: round(rect.height) } : undefined,
      });
    };
    const round = (value) => Math.round(value * 100) / 100;
    const describe = (element) => {
      const idPart = element.id ? `#${element.id}` : '';
      const classes = [...element.classList].slice(0, 3).map((name) => `.${name}`).join('');
      const region = element.closest('[data-visual-region]')?.getAttribute('data-visual-region');
      return `${region ? `[data-visual-region="${region}"] ` : ''}${element.tagName.toLowerCase()}${idPart}${classes}`;
    };
    const intersect = (rect, clip, clipX, clipY) => {
      const left = clipX ? Math.max(rect.left, clip.left) : rect.left;
      const right = clipX ? Math.min(rect.right, clip.right) : rect.right;
      const top = clipY ? Math.max(rect.top, clip.top) : rect.top;
      const bottom = clipY ? Math.min(rect.bottom, clip.bottom) : rect.bottom;
      return { left, right, top, bottom, x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
    };
    const visibleRect = (element) => {
      const rect = element.getBoundingClientRect();
      let clipped = intersect(rect, { left: 0, right: document.documentElement.clientWidth, top: rect.top, bottom: rect.bottom }, true, false);
      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) <= 0) return null;
        if (current !== element) {
          const ancestorRect = current.getBoundingClientRect();
          const clipX = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX);
          const clipY = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowY);
          if (clipX || clipY) clipped = intersect(clipped, ancestorRect, clipX, clipY);
        }
        if (clipped.width <= 1 || clipped.height <= 1) return null;
      }
      return clipped;
    };
    const visible = (element) => Boolean(visibleRect(element));
    const rgba = (value) => {
      const values = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return values.length >= 3 ? [values[0], values[1], values[2], values[3] ?? 1] : [0, 0, 0, 0];
    };
    const composite = (front, back) => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [0, 1, 2].map((index) => (front[index] * front[3] + back[index] * back[3] * (1 - front[3])) / alpha).concat(alpha);
    };
    const paintLayers = (element) => {
      const layers = [rgba(getComputedStyle(element).backgroundColor)];
      for (const pseudo of ['::before', '::after']) {
        const style = getComputedStyle(element, pseudo);
        if (style.content !== 'none' && style.display !== 'none' && Number(style.opacity) > 0) layers.push(rgba(style.backgroundColor));
      }
      return layers;
    };
    const background = (element) => {
      const ancestors = [];
      for (let current = element; current; current = current.parentElement) ancestors.push(current);
      return ancestors.reverse().flatMap(paintLayers).reduce((color, layer) => composite(layer, color), [7, 16, 31, 1]);
    };
    const luminance = (color) => {
      const channel = (value) => { const normalized = value / 255; return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4; };
      return .2126 * channel(color[0]) + .7152 * channel(color[1]) + .0722 * channel(color[2]);
    };
    const contrast = (first, second) => { const a = luminance(first); const b = luminance(second); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };

    const root = document.querySelector(`[data-page-id="${pageId}"]`) ?? document.querySelector('.p07Composition');
    const header = document.querySelector('[data-visual-region="page-header"], [data-visual-region="workflow-header"]');
    if (header && visible(header)) {
      const rect = header.getBoundingClientRect();
      if (rect.height > 104) add('page-header-height', 'P1', `Page header is ${round(rect.height)}px high`, header, round(rect.height), 104);
      const description = header.querySelector('[class*="description"], p');
      if (description) {
        const gap = rect.bottom - description.getBoundingClientRect().bottom;
        if (gap > 24) add('page-header-trailing-space', 'P1', `${round(gap)}px blank space below the title description`, header, round(gap), 24);
      }
    }

    document.querySelectorAll('h1,h2,h3').forEach((heading) => {
      if (!visible(heading)) return;
      const style = getComputedStyle(heading);
      const rect = heading.getBoundingClientRect();
      const ownBg = rgba(style.backgroundColor);
      // A panel background is not a title bar. Flag only paint owned by the heading itself.
      if (ownBg[3] > .05 && rect.width > viewportWidth * .45) {
        add('colored-title-bar', 'P1', 'Heading is rendered as a wide colored surface instead of plain Kibana title text', heading, round(rect.width), round(viewportWidth * .45));
      }
    });

    const textSelector = 'h1,h2,h3,p,li,td,th,dt,dd,small,label,button,.euiBadge';
    document.querySelectorAll(textSelector).forEach((element) => {
      if (!visible(element) || !element.textContent.trim()) return;
      if (element.querySelector(textSelector)) return;
      const style = getComputedStyle(element);
      const foreground = rgba(style.color);
      const bg = background(element);
      const ratio = contrast(foreground, bg);
      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
      const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const minimum = large ? 3 : 4.5;
      if (ratio + .01 < minimum) add('text-contrast', ratio < 3 ? 'P0' : 'P1', `Text contrast is ${round(ratio)}:1`, element, round(ratio), minimum);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const normalText = element.matches('p:not(.euiTitle),li,td,th,dt,dd,small,label');
      const standardCompactLeading = fontSize <= 12.1 && lineHeight >= 16;
      // The standard explicitly permits 12/16 supporting and 11/16 metadata text.
      if (normalText && Number.isFinite(lineHeight) && fontSize >= 11 && !standardCompactLeading && lineHeight / fontSize < 1.35) {
        add('line-height', 'P2', `Line-height ratio is ${round(lineHeight / fontSize)}`, element, round(lineHeight / fontSize), 1.35);
      }
    });

    document.querySelectorAll('.euiBadge').forEach((badge) => {
      if (!visible(badge)) return;
      const rect = badge.getBoundingClientRect();
      const parentWidth = badge.parentElement?.getBoundingClientRect().width ?? rect.width;
      if (rect.width > 240 || (parentWidth > 240 && rect.width / parentWidth > .5)) {
        add('stretched-badge', 'P1', `Badge spans ${round(rect.width)}px`, badge, round(rect.width), Math.min(240, round(parentWidth * .5)));
      }
    });

    document.querySelectorAll('tbody tr').forEach((row) => {
      if (!visible(row)) return;
      const height = row.getBoundingClientRect().height;
      if (height < 40) add('table-row-height', 'P2', `Table row is only ${round(height)}px high`, row, round(height), 40);
    });

    document.querySelectorAll('[aria-selected="true"],[aria-pressed="true"]').forEach((selected) => {
      if (!visible(selected)) return;
      const bg = background(selected);
      const fg = rgba(getComputedStyle(selected).color);
      if (luminance(bg) > .72 && luminance(fg) > .45) {
        add('light-selected-surface', 'P0', 'Selected surface resolves to a light background with light text in dark mode', selected, round(contrast(fg, bg)), 4.5);
      }
    });

    document.querySelectorAll('p,li,td,th,dt,dd,small,label,button,.euiBadge').forEach((element) => {
      if (!visible(element)) return;
      const style = getComputedStyle(element);
      const clippedX = element.scrollWidth > element.clientWidth + 1;
      const clippedY = element.scrollHeight > element.clientHeight + 1;
      const ownsScroll = ['auto', 'scroll'].includes(style.overflowX) || ['auto', 'scroll'].includes(style.overflowY);
      const intentionallyEllipsized = style.textOverflow === 'ellipsis';
      if ((clippedX || clippedY) && !ownsScroll && !intentionallyEllipsized) {
        add('text-clipping', 'P1', `Text is clipped (${element.clientWidth}×${element.clientHeight} vs ${element.scrollWidth}×${element.scrollHeight})`, element, `${element.scrollWidth}×${element.scrollHeight}`, `${element.clientWidth}×${element.clientHeight}`);
      }
    });

    const textBoxes = [...document.querySelectorAll('h1,h2,h3,p,li,td,th,dt,dd,small,label,button,.euiBadge,span,strong')]
      .filter((element) => !element.closest('pre,code,[class*="euiCodeBlock"]'))
      .filter((element) => visible(element) && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()))
      .slice(0, 400)
      .map((element) => ({ element, rect: visibleRect(element), region: element.closest('[data-visual-region]') }))
      .filter((item) => item.rect);
    textBoxes.sort((first, second) => first.rect.top - second.rect.top || first.rect.left - second.rect.left);
    const overlapKeys = new Set();
    for (let firstIndex = 0; firstIndex < textBoxes.length; firstIndex += 1) {
      const first = textBoxes[firstIndex];
      for (let secondIndex = firstIndex + 1; secondIndex < textBoxes.length; secondIndex += 1) {
        const second = textBoxes[secondIndex];
        if (second.rect.top >= first.rect.bottom - 1) break;
        if (first.region !== second.region || first.element.contains(second.element) || second.element.contains(first.element)) continue;
        const overlapX = Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left);
        const overlapY = Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top);
        if (overlapX > 1 && overlapY > 1) {
          const key = `${describe(first.element)}|${describe(second.element)}`;
          if (!overlapKeys.has(key)) {
            overlapKeys.add(key);
            add('text-overlap', 'P0', `Visible text boxes overlap by ${round(overlapX)}×${round(overlapY)}px with ${describe(second.element)}`, first.element, `${round(overlapX)}×${round(overlapY)}`, '≤1px');
          }
        }
      }
    }

    document.querySelectorAll('[data-visual-region] :is(article,li,button)').forEach((item) => {
      const regionName = item.closest('[data-visual-region]')?.getAttribute('data-visual-region') ?? '';
      // Compact scope/filter/command controls are not repeated queue or list records.
      if (!visible(item) || item.closest('nav,.sidebar,[role="tablist"],table') || /scope|filter|command|toolbar/.test(regionName) || item.textContent.trim().length < 20) return;
      const parentStyle = getComputedStyle(item.parentElement);
      const isRepeatedLayout = parentStyle.display === 'grid' || (parentStyle.display === 'flex' && parentStyle.flexDirection === 'column');
      const height = item.getBoundingClientRect().height;
      if (isRepeatedLayout && height < 36) add('repeated-item-height', 'P2', `Repeated item is only ${round(height)}px high`, item, round(height), 36);
    });

    const documentOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth;
    if (documentOverflow > 1) add('document-overflow', 'P0', `Document overflows horizontally by ${documentOverflow}px`, root, documentOverflow, 1);

    return {
      issueCount: issues.length,
      counts: issues.reduce((counts, issue) => ({ ...counts, [issue.severity]: (counts[issue.severity] ?? 0) + 1 }), {}),
      headerHeight: header ? round(header.getBoundingClientRect().height) : null,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      issues,
    };
  }, { pageId: id, viewportWidth: viewport.width });

  if (runtimeErrors.length) metrics.issues.unshift(...runtimeErrors.map((message) => ({ rule: 'runtime-error', severity: 'P0', message })));
  metrics.issueCount = metrics.issues.length;
  metrics.counts = metrics.issues.reduce((counts, issue) => ({ ...counts, [issue.severity]: (counts[issue.severity] ?? 0) + 1 }), {});
  results.push({ id, route, ...metrics });
  if (screenshots && metrics.issueCount) await page.screenshot({ path: path.join(outputDir, `${id}.png`), fullPage: true });
  page.off('pageerror', onPageError);
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(), baseUrl, viewport,
  pages: results.length,
  counts: results.flatMap((result) => result.issues).reduce((counts, issue) => ({ ...counts, [issue.severity]: (counts[issue.severity] ?? 0) + 1 }), {},),
  failingPages: results.filter((result) => (result.counts.P0 ?? 0) + (result.counts.P1 ?? 0) > 0).map((result) => result.id),
};
await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify({ summary, results }, null, 2)}\n`);

const markdown = [
  '# EUI visual metrics audit', '',
  `Generated: ${summary.generatedAt}`,
  `Base URL: ${baseUrl}`,
  `Viewport: ${viewport.width} × ${viewport.height}`,
  `Counts: P0 ${summary.counts.P0 ?? 0} · P1 ${summary.counts.P1 ?? 0} · P2 ${summary.counts.P2 ?? 0}`,
  '', '| Page | P0 | P1 | P2 | Header | Rules |', '|---|---:|---:|---:|---:|---|',
  ...results.map((result) => `| ${result.id} | ${result.counts.P0 ?? 0} | ${result.counts.P1 ?? 0} | ${result.counts.P2 ?? 0} | ${result.headerHeight ?? '—'}px | ${[...new Set(result.issues.map((issue) => issue.rule))].join(', ') || 'pass'} |`),
  '', '## Findings', '',
  ...results.flatMap((result) => result.issues.map((issue) => `- **${issue.severity} ${result.id} ${issue.rule}:** ${issue.message}${issue.selector ? ` — \`${issue.selector}\`` : ''}`)),
  '',
].join('\n');
await writeFile(path.join(outputDir, 'report.md'), markdown);

console.log(`EUI audit: P0 ${summary.counts.P0 ?? 0}, P1 ${summary.counts.P1 ?? 0}, P2 ${summary.counts.P2 ?? 0}`);
console.log(`Report: ${path.join(outputDir, 'report.md')}`);
if (strict && ((summary.counts.P0 ?? 0) > 0 || (summary.counts.P1 ?? 0) > 0)) process.exitCode = 1;
