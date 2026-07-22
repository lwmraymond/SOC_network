import { chromium } from '@playwright/test';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

/* global document, getComputedStyle, location, Node, NodeFilter, Range, window */

const runFile = promisify(execFile);
const VERSION = 'information-density-v1.0.0';
const SOURCE_SHA = process.env.AUDIT_SOURCE_SHA;
const BASE_URL = process.env.SOC_E2E_BASE_URL ?? 'http://127.0.0.1:5174';
const OUTPUT = path.resolve(process.env.INFORMATION_DENSITY_OUTPUT_DIR ?? 'docs/design/audit-2026-07-22');
const CAPTURE = process.argv.includes('--capture');
const QUALITY = Number(process.env.INFORMATION_DENSITY_WEBP_QUALITY ?? 78);
const VIEWPORTS = [
  { name: '1231x768-primary', width: 1231, height: 768, capture: true },
  { name: '1440x900-structural', width: 1440, height: 900, capture: false },
  { name: '1200x768-table-overflow', width: 1200, height: 768, capture: false },
];
if (!SOURCE_SHA || !/^[0-9a-f]{40}$/i.test(SOURCE_SHA)) throw new Error('AUDIT_SOURCE_SHA must be the exact 40-character source commit.');

const sha256 = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');
const slug = (route) => route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

function classify(archetype = '') {
  if (/dashboard|analytics|wallboard|overview|health|posture/i.test(archetype)) return 'dashboard/analytics';
  if (/360|detail|investigation|evidence preview/i.test(archetype)) return 'entity/detail';
  if (/settings|directory|catalog|governance|provider topology|fleet readiness|access policy/i.test(archetype)) return 'settings/catalog';
  if (/workbench|authoring|conversation|graph|runner|schema|calendar|explorer|wizard|rollout/i.test(archetype)) return 'authoring/workbench';
  return 'queue/table';
}

async function catalog() {
  const routeSource = await readFile('tests/e2e/canonicalRoutes.ts', 'utf8');
  const pages = [...routeSource.matchAll(/\{\s*id:\s*'(?<id>P\d{2})',\s*path:\s*'(?<route>[^']+)',\s*title:\s*'(?<title>[^']+)'\s*\}/g)]
    .map(({ groups }) => ({ ...groups }));
  const specSource = await readFile('src/catalog/pageSpecs.ts', 'utf8');
  const archetypes = new Map();
  for (const match of specSource.matchAll(/definePage\(\{([\s\S]*?)\}\),/g)) {
    const id = match[1].match(/\bid:\s*'(P\d{2})'/)?.[1];
    const archetype = match[1].match(/\barchetype:\s*'([^']+)'/)?.[1];
    if (id && archetype) archetypes.set(id, archetype);
  }
  const expected = Array.from({ length: 42 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`);
  if (pages.length !== 42 || archetypes.size !== 42 || new Set(pages.map(({ id }) => id)).size !== 42 || expected.some((id) => !pages.some((page) => page.id === id))) throw new Error('Catalog must resolve exactly P01-P42.');
  return pages.map((page) => ({
    ...page,
    archetype: archetypes.get(page.id),
    calibrationArchetype: classify(archetypes.get(page.id)),
    rootSelector: page.id === 'P07' ? '.p07Composition' : `[data-page-id="${page.id}"]`,
  }));
}

async function ready(page, spec) {
  const url = new URL(spec.route, BASE_URL);
  await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 45_000 });
  await page.locator(spec.rootSelector).waitFor({ state: 'visible', timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  const minimumText = spec.id === 'P07' ? 300 : 220;
  await page.waitForFunction(({ selector, pathname, minimumText }) => {
    const root = document.querySelector(selector);
    if (!root || location.pathname !== pathname) return false;
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1;
    };
    if (!visible(root) || root.getBoundingClientRect().width < 300 || root.getBoundingClientRect().height < 240) return false;
    if (root.hasAttribute('data-fixture-ready') && root.getAttribute('data-fixture-ready') !== 'true') return false;
    if ([...document.querySelectorAll('.routeLoading,[aria-busy="true"],[class*="skeleton" i],.euiLoadingSpinner')].some(visible)) return false;
    const text = (root.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (/route not found|unable to load this work surface|production adapter unavailable|application error/i.test(text)) return false;
    const surfaces = root.querySelectorAll('[data-visual-region],table,[role="grid"],article,form,svg,canvas,[role="tablist"],.euiPanel').length;
    return text.length >= minimumText && surfaces >= 2;
  }, { selector: spec.rootSelector, pathname: url.pathname, minimumText }, { timeout: 30_000 });
  const samples = [];
  for (let index = 0; index < 4; index += 1) {
    samples.push(await page.evaluate((selector) => {
      const root = document.querySelector(selector);
      return { text: (root?.innerText ?? '').replace(/\s+/g, ' ').trim().length, root: root?.scrollHeight ?? 0, document: document.documentElement.scrollHeight };
    }, spec.rootSelector));
    if (index < 3) await page.waitForTimeout(600);
  }
  const [previous, latest] = samples.slice(-2);
  if (['text', 'root', 'document'].some((key) => Math.abs(latest[key] - previous[key]) / Math.max(1, previous[key]) > 0.01)) throw new Error(`Unstable route: ${JSON.stringify(samples)}`);
  return { finalUrl: page.url(), rootSelector: spec.rootSelector, minimumText, stableSamples: samples };
}

async function collect(page, spec, viewport) {
  return page.evaluate(({ selector, pageId, viewport }) => {
    const root = document.querySelector(selector);
    if (!root) throw new Error(`Missing root ${selector}`);
    const r = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
    const med = (values) => {
      const list = values.filter(Number.isFinite).sort((a, b) => a - b);
      if (!list.length) return null;
      const middle = Math.floor(list.length / 2);
      return list.length % 2 ? list[middle] : (list[middle - 1] + list[middle]) / 2;
    };
    const pct = (values, fraction) => {
      const list = values.filter(Number.isFinite).sort((a, b) => a - b);
      if (!list.length) return null;
      const position = (list.length - 1) * fraction;
      const lower = Math.floor(position);
      const upper = Math.ceil(position);
      return lower === upper ? list[lower] : list[lower] + (list[upper] - list[lower]) * (position - lower);
    };
    const entropy = (values) => {
      if (!values.length) return 0;
      const counts = new Map();
      values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
      return [...counts.values()].reduce((sum, count) => {
        const probability = count / values.length;
        return sum - probability * Math.log2(probability);
      }, 0);
    };
    const intersect = (a, b) => {
      const left = Math.max(a.left, b.left); const right = Math.min(a.right, b.right);
      const top = Math.max(a.top, b.top); const bottom = Math.min(a.bottom, b.bottom);
      return { left, right, top, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top), x: left, y: top };
    };
    const rootRect = root.getBoundingClientRect();
    const usable = { left: Math.max(0, rootRect.left), right: Math.min(viewport.width, rootRect.right), top: Math.max(0, rootRect.top), bottom: viewport.height };
    const full = { left: Math.max(0, rootRect.left), right: Math.min(viewport.width, rootRect.right), top: Math.max(0, rootRect.top), bottom: Math.max(viewport.height, document.documentElement.scrollHeight) };
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1;
    };
    const visibleRect = (element, clip) => {
      if (!isVisible(element)) return null;
      let rect = intersect(element.getBoundingClientRect(), clip);
      for (let current = element.parentElement; current && current !== root.parentElement; current = current.parentElement) {
        const style = getComputedStyle(current);
        const x = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX);
        const y = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowY);
        if (x || y) {
          const parent = current.getBoundingClientRect();
          rect = intersect(rect, { left: x ? parent.left : clip.left, right: x ? parent.right : clip.right, top: y ? parent.top : clip.top, bottom: y ? parent.bottom : clip.bottom });
        }
        if (rect.width <= 1 || rect.height <= 1) return null;
      }
      return rect.width > 1 && rect.height > 1 ? rect : null;
    };
    const rgba = (value) => {
      const values = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return values.length >= 3 ? [values[0], values[1], values[2], values[3] ?? 1] : [0, 0, 0, 0];
    };
    const composite = (front, back) => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [0, 1, 2].map((index) => (front[index] * front[3] + back[index] * back[3] * (1 - front[3])) / alpha).concat(alpha);
    };
    const background = (element) => {
      const ancestors = [];
      for (let current = element; current; current = current.parentElement) ancestors.push(current);
      return ancestors.reverse().reduce((color, current) => composite(rgba(getComputedStyle(current).backgroundColor), color), [7, 16, 31, 1]);
    };
    const luminance = (color) => {
      const channel = (value) => { const x = value / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; };
      return .2126 * channel(color[0]) + .7152 * channel(color[1]) + .0722 * channel(color[2]);
    };
    const contrast = (a, b) => { const first = luminance(a); const second = luminance(b); return (Math.max(first, second) + .05) / (Math.min(first, second) + .05); };

    function scopeMetrics(name, clip) {
      const elements = [...root.querySelectorAll('*')].filter((element) => visibleRect(element, clip));
      const rects = elements.map((element) => ({ element, rect: visibleRect(element, clip) })).filter(({ rect }) => rect);
      const area = Math.max(1, (clip.right - clip.left) * (clip.bottom - clip.top));
      const textNodes = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (node) => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || !visibleRect(parent, clip)) continue;
        const range = new Range(); range.selectNodeContents(node);
        const lineRects = [...range.getClientRects()].map((rect) => intersect(rect, clip)).filter((rect) => rect.width > 1 && rect.height > 1);
        if (lineRects.length) textNodes.push({ node, parent, lineRects });
      }
      const text = textNodes.map(({ node }) => node.textContent.trim()).join(' ').replace(/\s+/g, ' ').trim();
      const meaningful = [];
      for (const { element, rect } of rects) {
        const style = getComputedStyle(element);
        const leafText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        const semantic = element.matches('button,a,input,select,textarea,table,th,td,svg,canvas,[role="grid"],[role="button"],[data-visual-region],.euiBadge');
        const border = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].some((width) => Number.parseFloat(width) > 0);
        if ((leafText || semantic || border) && rect.width * rect.height <= area * .55) meaningful.push(rect);
      }
      const cell = 8;
      const columns = Math.ceil((clip.right - clip.left) / cell); const rows = Math.ceil((clip.bottom - clip.top) / cell);
      const raster = new Uint8Array(columns * rows);
      for (const rect of meaningful) {
        const x0 = Math.max(0, Math.floor((rect.left - clip.left) / cell)); const x1 = Math.min(columns, Math.ceil((rect.right - clip.left) / cell));
        const y0 = Math.max(0, Math.floor((rect.top - clip.top) / cell)); const y1 = Math.min(rows, Math.ceil((rect.bottom - clip.top) / cell));
        for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) raster[y * columns + x] = 1;
      }
      const occupancy = raster.reduce((sum, value) => sum + value, 0) / Math.max(1, raster.length);
      const leafRects = rects.filter(({ element }) => ![...element.children].some((child) => visibleRect(child, clip))).map(({ rect }) => rect);
      const windows = [];
      for (let y = clip.top; y < clip.bottom; y += 80) for (let x = clip.left; x < clip.right; x += 80) windows.push(leafRects.filter((rect) => rect.right > x && rect.left < x + 160 && rect.bottom > y && rect.top < y + 160).length);
      const regions = elements.filter((element) => element.hasAttribute('data-visual-region'));
      const regionGroups = regions.filter((element) => {
        const parentRegion = element.parentElement?.closest('[data-visual-region]');
        return !parentRegion || !root.contains(parentRegion);
      });
      const groups = regionGroups.length ? regionGroups : [...root.children].filter((element) => visibleRect(element, clip));
      const panels = elements.filter((element) => element.matches('.euiPanel,[class*="panel" i],article'));
      const panelDepth = Math.max(0, ...panels.map((panel) => { let depth = 0; for (let current = panel.parentElement; current && current !== root; current = current.parentElement) if (current.matches('.euiPanel,[class*="panel" i],article')) depth += 1; return depth + 1; }));
      const siblingGaps = [];
      for (const parent of [root, ...elements]) {
        const children = [...parent.children].map((child) => visibleRect(child, clip)).filter(Boolean).sort((a, b) => a.top - b.top || a.left - b.left);
        for (let index = 1; index < children.length; index += 1) {
          const vertical = children[index].top - children[index - 1].bottom;
          if (vertical >= 0 && vertical < 200) siblingGaps.push(vertical);
        }
      }
      const intra = siblingGaps.filter((gap) => gap <= 12); const inter = siblingGaps.filter((gap) => gap > 12);
      const anchorsX = rects.map(({ rect }) => Math.round(rect.left / 4) * 4); const anchorsY = rects.map(({ rect }) => Math.round(rect.top / 4) * 4);
      const headings = elements.filter((element) => /^H[1-3]$/.test(element.tagName));
      const levels = headings.map((heading) => Number(heading.tagName[1])); let headingViolations = 0;
      for (let index = 1; index < levels.length; index += 1) if (levels[index] - levels[index - 1] > 1) headingViolations += 1;
      const roles = { h1: [], h2: [], h3: [], body: [], supporting: [], metadata: [] };
      const lineRatios = []; const charsPerLine = []; const contrasts = [];
      let clipping = 0; let truncation = 0;
      for (const { parent, lineRects, node } of textNodes) {
        const style = getComputedStyle(parent); const fontSize = Number.parseFloat(style.fontSize); const lineHeight = Number.parseFloat(style.lineHeight); const weight = Number.parseInt(style.fontWeight, 10) || 400;
        if (Number.isFinite(fontSize) && Number.isFinite(lineHeight)) lineRatios.push(lineHeight / fontSize);
        charsPerLine.push(node.textContent.trim().length / Math.max(1, lineRects.length));
        contrasts.push(contrast(rgba(style.color), background(parent)));
        const role = parent.matches('h1') ? 'h1' : parent.matches('h2') ? 'h2' : parent.matches('h3') ? 'h3' : fontSize <= 11.5 ? 'metadata' : fontSize <= 12.5 ? 'supporting' : 'body';
        roles[role].push({ fontSize, lineHeight, weight });
        const clipped = parent.scrollWidth > parent.clientWidth + 1 || parent.scrollHeight > parent.clientHeight + 1;
        const intentional = ['ellipsis', 'clip'].includes(style.textOverflow) || ['auto', 'scroll'].includes(style.overflowX) || parent.closest('pre,code');
        if (clipped && !intentional) clipping += 1;
        if (style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none') truncation += 1;
      }
      const boxes = textNodes.flatMap(({ parent, lineRects }) => lineRects.map((rect) => ({ parent, rect }))).slice(0, 700).sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);
      let overlap = 0;
      for (let first = 0; first < boxes.length; first += 1) for (let second = first + 1; second < boxes.length; second += 1) {
        if (boxes[second].rect.top >= boxes[first].rect.bottom - 1) break;
        if (boxes[first].parent === boxes[second].parent || boxes[first].parent.contains(boxes[second].parent) || boxes[second].parent.contains(boxes[first].parent)) continue;
        if (Math.min(boxes[first].rect.right, boxes[second].rect.right) - Math.max(boxes[first].rect.left, boxes[second].rect.left) > 1 && Math.min(boxes[first].rect.bottom, boxes[second].rect.bottom) - Math.max(boxes[first].rect.top, boxes[second].rect.top) > 1) overlap += 1;
      }
      const controls = elements.filter((element) => element.matches('button,a[href],input,select,textarea,[role="button"],[role="tab"]'));
      const interaction = { buttons: 0, links: 0, inputs_selects: 0, tabs: 0, filters: 0, row_actions: 0 };
      let weighted = 0; let primary = 0; let filled = 0; let undersized = 0; let spacingExceptions = 0;
      const byRegion = new Map();
      for (const element of controls) {
        const rect = visibleRect(element, clip); const style = getComputedStyle(element); const label = `${element.getAttribute('aria-label') ?? ''} ${element.textContent ?? ''}`;
        if (element.matches('button,[role="button"]')) interaction.buttons += 1; else if (element.matches('a[href]')) interaction.links += 1; else if (element.matches('input,select,textarea')) interaction.inputs_selects += 1;
        if (element.matches('[role="tab"]')) interaction.tabs += 1; if (/filter|search|query|time range/i.test(label)) interaction.filters += 1; if (element.closest('tr,li') && /action|more|menu|open|view|edit/i.test(label)) interaction.row_actions += 1;
        const isFilled = element.matches('.euiButton--fill,[class*="fill-primary"],button[type="submit"]') || (rgba(style.backgroundColor)[3] > .2 && !['transparent', 'rgba(0, 0, 0, 0)'].includes(style.backgroundColor));
        const isPrimary = isFilled && (/primary/i.test(element.className) || element.matches('button[type="submit"]'));
        weighted += isPrimary ? 3 : element.matches('button,input,select,textarea,[role="button"]') ? 2 : 1; if (isPrimary) primary += 1; if (isFilled) filled += 1;
        const region = element.closest('[data-visual-region]')?.getAttribute('data-visual-region') ?? 'unassigned'; byRegion.set(region, (byRegion.get(region) ?? 0) + 1);
        if (rect.width < 24 || rect.height < 24) {
          undersized += 1;
          const near = controls.some((other) => { if (other === element) return false; const otherRect = visibleRect(other, clip); if (!otherRect) return false; return Math.hypot((rect.left + rect.right - otherRect.left - otherRect.right) / 2, (rect.top + rect.bottom - otherRect.top - otherRect.bottom) / 2) < 24; });
          if (!near || element.closest('p,li')) spacingExceptions += 1;
        }
      }
      const tables = elements.filter((element) => element.tagName === 'TABLE').map((table) => {
        const rows = [...table.querySelectorAll('tbody tr')].filter((row) => visibleRect(row, clip)); const rowHeights = rows.map((row) => row.getBoundingClientRect().height);
        const cells = [...table.querySelectorAll('td,th')].filter((cell) => visibleRect(cell, clip)); const paddings = cells.map((cell) => { const style = getComputedStyle(cell); return Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight); });
        const overflow = table.closest('[class*="scroll" i],[style*="overflow"]'); const overflowStyle = overflow ? getComputedStyle(overflow) : null;
        return { visible_rows: rows.length, columns: table.querySelectorAll('thead th').length || Math.max(0, ...rows.map((row) => row.children.length)), row_height_p05: r(pct(rowHeights, .05)), row_height_p50: r(pct(rowHeights, .5)), cell_horizontal_padding_p50: r(pct(paddings, .5)), wrapped_cells: cells.filter((cell) => cell.getClientRects().length > 1 || cell.scrollHeight > Number.parseFloat(getComputedStyle(cell).lineHeight) * 1.5).length, truncated_cells: cells.filter((cell) => getComputedStyle(cell).textOverflow === 'ellipsis').length, badge_count: table.querySelectorAll('.euiBadge').length, owned_overflow: Boolean(overflowStyle && ['auto', 'scroll'].includes(overflowStyle.overflowX)) };
      });
      const listItems = elements.filter((element) => element.matches('li,article') && element.textContent.trim().length > 20); const listHeights = listItems.map((element) => element.getBoundingClientRect().height);
      const salience = rects.filter(({ element, rect }) => {
        const style = getComputedStyle(element); const bg = rgba(style.backgroundColor); const areaRatio = rect.width * rect.height / area;
        return areaRatio > .08 && (bg[3] > .35 || /warning|danger|primary/i.test(element.className));
      });
      const coloredTitles = headings.filter((heading) => { const style = getComputedStyle(heading); const rect = heading.getBoundingClientRect(); return rgba(style.backgroundColor)[3] > .05 && rect.width > (clip.right - clip.left) * .45; }).length;
      const workSurfaceElements = [...root.querySelectorAll('[data-visual-region],table,[role="grid"],article,form')].filter((element) => {
        const region = element.closest('[data-visual-region]')?.getAttribute('data-visual-region') ?? '';
        return !/page-header|workflow-header|context|scope|filter|toolbar|command/i.test(region)
          && !element.closest('.pageContextPanel');
      });
      const firstSurface = workSurfaceElements.map((element) => visibleRect(element, clip)).filter(Boolean).sort((a, b) => a.top - b.top)[0];
      const scaffolding = [...root.querySelectorAll('[data-visual-region="page-header"],[data-visual-region="workflow-header"],.pageContextPanel,[class*="filter" i],[class*="toolbar" i]')].map((element) => visibleRect(element, clip)).filter(Boolean).reduce((sum, rect) => sum + rect.width * rect.height, 0) / area;
      return {
        scope: name,
        usable_content_area_px2: r(area), first_work_surface_y_ratio: firstSurface ? r((firstSurface.top - clip.top) / Math.max(1, clip.bottom - clip.top)) : null,
        first_viewport_scaffolding_area_ratio: r(scaffolding), meaningful_occupancy_ratio: r(occupancy), blank_canvas_ratio: r(1 - occupancy),
        visible_text_chars: text.length, visible_words: text ? text.split(/\s+/).length : 0, text_chars_per_10k_px2: r(text.length / area * 10_000), dom_block_count_per_100k_px2: r(elements.filter((element) => getComputedStyle(element).display !== 'inline').length / area * 100_000),
        visual_region_count: regions.length, top_level_group_count: groups.length, nested_panel_depth: panelDepth, visually_identical_nested_panel_levels: panels.length ? Math.max(0, panelDepth - 2) : 0,
        local_density_p50: r(pct(windows, .5)), local_density_p95: r(pct(windows, .95)), screenshot_edge_density_proxy: { value: null, reason: 'Optional image proxy omitted; no decoding dependency added.' },
        grouping: { median_intra_group_gap_px: r(med(intra)), median_inter_group_gap_px: r(med(inter)), group_gap_ratio: med(intra) ? r(med(inter) / med(intra)) : null, sibling_gaps_off_4px_grid: siblingGaps.filter((gap) => Math.abs(gap / 4 - Math.round(gap / 4)) > .08).length },
        alignment: { unique_x_anchors_4px: new Set(anchorsX).size, unique_y_anchors_4px: new Set(anchorsY).size, x_alignment_entropy: r(entropy(anchorsX)), y_alignment_entropy: r(entropy(anchorsY)), layout_complexity_proxy: r((entropy(anchorsX) + entropy(anchorsY)) / 2) },
        hierarchy: { h1_count: levels.filter((level) => level === 1).length, h2_count: levels.filter((level) => level === 2).length, h3_count: levels.filter((level) => level === 3).length, heading_order_violations: headingViolations, high_salience_surface_count: salience.length, primary_cta_count: primary, competing_filled_cta_count: Math.max(0, filled - 1), wide_colored_title_treatments: coloredTitles },
        typography: { roles: Object.fromEntries(Object.entries(roles).map(([role, values]) => [role, { count: values.length, font_size_p50: r(pct(values.map((value) => value.fontSize), .5)), line_height_p50: r(pct(values.map((value) => value.lineHeight), .5)), font_weight_p50: r(pct(values.map((value) => value.weight), .5)) }])), line_height_font_size_ratio_p05: r(pct(lineRatios, .05)), line_height_font_size_ratio_p50: r(pct(lineRatios, .5)), estimated_chars_per_rendered_line_p50: r(pct(charsPerLine, .5)), estimated_chars_per_rendered_line_p95: r(pct(charsPerLine, .95)), text_clipping_count: clipping, text_overlap_count: overlap, truncation_count: truncation, contrast_ratio_p05: r(pct(contrasts, .05)), contrast_below_4_5_count: contrasts.filter((ratio) => ratio < 4.5).length, paragraph_gap_p50: r(med(siblingGaps.filter((gap) => gap <= 40))), repeated_item_gap_p50: r(med(siblingGaps)) },
        interaction: { ...interaction, raw_count: controls.length, weighted_action_exposure: weighted, actions_per_visual_region: Object.fromEntries(byRegion), above_fold_competing_action_clusters: [...byRegion.values()].filter((count) => count >= 4).length, undersized_target_count: undersized, undersized_target_spacing_exception_count: spacingExceptions },
        data_surfaces: { tables, visible_table_count: tables.length, visible_table_rows: tables.reduce((sum, table) => sum + table.visible_rows, 0), maximum_visible_columns: Math.max(0, ...tables.map((table) => table.columns)), list_repeated_item_count: listItems.length, list_row_height_p05: r(pct(listHeights, .05)), list_row_height_p50: r(pct(listHeights, .5)), owned_overflow_table_count: tables.filter((table) => table.owned_overflow).length },
        resilience: { document_horizontal_overflow_px: r(Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth), root_scroll_width_px: root.scrollWidth, root_client_width_px: root.clientWidth, page_scroll_height_px: document.documentElement.scrollHeight },
      };
    }
    return { page_id: pageId, viewport, first_viewport: scopeMetrics('first_viewport', usable), full_page: scopeMetrics('full_page', full) };
  }, { selector: spec.rootSelector, pageId: spec.id, viewport });
}

async function webpScreenshot(page, destination, options) {
  const temporary = `${destination}.png`;
  await page.screenshot({ path: temporary, type: 'png', animations: 'disabled', ...options });
  const png = await readFile(temporary);
  const pixelSize = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  await runFile('cwebp', ['-quiet', '-mt', '-q', String(QUALITY), temporary, '-o', destination]);
  await unlink(temporary);
  return pixelSize;
}

async function capturePair(page, spec, readiness) {
  const firstDir = path.join(OUTPUT, 'screenshots/first-viewport'); const fullDir = path.join(OUTPUT, 'screenshots/full-page');
  await mkdir(firstDir, { recursive: true }); await mkdir(fullDir, { recursive: true });
  const filename = `${spec.id}-${slug(spec.route)}.webp`; const firstPath = path.join(firstDir, filename); const fullPath = path.join(fullDir, filename);
  await page.evaluate(() => window.scrollTo(0, 0));
  const firstSize = await webpScreenshot(page, firstPath, { fullPage: false }); const fullSize = await webpScreenshot(page, fullPath, { fullPage: true });
  const common = { pageId: spec.id, route: spec.route, finalUrl: readiness.finalUrl, viewport: { width: 1231, height: 768 }, colorScheme: 'dark', sourceSha: SOURCE_SHA, captureTime: new Date().toISOString(), readinessCheck: readiness, validity: { valid: true, reasons: [] }, reviewerNote: 'Pending individual human visual review; no score may be assigned.' };
  return Promise.all([{ ...common, kind: 'first-viewport', path: path.relative(OUTPUT, firstPath).split(path.sep).join('/'), pixelSize: firstSize }, { ...common, kind: 'full-page', path: path.relative(OUTPUT, fullPath).split(path.sep).join('/'), pixelSize: fullSize }].map(async (record) => ({ ...record, byteSize: (await stat(path.join(OUTPUT, record.path))).size, sha256: await sha256(path.join(OUTPUT, record.path)) })));
}

const pages = await catalog();
await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const measurements = []; const failures = []; const images = [];
try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: 'dark', reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await context.newPage();
    for (const spec of pages) {
      try {
        const readiness = await ready(page, spec);
        const metrics = await collect(page, spec, viewport);
        if (CAPTURE && viewport.capture) images.push(...await capturePair(page, spec, readiness));
        measurements.push({ pageId: spec.id, title: spec.title, route: spec.route, archetype: spec.archetype, calibrationArchetype: spec.calibrationArchetype, viewport: viewport.name, status: 'measured', confidence: viewport.capture ? .9 : .85, readiness, metrics, completedAt: new Date().toISOString() });
        console.log(`${viewport.name} ${spec.id} measured`);
      } catch (error) {
        const failure = { pageId: spec.id, title: spec.title, route: spec.route, archetype: spec.archetype, calibrationArchetype: spec.calibrationArchetype, viewport: viewport.name, status: 'N/A', reason: error instanceof Error ? error.message : String(error), confidence: 0 };
        failures.push(failure); measurements.push(failure); console.error(`${viewport.name} ${spec.id}: ${failure.reason}`);
      }
    }
    await context.close();
  }
} finally { await browser.close(); }

const data = {
  metadata: { metricVersion: VERSION, generatedAt: new Date().toISOString(), sourceSha: SOURCE_SHA, baseUrl: BASE_URL, browser: 'Chromium via Playwright', colorScheme: 'dark', viewports: VIEWPORTS, scope: 'Page-owned root only for geometric metrics; fixed global app header and primary sidebar excluded.', calibration: 'Raw metrics. Same-archetype robust-z calibration and human-confirmed scoring are applied after all screenshot pairs are reviewed.' },
  catalog: pages,
  measurements,
  validation: { canonicalPageCount: pages.length, uniqueCanonicalPageCount: new Set(pages.map(({ id }) => id)).size, measuredPrimaryPages: measurements.filter(({ viewport, status }) => viewport === '1231x768-primary' && status === 'measured').length, measuredStructuralPages: measurements.filter(({ viewport, status }) => viewport === '1440x900-structural' && status === 'measured').length, measuredTablePages: measurements.filter(({ viewport, status }) => viewport === '1200x768-table-overflow' && status === 'measured').length, renderFailureCount: failures.length },
  renderFailures: failures,
  limitations: ['Fixture data is evaluated only for geometry.', 'Automated proxies do not replace individual human review.', 'Screenshot edge density is explicitly N/A.', 'WCAG 1.4.12 requires a separate text-spacing override survival test.'],
};
await writeFile(path.join(OUTPUT, 'information-density-metrics.raw.json'), `${JSON.stringify(data, null, 2)}\n`);
if (CAPTURE) await writeFile(path.join(OUTPUT, 'screenshots/manifest.unreviewed.json'), `${JSON.stringify({ metricVersion: VERSION, sourceSha: SOURCE_SHA, generatedAt: new Date().toISOString(), images }, null, 2)}\n`);
if (failures.length || data.validation.measuredPrimaryPages !== 42 || data.validation.measuredStructuralPages !== 42 || data.validation.measuredTablePages !== 42) process.exitCode = 1;
