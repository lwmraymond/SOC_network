import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/* global document, getComputedStyle, location, Node, NodeFilter, Range, window */

const METRIC_VERSION = 'information-density-v1.0.0';
const PRIMARY_VIEWPORT = { width: 1231, height: 768 };
const STRUCTURAL_VIEWPORT = { width: 1440, height: 900 };
const TABLE_VIEWPORT = { width: 1200, height: 768 };
const SOURCE_SHA = process.env.DENSITY_AUDIT_SOURCE_SHA ?? process.env.AUDIT_SOURCE_SHA;
const BASE_URL = process.env.SOC_E2E_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5174';
const OUTPUT_DIR = path.resolve(process.env.INFORMATION_DENSITY_OUTPUT_DIR ?? 'docs/design/audit-2026-07-22');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
const FIRST_DIR = path.join(SCREENSHOT_DIR, 'first-viewport');
const FULL_DIR = path.join(SCREENSHOT_DIR, 'full-page');
const SCREENSHOT_QUALITY = Number(process.env.INFORMATION_DENSITY_WEBP_QUALITY ?? 78);
const FINAL_OUTPUT_PATH = path.resolve(process.env.DENSITY_AUDIT_OUTPUT ?? path.join(OUTPUT_DIR, 'p01-p42-information-density.metrics.json'));
const READINESS_TIMEOUT_MS = Number(process.env.INFORMATION_DENSITY_READINESS_TIMEOUT_MS ?? 30_000);
const cliArgs = process.argv.slice(2);
const args = new Set(cliArgs);
const captureScreenshots = args.has('--screenshots');
const validateOnlyIndex = cliArgs.indexOf('--validate-only');
const validateOnlyPath = validateOnlyIndex >= 0 ? cliArgs[validateOnlyIndex + 1] : null;

if (!validateOnlyPath && (!SOURCE_SHA || !/^[0-9a-f]{40}$/i.test(SOURCE_SHA))) {
  throw new Error('DENSITY_AUDIT_SOURCE_SHA (or AUDIT_SOURCE_SHA) must be the exact 40-character audit source commit SHA.');
}

const sha256 = async (filePath) => {
  const bytes = await readFile(filePath);
  return createHash('sha256').update(bytes).digest('hex');
};
const routeSlug = (route) => route
  .replace(/^\//, '')
  .replace(/:[^/]+/g, 'asset-demo')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase() || 'root';

async function loadCatalog() {
  const canonicalSource = await readFile('tests/e2e/canonicalRoutes.ts', 'utf8');
  const routePattern = /\{\s*id:\s*'(?<id>P\d{2})',\s*path:\s*'(?<route>[^']+)',\s*title:\s*'(?<title>[^']+)'\s*\}/g;
  const routes = [...canonicalSource.matchAll(routePattern)].map(({ groups }) => ({ ...groups }));
  const expectedIds = Array.from({ length: 42 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`);
  const actualIds = routes.map(({ id }) => id);
  if (routes.length !== 42 || new Set(actualIds).size !== 42 || expectedIds.some((id) => !actualIds.includes(id))) {
    throw new Error(`Canonical route catalog must resolve exactly P01-P42; found ${routes.length}: ${actualIds.join(', ')}`);
  }

  const specSource = await readFile('src/catalog/pageSpecs.ts', 'utf8');
  const archetypeById = new Map();
  for (const match of specSource.matchAll(/definePage\(\{([\s\S]*?)\}\),/g)) {
    const block = match[1];
    const id = block.match(/\bid:\s*'(P\d{2})'/)?.[1];
    const archetype = block.match(/\barchetype:\s*'([^']+)'/)?.[1];
    if (id && archetype) archetypeById.set(id, archetype);
  }
  if (archetypeById.size !== 42) throw new Error(`pageSpecs archetype extraction found ${archetypeById.size} pages, expected 42.`);

  return routes.map((route) => ({
    ...route,
    archetype: archetypeById.get(route.id),
    calibrationArchetype: classifyArchetype(archetypeById.get(route.id)),
    rootSelector: route.id === 'P07' ? '.p07Composition' : `[data-page-id="${route.id}"]`,
  }));
}

function classifyArchetype(archetype = '') {
  if (/dashboard|analytics|wallboard|overview|health|posture/i.test(archetype)) return 'dashboard/analytics';
  if (/360|detail|investigation|evidence preview/i.test(archetype)) return 'entity/detail';
  if (/settings|directory|catalog|governance|provider topology|fleet readiness|access policy/i.test(archetype)) return 'settings/catalog';
  if (/workbench|authoring|conversation|graph|runner|schema|calendar|explorer|wizard|rollout/i.test(archetype)) return 'authoring/workbench';
  return 'queue/table';
}

function readinessDescription(spec) {
  return {
    rootSelector: spec.rootSelector,
    required: [
      'page-owned root visible with non-trivial geometry',
      'document.fonts.ready resolved',
      'final pathname equals canonical route pathname',
      'no visible route loader, skeleton, aria-busy surface, fatal state, or route-not-found copy',
      'fixture-ready attribute true when present, otherwise meaningful text/region threshold',
      'root text length and scroll height stable across three samples',
    ],
    meaningfulThreshold: {
      minimumVisibleTextCharacters: spec.id === 'P07' ? 300 : 220,
      minimumMeaningfulSurfaces: 2,
      minimumRootHeightPx: 240,
    },
  };
}

async function waitForReadyPage(page, spec) {
  const target = new URL(spec.route, BASE_URL);
  await page.goto(target.toString(), { waitUntil: 'networkidle', timeout: 45_000 });
  await page.locator(spec.rootSelector).waitFor({ state: 'visible', timeout: READINESS_TIMEOUT_MS });
  await page.evaluate(() => document.fonts.ready);

  const threshold = readinessDescription(spec).meaningfulThreshold;
  await page.waitForFunction(({ rootSelector, canonicalPath, threshold }) => {
    const root = document.querySelector(rootSelector);
    if (!root) return false;
    const style = getComputedStyle(root);
    const rect = root.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) <= 0 || rect.width < 300 || rect.height < threshold.minimumRootHeightPx) return false;
    if (location.pathname !== canonicalPath) return false;

    const visible = (element) => {
      const computed = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return computed.display !== 'none' && computed.visibility !== 'hidden' && Number(computed.opacity) > 0 && box.width > 1 && box.height > 1;
    };
    const pending = [...document.querySelectorAll('.routeLoading,[aria-busy="true"],[class*="skeleton" i],.euiSkeletonText,.euiLoadingSpinner')].some(visible);
    if (pending) return false;

    if (root.hasAttribute('data-fixture-ready') && root.getAttribute('data-fixture-ready') !== 'true') return false;
    const text = (root.innerText ?? '').replace(/\s+/g, ' ').trim();
    const fatalPattern = /route not found|unable to load this work surface|production adapter unavailable|uncaught runtime error|application error/i;
    if (fatalPattern.test(text)) return false;
    const meaningful = root.querySelectorAll('[data-visual-region],table,[role="grid"],article,form,svg,canvas,[role="tablist"],.euiPanel').length;
    return text.length >= threshold.minimumVisibleTextCharacters && meaningful >= threshold.minimumMeaningfulSurfaces;
  }, { rootSelector: spec.rootSelector, canonicalPath: new URL(spec.route, BASE_URL).pathname, threshold }, { timeout: READINESS_TIMEOUT_MS });

  const samples = [];
  for (let sample = 0; sample < 3; sample += 1) {
    samples.push(await page.evaluate((rootSelector) => {
      const root = document.querySelector(rootSelector);
      return {
        textLength: (root?.innerText ?? '').replace(/\s+/g, ' ').trim().length,
        rootHeight: root?.scrollHeight ?? 0,
        documentHeight: document.documentElement.scrollHeight,
      };
    }, spec.rootSelector));
    if (sample < 2) await page.waitForTimeout(600);
  }
  const stable = samples.slice(1).every((sample, index) => {
    const previous = samples[index];
    const textDelta = Math.abs(sample.textLength - previous.textLength) / Math.max(1, previous.textLength);
    const heightDelta = Math.abs(sample.rootHeight - previous.rootHeight) / Math.max(1, previous.rootHeight);
    return textDelta <= 0.01 && heightDelta <= 0.01;
  });
  if (!stable) throw new Error(`Readiness did not settle for ${spec.id}: ${JSON.stringify(samples)}`);

  const finalState = await page.evaluate(({ rootSelector, canonicalPath }) => {
    const root = document.querySelector(rootSelector);
    const rect = root?.getBoundingClientRect();
    return {
      finalUrl: location.href,
      pathMatches: location.pathname === canonicalPath,
      rootVisible: Boolean(root && rect && rect.width > 1 && rect.height > 1),
      rootTextCharacters: (root?.innerText ?? '').replace(/\s+/g, ' ').trim().length,
      rootScrollHeight: root?.scrollHeight ?? null,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
      fixtureReady: root?.getAttribute('data-fixture-ready') ?? 'not-applicable',
    };
  }, { rootSelector: spec.rootSelector, canonicalPath: new URL(spec.route, BASE_URL).pathname });

  return { ...finalState, stableSamples: samples };
}

async function collectMetrics(page, spec, viewport) {
  return page.evaluate(({ rootSelector, pageId, viewport }) => {
    const root = document.querySelector(rootSelector);
    if (!root) throw new Error(`Missing page root ${rootSelector}`);
    const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
    const median = (values) => {
      const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
      if (!finite.length) return null;
      const middle = Math.floor(finite.length / 2);
      return finite.length % 2 ? finite[middle] : (finite[middle - 1] + finite[middle]) / 2;
    };
    const percentile = (values, fraction) => {
      const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
      if (!finite.length) return null;
      const index = (finite.length - 1) * fraction;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      return lower === upper ? finite[lower] : finite[lower] + (finite[upper] - finite[lower]) * (index - lower);
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
    const intersects = (rect, clip) => rect.right > clip.left && rect.left < clip.right && rect.bottom > clip.top && rect.top < clip.bottom;
    const intersection = (rect, clip) => ({
      left: Math.max(rect.left, clip.left),
      right: Math.min(rect.right, clip.right),
      top: Math.max(rect.top, clip.top),
      bottom: Math.min(rect.bottom, clip.bottom),
      get width() { return Math.max(0, this.right - this.left); },
      get height() { return Math.max(0, this.bottom - this.top); },
    });
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) <= 0 || rect.width <= 1 || rect.height <= 1) return false;
      for (let current = element.parentElement; current && current !== root.parentElement; current = current.parentElement) {
        const ancestorStyle = getComputedStyle(current);
        if (ancestorStyle.display === 'none' || ancestorStyle.visibility === 'hidden' || Number(ancestorStyle.opacity) <= 0) return false;
      }
      return true;
    };
    const rootRect = root.getBoundingClientRect();
    const firstClip = {
      left: Math.max(0, rootRect.left),
      right: Math.min(document.documentElement.clientWidth, rootRect.right),
      top: Math.max(0, rootRect.top),
      bottom: Math.min(document.documentElement.clientHeight, rootRect.bottom),
    };
    const fullClip = {
      left: Math.max(0, rootRect.left),
      right: Math.max(Math.min(document.documentElement.scrollWidth, rootRect.right), Math.min(document.documentElement.clientWidth, rootRect.right)),
      top: Math.max(0, rootRect.top),
      bottom: Math.max(rootRect.bottom, rootRect.top + root.scrollHeight),
    };

    const rgba = (value) => {
      const numbers = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return numbers.length >= 3 ? [numbers[0], numbers[1], numbers[2], numbers[3] ?? 1] : [0, 0, 0, 0];
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
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
    };
    const contrast = (first, second) => {
      const firstLuminance = luminance(first);
      const secondLuminance = luminance(second);
      return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
    };
    const directTextNodes = (container) => [...container.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    const textLineRects = (container, clip) => {
      const lines = [];
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.textContent.trim() || !node.parentElement || !visible(node.parentElement)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement.closest('script,style,svg,canvas,[aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let node;
      while ((node = walker.nextNode())) {
        const range = new Range();
        range.selectNodeContents(node);
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        const clientRects = [...range.getClientRects()].filter((rect) => rect.width > 0.5 && rect.height > 0.5 && intersects(rect, clip));
        if (!clientRects.length) continue;
        const charactersPerRect = text.length / clientRects.length;
        for (const rect of clientRects) {
          const clipped = intersection(rect, clip);
          lines.push({
            rect: { left: clipped.left, right: clipped.right, top: clipped.top, bottom: clipped.bottom, width: clipped.width, height: clipped.height },
            characters: charactersPerRect,
            parent: node.parentElement,
          });
        }
      }
      return lines;
    };

    function scopeMetrics(scope, clip) {
      const width = Math.max(0, clip.right - clip.left);
      const height = Math.max(0, clip.bottom - clip.top);
      const usableArea = width * height;
      const allElements = [...root.querySelectorAll('*')].filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip));
      const lines = textLineRects(root, clip);
      const visibleTextCharacters = Math.round(lines.reduce((sum, line) => sum + line.characters, 0));
      const visibleWords = (root.innerText ?? '').split(/\s+/).filter(Boolean).length;

      const meaningfulRects = [];
      for (const line of lines) meaningfulRects.push(line.rect);
      const meaningfulSelector = 'button,input,select,textarea,a[href],[role="button"],[role="tab"],[role="checkbox"],[role="radio"],td,th,svg,canvas,img,progress,[data-visual-region] > *,article > *,form > *';
      for (const element of root.querySelectorAll(meaningfulSelector)) {
        if (!visible(element)) continue;
        const rect = element.getBoundingClientRect();
        if (!intersects(rect, clip)) continue;
        const clipped = intersection(rect, clip);
        const area = clipped.width * clipped.height;
        if (area <= 2 || area > usableArea * 0.55) continue;
        meaningfulRects.push({ left: clipped.left, right: clipped.right, top: clipped.top, bottom: clipped.bottom, width: clipped.width, height: clipped.height });
      }

      const cellSize = 12;
      const columns = Math.max(1, Math.ceil(width / cellSize));
      const rows = Math.max(1, Math.ceil(height / cellSize));
      const occupied = new Uint8Array(columns * rows);
      for (const rect of meaningfulRects) {
        const startColumn = clamp(Math.floor((rect.left - clip.left) / cellSize), 0, columns - 1);
        const endColumn = clamp(Math.floor((rect.right - clip.left) / cellSize), 0, columns - 1);
        const startRow = clamp(Math.floor((rect.top - clip.top) / cellSize), 0, rows - 1);
        const endRow = clamp(Math.floor((rect.bottom - clip.top) / cellSize), 0, rows - 1);
        for (let row = startRow; row <= endRow; row += 1) {
          for (let column = startColumn; column <= endColumn; column += 1) occupied[row * columns + column] = 1;
        }
      }
      const meaningfulOccupancy = occupied.reduce((sum, value) => sum + value, 0) / occupied.length;
      const domEdgeDensityProxy = meaningfulRects.reduce((sum, rect) => sum + 2 * (rect.width + rect.height), 0) / Math.max(1, usableArea);

      const blockElements = allElements.filter((element) => {
        const display = getComputedStyle(element).display;
        return ['block', 'flex', 'grid', 'table', 'table-row', 'list-item', 'flow-root'].includes(display);
      });
      const visualRegions = [...root.querySelectorAll('[data-visual-region]')].filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip));
      const contentRoot = root.querySelector('.pageFrameContent,[data-page-mode],main') ?? root;
      const topGroups = [...contentRoot.children].filter((element) => {
        if (!visible(element)) return false;
        const rect = element.getBoundingClientRect();
        return intersects(rect, clip) && rect.width * rect.height >= usableArea * 0.005;
      });

      const panelSelector = '.euiPanel,article,[class*="panel" i],[class*="card" i]';
      const panelElements = allElements.filter((element) => element.matches(panelSelector));
      let nestedPanelDepth = 0;
      let identicalPanelLevels = 0;
      for (const panel of panelElements) {
        let depth = 1;
        let identical = 0;
        const ownStyle = getComputedStyle(panel);
        const signature = `${ownStyle.backgroundColor}|${ownStyle.borderColor}|${ownStyle.borderRadius}|${ownStyle.boxShadow}`;
        for (let current = panel.parentElement?.closest(panelSelector); current && root.contains(current); current = current.parentElement?.closest(panelSelector)) {
          depth += 1;
          const style = getComputedStyle(current);
          if (`${style.backgroundColor}|${style.borderColor}|${style.borderRadius}|${style.boxShadow}` === signature) identical += 1;
        }
        nestedPanelDepth = Math.max(nestedPanelDepth, depth);
        identicalPanelLevels = Math.max(identicalPanelLevels, identical + 1);
      }

      const leafRects = meaningfulRects.filter((rect) => rect.width <= 240 && rect.height <= 160);
      const localCounts = [];
      const windowSize = 160;
      const step = 80;
      for (let y = clip.top; y < clip.bottom; y += step) {
        for (let x = clip.left; x < clip.right; x += step) {
          const windowRect = { left: x, right: Math.min(x + windowSize, clip.right), top: y, bottom: Math.min(y + windowSize, clip.bottom) };
          localCounts.push(leafRects.filter((rect) => intersects(rect, windowRect)).length);
        }
      }

      const intraGaps = [];
      const baselineOffGrid = [];
      for (const parent of allElements.filter((element) => element.children.length >= 2 && element.children.length <= 20)) {
        const children = [...parent.children].filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip));
        const style = getComputedStyle(parent);
        const vertical = style.display === 'grid' || (style.display === 'flex' && style.flexDirection.includes('column')) || children.every((child, index) => index === 0 || child.getBoundingClientRect().top >= children[index - 1].getBoundingClientRect().top);
        const ordered = children.sort((first, second) => vertical ? first.getBoundingClientRect().top - second.getBoundingClientRect().top : first.getBoundingClientRect().left - second.getBoundingClientRect().left);
        for (let index = 1; index < ordered.length; index += 1) {
          const previous = ordered[index - 1].getBoundingClientRect();
          const current = ordered[index].getBoundingClientRect();
          const gap = vertical ? current.top - previous.bottom : current.left - previous.right;
          if (gap >= 0 && gap <= 128) {
            intraGaps.push(gap);
            const nearestGrid = Math.round(gap / 4) * 4;
            if (Math.abs(gap - nearestGrid) > 0.75) baselineOffGrid.push(gap);
          }
        }
      }
      const interGaps = [];
      const orderedGroups = topGroups.slice().sort((first, second) => first.getBoundingClientRect().top - second.getBoundingClientRect().top);
      for (let index = 1; index < orderedGroups.length; index += 1) {
        const gap = orderedGroups[index].getBoundingClientRect().top - orderedGroups[index - 1].getBoundingClientRect().bottom;
        if (gap >= 0 && gap <= 256) interGaps.push(gap);
      }
      const medianIntra = median(intraGaps);
      const medianInter = median(interGaps);

      const xAnchors = [];
      const yAnchors = [];
      for (const rect of meaningfulRects) {
        xAnchors.push(Math.round(rect.left / 4) * 4, Math.round(rect.right / 4) * 4);
        yAnchors.push(Math.round(rect.top / 4) * 4, Math.round(rect.bottom / 4) * 4);
      }

      const headings = allElements.filter((element) => /^H[1-3]$/.test(element.tagName));
      const headingLevels = headings.map((element) => Number(element.tagName.slice(1)));
      let headingOrderViolations = 0;
      for (let index = 1; index < headingLevels.length; index += 1) if (headingLevels[index] - headingLevels[index - 1] > 1) headingOrderViolations += 1;

      const typographicRoles = { h1: [], h2: [], h3: [], body: [], supporting: [], metadata: [], tableHeader: [], tableBody: [] };
      const lineHeightRatios = [];
      const estimatedCharactersPerLine = [];
      const contrastRatios = [];
      let textClippingCount = 0;
      let truncationCount = 0;
      for (const element of allElements.filter((item) => directTextNodes(item).length > 0)) {
        const style = getComputedStyle(element);
        const fontSize = Number.parseFloat(style.fontSize);
        const lineHeight = Number.parseFloat(style.lineHeight);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const role = element.matches('h1') ? 'h1'
          : element.matches('h2') ? 'h2'
            : element.matches('h3') ? 'h3'
              : element.matches('th') ? 'tableHeader'
                : element.matches('td') ? 'tableBody'
                  : fontSize <= 11.5 ? 'metadata'
                    : fontSize <= 12.5 ? 'supporting'
                      : 'body';
        typographicRoles[role].push({ fontSize: round(fontSize), lineHeight: round(lineHeight), fontWeight });
        if (Number.isFinite(lineHeight) && fontSize > 0) lineHeightRatios.push(lineHeight / fontSize);
        const elementLines = lines.filter((line) => line.parent === element);
        estimatedCharactersPerLine.push(...elementLines.map((line) => line.characters));
        const foreground = rgba(style.color);
        contrastRatios.push(contrast(foreground, background(element)));
        const clippedX = element.scrollWidth > element.clientWidth + 1;
        const clippedY = element.scrollHeight > element.clientHeight + 1;
        const ownsScroll = ['auto', 'scroll'].includes(style.overflowX) || ['auto', 'scroll'].includes(style.overflowY);
        const ellipsis = style.textOverflow === 'ellipsis';
        if ((clippedX || clippedY) && !ownsScroll && !ellipsis) textClippingCount += 1;
        if ((clippedX || clippedY) && ellipsis) truncationCount += 1;
      }

      const textBoxes = lines.slice(0, 800).sort((first, second) => first.rect.top - second.rect.top || first.rect.left - second.rect.left);
      let textOverlapCount = 0;
      for (let firstIndex = 0; firstIndex < textBoxes.length; firstIndex += 1) {
        const first = textBoxes[firstIndex];
        for (let secondIndex = firstIndex + 1; secondIndex < textBoxes.length; secondIndex += 1) {
          const second = textBoxes[secondIndex];
          if (second.rect.top >= first.rect.bottom - 1) break;
          if (first.parent === second.parent || first.parent.contains(second.parent) || second.parent.contains(first.parent)) continue;
          const overlapX = Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left);
          const overlapY = Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top);
          if (overlapX > 1 && overlapY > 1) textOverlapCount += 1;
        }
      }

      const paragraphGaps = [];
      const repeatedItemGaps = [];
      for (const parent of allElements.filter((element) => element.querySelectorAll(':scope > p,:scope > li').length >= 2)) {
        const items = [...parent.querySelectorAll(':scope > p,:scope > li')].filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip));
        items.sort((first, second) => first.getBoundingClientRect().top - second.getBoundingClientRect().top);
        for (let index = 1; index < items.length; index += 1) {
          const gap = items[index].getBoundingClientRect().top - items[index - 1].getBoundingClientRect().bottom;
          if (gap >= 0 && gap < 128) (items[index].tagName === 'P' ? paragraphGaps : repeatedItemGaps).push(gap);
        }
      }

      const interactionElements = allElements.filter((element) => element.matches('button,a[href],input,select,textarea,[role="button"],[role="tab"],[role="checkbox"],[role="radio"]'));
      const interactionCounts = {
        buttons: interactionElements.filter((element) => element.matches('button,[role="button"]')).length,
        links: interactionElements.filter((element) => element.matches('a[href]')).length,
        inputs: interactionElements.filter((element) => element.matches('input,select,textarea')).length,
        tabs: interactionElements.filter((element) => element.matches('[role="tab"]')).length,
        filters: interactionElements.filter((element) => /filter|search|query|scope/i.test(`${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('placeholder') ?? ''} ${element.textContent ?? ''}`)).length,
        rowActions: interactionElements.filter((element) => Boolean(element.closest('tr,[role="row"]'))).length,
      };
      let weightedActionExposure = 0;
      let primaryCtaCount = 0;
      let competingFilledCtaCount = 0;
      const actionsByRegion = new Map();
      for (const element of interactionElements) {
        const style = getComputedStyle(element);
        const text = `${element.className ?? ''} ${element.getAttribute('data-test-subj') ?? ''}`;
        const filled = /fill|primary|danger|warning/i.test(text) && rgba(style.backgroundColor)[3] > 0.1;
        const inline = element.matches('a,[class*="empty" i]') || style.backgroundColor === 'rgba(0, 0, 0, 0)';
        weightedActionExposure += filled ? 3 : inline ? 1 : 2;
        if (filled) primaryCtaCount += 1;
        if (filled && primaryCtaCount > 1) competingFilledCtaCount += 1;
        const region = element.closest('[data-visual-region]')?.getAttribute('data-visual-region') ?? 'unassigned';
        actionsByRegion.set(region, (actionsByRegion.get(region) ?? 0) + 1);
      }

      const salienceSurfaces = allElements.filter((element) => {
        const rect = intersection(element.getBoundingClientRect(), clip);
        const area = rect.width * rect.height;
        if (area < usableArea * 0.015 || area > usableArea * 0.5) return false;
        const style = getComputedStyle(element);
        const backgroundColor = rgba(style.backgroundColor);
        const ownContrast = contrast(backgroundColor, background(element.parentElement ?? root));
        return ownContrast >= 1.35 || /danger|warning|primary|callout|alert/i.test(`${element.className ?? ''} ${element.getAttribute('role') ?? ''}`);
      });
      const wideColoredTitleTreatments = headings.filter((element) => {
        const rect = element.getBoundingClientRect();
        const ownBackground = rgba(getComputedStyle(element).backgroundColor);
        return ownBackground[3] > 0.05 && rect.width > width * 0.45;
      }).length;

      const firstWorkCandidates = [...root.querySelectorAll('[data-visual-region]:not([data-visual-region="page-header"]):not([data-visual-region="workflow-header"]),.pageFrameContent > *,table,article,form')]
        .filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip))
        .sort((first, second) => first.getBoundingClientRect().top - second.getBoundingClientRect().top);
      const firstWorkY = firstWorkCandidates[0]?.getBoundingClientRect().top ?? null;

      const tableRecords = [];
      for (const table of [...root.querySelectorAll('table,[role="grid"]')].filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip))) {
        const rows = [...table.querySelectorAll('tbody tr,[role="row"]')].filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip));
        const columns = Math.max(0, ...rows.map((row) => row.querySelectorAll('td,th,[role="gridcell"],[role="columnheader"]').length));
        const rowHeights = rows.map((row) => row.getBoundingClientRect().height);
        const cells = [...table.querySelectorAll('td,th,[role="gridcell"],[role="columnheader"]')].filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip));
        const cellPaddings = cells.map((cell) => {
          const style = getComputedStyle(cell);
          return { inline: Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight), block: Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom) };
        });
        const wrappedCells = cells.filter((cell) => cell.getClientRects().length > 1 || cell.scrollHeight > Number.parseFloat(getComputedStyle(cell).lineHeight) * 1.6).length;
        const truncatedCells = cells.filter((cell) => getComputedStyle(cell).textOverflow === 'ellipsis' && cell.scrollWidth > cell.clientWidth + 1).length;
        let ownedOverflow = false;
        for (let current = table.parentElement; current && root.contains(current); current = current.parentElement) {
          const style = getComputedStyle(current);
          if (['auto', 'scroll'].includes(style.overflowX) && current.scrollWidth > current.clientWidth + 1) { ownedOverflow = true; break; }
        }
        tableRecords.push({
          selector: table.getAttribute('data-test-subj') ?? table.getAttribute('aria-label') ?? table.tagName.toLowerCase(),
          visibleRows: rows.length,
          columns,
          rowHeightP50: round(percentile(rowHeights, 0.5)),
          rowHeightP05: round(percentile(rowHeights, 0.05)),
          cellPaddingInlineP50: round(percentile(cellPaddings.map((padding) => padding.inline), 0.5)),
          cellPaddingBlockP50: round(percentile(cellPaddings.map((padding) => padding.block), 0.5)),
          wrappedCells,
          truncatedCells,
          badgeCount: table.querySelectorAll('.euiBadge,[class*="badge" i]').length,
          ownedOverflow,
          overflowPixels: Math.max(0, table.scrollWidth - table.clientWidth),
        });
      }

      const listRows = [...root.querySelectorAll('li,tbody tr,[role="row"],article')].filter((element) => visible(element) && intersects(element.getBoundingClientRect(), clip));
      const listRowHeights = listRows.map((element) => element.getBoundingClientRect().height);
      let undersizedTargetCount = 0;
      let undersizedWithSpacingExceptionCount = 0;
      for (const target of interactionElements) {
        const rect = target.getBoundingClientRect();
        if (rect.width >= 24 && rect.height >= 24) continue;
        undersizedTargetCount += 1;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const enoughSpacing = interactionElements.every((other) => {
          if (other === target) return true;
          const otherRect = other.getBoundingClientRect();
          const otherCenterX = otherRect.left + otherRect.width / 2;
          const otherCenterY = otherRect.top + otherRect.height / 2;
          return Math.hypot(centerX - otherCenterX, centerY - otherCenterY) >= 24;
        });
        if (enoughSpacing) undersizedWithSpacingExceptionCount += 1;
      }

      const documentOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth;
      return {
        scope,
        usable_content_area_px2: round(usableArea, 0),
        first_work_surface_y_ratio: firstWorkY === null ? null : round((firstWorkY - clip.top) / Math.max(1, height)),
        header_context_filter_scaffolding_ratio: firstWorkY === null ? null : round(clamp((firstWorkY - clip.top) / Math.max(1, height), 0, 1)),
        meaningful_occupancy_ratio: round(meaningfulOccupancy),
        blank_canvas_ratio: round(1 - meaningfulOccupancy),
        visible_text_chars: visibleTextCharacters,
        visible_words: visibleWords,
        text_chars_per_10k_px2: round(visibleTextCharacters / Math.max(1, usableArea) * 10_000),
        dom_block_count_per_100k_px2: round(blockElements.length / Math.max(1, usableArea) * 100_000),
        visual_region_count: visualRegions.length,
        top_level_group_count: topGroups.length,
        nested_panel_depth: nestedPanelDepth,
        visually_identical_nested_panel_levels: identicalPanelLevels,
        local_density_p50: round(percentile(localCounts, 0.5)),
        local_density_p95: round(percentile(localCounts, 0.95)),
        dom_edge_density_proxy: round(domEdgeDensityProxy, 6),
        screenshot_edge_density_proxy: { value: null, reason: 'No image-decoding dependency is added; optional screenshot proxy intentionally omitted.' },
        grouping: {
          median_intra_group_gap_px: round(medianIntra),
          median_inter_group_gap_px: round(medianInter),
          group_gap_ratio: medianIntra && medianInter !== null ? round(medianInter / medianIntra) : null,
          sibling_gaps_off_4px_grid: baselineOffGrid.length,
        },
        alignment: {
          unique_x_anchors_4px: new Set(xAnchors).size,
          unique_y_anchors_4px: new Set(yAnchors).size,
          x_alignment_entropy: round(entropy(xAnchors)),
          y_alignment_entropy: round(entropy(yAnchors)),
          layout_complexity_proxy: round((entropy(xAnchors) + entropy(yAnchors)) / 2),
        },
        hierarchy: {
          h1_count: headingLevels.filter((level) => level === 1).length,
          h2_count: headingLevels.filter((level) => level === 2).length,
          h3_count: headingLevels.filter((level) => level === 3).length,
          heading_order_violations: headingOrderViolations,
          high_salience_surface_count: salienceSurfaces.length,
          primary_cta_count: primaryCtaCount,
          competing_filled_cta_count: competingFilledCtaCount,
          wide_colored_title_treatments: wideColoredTitleTreatments,
        },
        typography: {
          roles: Object.fromEntries(Object.entries(typographicRoles).map(([role, values]) => [role, {
            count: values.length,
            font_size_p50: round(percentile(values.map((value) => value.fontSize), 0.5)),
            line_height_p50: round(percentile(values.map((value) => value.lineHeight), 0.5)),
            font_weight_p50: round(percentile(values.map((value) => value.fontWeight), 0.5)),
          }])),
          line_height_font_size_ratio_p05: round(percentile(lineHeightRatios, 0.05)),
          line_height_font_size_ratio_p50: round(percentile(lineHeightRatios, 0.5)),
          estimated_chars_per_rendered_line_p50: round(percentile(estimatedCharactersPerLine, 0.5)),
          estimated_chars_per_rendered_line_p95: round(percentile(estimatedCharactersPerLine, 0.95)),
          text_clipping_count: textClippingCount,
          text_overlap_count: textOverlapCount,
          truncation_count: truncationCount,
          contrast_ratio_p05: round(percentile(contrastRatios, 0.05)),
          contrast_below_4_5_count: contrastRatios.filter((ratio) => ratio < 4.5).length,
          paragraph_gap_p50: round(percentile(paragraphGaps, 0.5)),
          repeated_item_gap_p50: round(percentile(repeatedItemGaps, 0.5)),
        },
        interaction: {
          ...interactionCounts,
          raw_count: interactionElements.length,
          weighted_action_exposure: weightedActionExposure,
          actions_per_visual_region: Object.fromEntries(actionsByRegion),
          above_fold_competing_action_clusters: [...actionsByRegion.values()].filter((count) => count >= 4).length,
          undersized_target_count: undersizedTargetCount,
          undersized_target_spacing_exception_count: undersizedWithSpacingExceptionCount,
        },
        data_surfaces: {
          tables: tableRecords,
          visible_table_count: tableRecords.length,
          visible_table_rows: tableRecords.reduce((sum, table) => sum + table.visibleRows, 0),
          maximum_visible_columns: Math.max(0, ...tableRecords.map((table) => table.columns)),
          list_repeated_item_count: listRows.length,
          list_row_height_p05: round(percentile(listRowHeights, 0.05)),
          list_row_height_p50: round(percentile(listRowHeights, 0.5)),
          owned_overflow_table_count: tableRecords.filter((table) => table.ownedOverflow).length,
        },
        resilience: {
          document_horizontal_overflow_px: round(documentOverflow),
          root_scroll_width_px: root.scrollWidth,
          root_client_width_px: root.clientWidth,
          page_scroll_height_px: document.documentElement.scrollHeight,
        },
      };
    }

    return {
      page_id: pageId,
      viewport,
      first_viewport: scopeMetrics('first_viewport', firstClip),
      full_page: scopeMetrics('full_page', fullClip),
    };
  }, { rootSelector: spec.rootSelector, pageId: spec.id, viewport });
}

async function capturePair(page, spec, readiness) {
  const slug = routeSlug(spec.route);
  const firstName = `${spec.id}-${slug}.webp`;
  const fullName = `${spec.id}-${slug}.webp`;
  const firstPath = path.join(FIRST_DIR, firstName);
  const fullPath = path.join(FULL_DIR, fullName);
  const capturedAt = new Date().toISOString();

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: firstPath, type: 'webp', quality: SCREENSHOT_QUALITY, fullPage: false, animations: 'disabled' });

  const documentSize = await page.evaluate(() => ({
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  const fullClip = {
    x: 0,
    y: 0,
    width: Math.min(documentSize.width, 16_000),
    height: Math.min(documentSize.height, 32_000),
  };
  await page.screenshot({ path: fullPath, type: 'webp', quality: SCREENSHOT_QUALITY, clip: fullClip, captureBeyondViewport: true, animations: 'disabled' });

  const firstStats = await stat(firstPath);
  const fullStats = await stat(fullPath);
  const readinessCheck = readinessDescription(spec);
  const common = {
    pageId: spec.id,
    route: spec.route,
    finalUrl: readiness.finalUrl,
    viewport: PRIMARY_VIEWPORT,
    colorScheme: 'dark',
    sourceSha: SOURCE_SHA,
    captureTime: capturedAt,
    readinessCheck,
    validity: {
      valid: readiness.pathMatches && readiness.rootVisible && readiness.rootTextCharacters >= readinessCheck.meaningfulThreshold.minimumVisibleTextCharacters,
      reasons: [],
    },
    reviewerNote: 'Pending individual human visual review; no score may be assigned until replaced with a page-specific note.',
  };
  if (!common.validity.valid) common.validity.reasons.push('Readiness state did not satisfy route/root/text checks.');

  return [
    {
      ...common,
      kind: 'first-viewport',
      path: path.relative(OUTPUT_DIR, firstPath).split(path.sep).join('/'),
      pixelSize: PRIMARY_VIEWPORT,
      byteSize: firstStats.size,
      sha256: await sha256(firstPath),
    },
    {
      ...common,
      kind: 'full-page',
      path: path.relative(OUTPUT_DIR, fullPath).split(path.sep).join('/'),
      pixelSize: fullClip,
      byteSize: fullStats.size,
      sha256: await sha256(fullPath),
    },
  ];
}

async function collectTextSpacingResilience(page, spec) {
  const styleHandle = await page.addStyleTag({ content: `
    ${spec.rootSelector}, ${spec.rootSelector} * {
      line-height: 1.5 !important;
      letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important;
    }
    ${spec.rootSelector} p { margin-bottom: 2em !important; }
  ` });
  await page.waitForTimeout(100);
  const result = await page.evaluate((rootSelector) => {
    const root = document.querySelector(rootSelector);
    if (!root) return { status: 'N/A', reason: `Missing page root ${rootSelector}`, confidence: 0 };
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.top < window.innerHeight;
    };
    let unclampedClipping = 0;
    for (const element of root.querySelectorAll('h1,h2,h3,p,li,td,th,dt,dd,small,label,button,a,span,strong')) {
      if (!visible(element) || !element.textContent.trim()) continue;
      const style = getComputedStyle(element);
      const ownsScroll = ['auto', 'scroll'].includes(style.overflowX) || ['auto', 'scroll'].includes(style.overflowY);
      const ellipsized = style.textOverflow === 'ellipsis';
      const clipped = element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
      if (clipped && !ownsScroll && !ellipsized) unclampedClipping += 1;
    }
    const documentHorizontalOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth;
    const rootHorizontalOverflow = root.scrollWidth - root.clientWidth;
    return {
      status: 'measured',
      unclamped_clipping_count: unclampedClipping,
      document_horizontal_overflow_px: Math.max(0, documentHorizontalOverflow),
      root_horizontal_overflow_px: Math.max(0, rootHorizontalOverflow),
      survives: unclampedClipping === 0 && documentHorizontalOverflow <= 1,
      confidence: 0.82,
      note: 'Automated WCAG 1.4.12 survival proxy using 1.5 line height, 2em paragraph spacing, 0.12em letter spacing, and 0.16em word spacing.',
    };
  }, spec.rootSelector);
  await styleHandle.evaluate((element) => element.remove());
  return result;
}

const roundScore = (value) => Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
const medianNumber = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const madNumber = (values, center = medianNumber(values)) => center === null ? null : medianNumber(values.map((value) => Math.abs(value - center)));
const clampNumber = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const gradeFor = (uds) => uds >= 85 ? 'A' : uds >= 70 ? 'B' : uds >= 55 ? 'C' : uds >= 40 ? 'D' : 'F';
const safeMetric = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

function buildScoredReport(rawData, catalog) {
  const byPage = new Map(catalog.map((spec) => [spec.id, {
    spec,
    primary: rawData.measurements.find((measurement) => measurement.pageId === spec.id && measurement.viewport === '1231x768-primary'),
    structural: rawData.measurements.find((measurement) => measurement.pageId === spec.id && measurement.viewport === '1440x900-structural'),
    table: rawData.measurements.find((measurement) => measurement.pageId === spec.id && measurement.viewport === '1200x768-table-overflow'),
  }]));
  const scorableEntries = [...byPage.values()].filter(({ primary }) => primary?.status === 'measured');
  const densityVector = ({ primary }) => {
    const metrics = primary.metrics.first_viewport;
    const area = Math.max(1, metrics.usable_content_area_px2);
    return {
      text: safeMetric(metrics.text_chars_per_10k_px2),
      blocks: safeMetric(metrics.dom_block_count_per_100k_px2),
      actions: safeMetric(metrics.interaction.weighted_action_exposure) / area * 100_000,
      local: safeMetric(metrics.local_density_p95),
      edges: safeMetric(metrics.dom_edge_density_proxy),
      occupancy: safeMetric(metrics.meaningful_occupancy_ratio),
    };
  };
  const cohorts = new Map();
  for (const entry of scorableEntries) {
    const key = entry.spec.calibrationArchetype;
    if (!cohorts.has(key)) cohorts.set(key, []);
    cohorts.get(key).push(entry);
  }
  const referenceFor = (entry, key) => {
    const cohortEntries = cohorts.get(entry.spec.calibrationArchetype) ?? [];
    const referenceEntries = cohortEntries.length >= 3 ? cohortEntries : scorableEntries;
    const values = referenceEntries.map((candidate) => densityVector(candidate)[key]);
    const median = medianNumber(values) ?? 0;
    const mad = madNumber(values, median) ?? 0;
    const scale = mad > 0 ? 1.4826 * mad : Math.max(Math.abs(median) * 0.1, 0.001);
    return { median, mad, scale, cohort: cohortEntries.length >= 3 ? entry.spec.calibrationArchetype : 'portfolio-fallback', count: referenceEntries.length };
  };
  const zFor = (entry, key, value) => clampNumber((value - referenceFor(entry, key).median) / referenceFor(entry, key).scale, -3, 3);
  const loadForZ = (z) => roundScore(50 + z / 3 * 50);

  const pages = [...byPage.values()].map((entry) => {
    const { spec, primary, structural, table } = entry;
    const measured = [primary, structural, table].filter((measurement) => measurement?.status === 'measured').length;
    if (primary?.status !== 'measured') {
      return {
        id: spec.id,
        title: spec.title,
        route: spec.route,
        sourceArchetype: spec.archetype,
        archetype: spec.calibrationArchetype,
        scorable: false,
        confidence: 0,
        priority: 'Unscorable',
        failures: [primary?.reason ?? 'Primary viewport was not measured.'],
        scores: { DL: null, UDS: null, grade: null, OR: null, GLA: null, ODB: null, GWS: null, HSC: null, TLR: null, ICL: null, DSL: null, RAR: null, rawUDS: null, cap: null, acceptAtGlance: false },
        measurements: { primary: primary ?? null, structural: structural ?? null, table: table ?? null },
        humanReviewRecommendation: 'Fix the route/render failure before judging density.',
      };
    }

    const first = primary.metrics.first_viewport;
    const full = primary.metrics.full_page;
    const structuralFirst = structural?.status === 'measured' ? structural.metrics.first_viewport : null;
    const tableFirst = table?.status === 'measured' ? table.metrics.first_viewport : null;
    const vector = densityVector(entry);
    const z = Object.fromEntries(['text', 'blocks', 'actions', 'local', 'edges', 'occupancy'].map((key) => [key, zFor(entry, key, vector[key])]));
    const loads = {
      text: loadForZ(z.text),
      blocks: loadForZ(z.blocks),
      actions: loadForZ(z.actions),
      local: loadForZ(z.local),
      edges: loadForZ(z.edges),
    };
    const DL = roundScore(0.28 * loads.text + 0.22 * loads.blocks + 0.18 * loads.actions + 0.17 * loads.local + 0.15 * loads.edges);
    const hierarchy = first.hierarchy;
    const typography = first.typography;
    const interaction = first.interaction;
    const dataSurfaces = first.data_surfaces;
    const grouping = first.grouping;
    const resilience = first.resilience;
    const workY = first.first_work_surface_y_ratio;
    const groups = first.top_level_group_count;

    let GLA = 100;
    if (workY === null) GLA -= 20;
    else if (workY > 0.55) GLA -= 35;
    else if (workY > 0.42) GLA -= 24;
    else if (workY > 0.32) GLA -= 12;
    if (groups < 2) GLA -= 18;
    else if (groups === 2 || groups === 6 || groups === 7) GLA -= 8;
    else if (groups > 7) GLA -= 22;
    if (hierarchy.primary_cta_count === 0) GLA -= 8;
    if (hierarchy.primary_cta_count > 1) GLA -= Math.min(18, (hierarchy.primary_cta_count - 1) * 8);
    GLA -= Math.min(24, hierarchy.competing_filled_cta_count * 8);
    GLA -= Math.min(21, Math.max(0, hierarchy.high_salience_surface_count - 3) * 7);
    GLA -= Math.min(20, hierarchy.heading_order_violations * 8);
    GLA = roundScore(GLA);

    let ODB = 100;
    ODB -= Math.min(24, Math.abs(z.occupancy) * 8);
    ODB -= Math.min(20, Math.max(0, z.local - 1) * 10);
    if (first.blank_canvas_ratio > 0.68) ODB -= 28;
    else if (first.blank_canvas_ratio > 0.55) ODB -= 16;
    else if (first.blank_canvas_ratio < 0.15) ODB -= 12;
    if (workY !== null && workY > 0.45) ODB -= 18;
    ODB = roundScore(ODB);

    let GWS = 100;
    const gapRatio = grouping.group_gap_ratio;
    if (gapRatio === null) GWS -= 8;
    else if (gapRatio < 1) GWS -= 22;
    else if (gapRatio < 1.5) GWS -= 12;
    GWS -= Math.min(24, Math.max(0, grouping.sibling_gaps_off_4px_grid - 4) * 1.5);
    GWS -= Math.min(20, Math.max(0, first.nested_panel_depth - 2) * 8);
    GWS -= Math.min(16, Math.max(0, first.visually_identical_nested_panel_levels - 2) * 8);
    if (groups > 7) GWS -= 18;
    else if (groups > 5) GWS -= 8;
    GWS = roundScore(GWS);

    let HSC = 100;
    HSC -= Math.min(30, hierarchy.heading_order_violations * 12);
    HSC -= Math.min(28, Math.max(0, hierarchy.high_salience_surface_count - 3) * 8);
    HSC -= Math.min(24, hierarchy.competing_filled_cta_count * 10);
    HSC -= Math.min(24, hierarchy.wide_colored_title_treatments * 8);
    HSC -= hierarchy.h1_count === 1 ? 0 : Math.min(24, Math.abs(hierarchy.h1_count - 1) * 12);
    HSC = roundScore(HSC);

    let TLR = 100;
    TLR -= Math.min(60, typography.contrast_below_4_5_count * 15);
    TLR -= Math.min(60, typography.text_overlap_count * 20);
    TLR -= Math.min(48, typography.text_clipping_count * 8);
    if (typography.line_height_font_size_ratio_p05 !== null && typography.line_height_font_size_ratio_p05 < 1.35) TLR -= 20;
    if (typography.estimated_chars_per_rendered_line_p95 !== null && typography.estimated_chars_per_rendered_line_p95 > 80) TLR -= Math.min(20, (typography.estimated_chars_per_rendered_line_p95 - 80) * 0.5);
    TLR = roundScore(TLR);

    let ICL = 100;
    ICL -= Math.min(24, Math.max(0, z.actions) * 8);
    ICL -= Math.min(25, Math.max(0, interaction.raw_count - 20) * 1.5);
    ICL -= Math.min(24, interaction.above_fold_competing_action_clusters * 8);
    ICL -= Math.min(20, hierarchy.competing_filled_cta_count * 10);
    ICL = roundScore(ICL);

    let DSL = 100;
    for (const tableRecord of dataSurfaces.tables) {
      if (tableRecord.rowHeightP05 !== null && tableRecord.rowHeightP05 < 36) DSL -= 20;
      else if (tableRecord.rowHeightP05 !== null && tableRecord.rowHeightP05 < 40) DSL -= 10;
      if (tableRecord.overflowPixels > 1 && !tableRecord.ownedOverflow) DSL -= 25;
      DSL -= Math.min(12, tableRecord.wrappedCells * 1.5);
    }
    DSL -= Math.min(18, Math.max(0, dataSurfaces.maximum_visible_columns - 8) * 3);
    if (dataSurfaces.list_repeated_item_count >= 4 && dataSurfaces.list_row_height_p05 !== null && dataSurfaces.list_row_height_p05 < 36) DSL -= 18;
    DSL = roundScore(DSL);

    const spacing = primary.textSpacing;
    let RAR = 100;
    if (resilience.document_horizontal_overflow_px > 1) RAR -= 35;
    if (structuralFirst?.resilience.document_horizontal_overflow_px > 1) RAR -= 25;
    if (tableFirst?.resilience.document_horizontal_overflow_px > 1) RAR -= 25;
    if (spacing?.status === 'measured' && !spacing.survives) RAR -= 30;
    else if (!spacing || spacing.status !== 'measured') RAR -= 10;
    const unexceptedTargets = interaction.undersized_target_count - interaction.undersized_target_spacing_exception_count;
    RAR -= Math.min(25, Math.max(0, unexceptedTargets) * 2);
    RAR = roundScore(RAR);

    const rawUDS = roundScore(0.15 * GLA + 0.15 * ODB + 0.15 * GWS + 0.15 * HSC + 0.15 * TLR + 0.10 * ICL + 0.10 * DSL + 0.05 * RAR);
    const hardFailures = [];
    if (typography.text_overlap_count > 0) hardFailures.push(`first-viewport text overlap (${typography.text_overlap_count})`);
    if (typography.text_clipping_count > 0) hardFailures.push(`first-viewport unclamped clipping (${typography.text_clipping_count})`);
    if (typography.contrast_below_4_5_count > 0) hardFailures.push(`normal-text contrast below 4.5:1 (${typography.contrast_below_4_5_count})`);
    if (resilience.document_horizontal_overflow_px > 1) hardFailures.push(`document horizontal overflow (${resilience.document_horizontal_overflow_px}px)`);
    const p1Failures = [];
    if (typography.line_height_font_size_ratio_p05 !== null && typography.line_height_font_size_ratio_p05 < 1.35) p1Failures.push('line-height floor');
    if (workY !== null && workY > 0.45) p1Failures.push('late first work surface');
    if (groups > 7) p1Failures.push('excess top-level groups');
    if (hierarchy.competing_filled_cta_count > 0) p1Failures.push('competing filled CTAs');
    if (spacing?.status === 'measured' && !spacing.survives) p1Failures.push('text-spacing failure');
    if (dataSurfaces.tables.some((record) => record.rowHeightP05 !== null && record.rowHeightP05 < 36)) p1Failures.push('rows below dense minimum');
    let cap = 100;
    if (hardFailures.length) cap = 49;
    else if (p1Failures.length >= 2) cap = 69;
    const UDS = roundScore(Math.min(rawUDS, cap));
    const blankPenalty = clampNumber((first.blank_canvas_ratio - 0.42) / 0.38 * 100, 0, 100);
    const latePenalty = workY === null ? 100 : clampNumber((workY - 0.28) / 0.42 * 100, 0, 100);
    const crowdingRisk = clampNumber(0.45 * DL + 0.25 * (100 - ODB) + 0.15 * (100 - TLR) + 0.15 * (100 - HSC), 0, 100);
    const sparsityRisk = clampNumber(0.55 * blankPenalty + 0.45 * latePenalty, 0, 100);
    const OR = roundScore(Math.max(100 - UDS, 0.7 * Math.max(crowdingRisk, sparsityRisk) + 0.3 * ((crowdingRisk + sparsityRisk) / 2)));
    const grade = gradeFor(UDS);
    const acceptAtGlance = UDS >= 70 && cap === 100 && GLA >= 65 && HSC >= 65 && TLR >= 65;
    const priority = UDS < 40 || (cap === 49 && hardFailures.length) ? 'P0' : UDS < 55 || cap === 69 ? 'P1' : UDS < 70 ? 'P2' : 'Monitor';
    const confidence = roundScore((measured / 3 * 0.7 + (spacing?.status === 'measured' ? 0.15 : 0) + 0.1) * 100) / 100;
    const failures = [...hardFailures, ...p1Failures.map((failure) => `P1: ${failure}`)];

    return {
      id: spec.id,
      title: spec.title,
      route: spec.route,
      sourceArchetype: spec.archetype,
      archetype: spec.calibrationArchetype,
      scorable: true,
      confidence,
      priority,
      failures,
      scores: { DL, UDS, grade, OR, GLA, ODB, GWS, HSC, TLR, ICL, DSL, RAR, rawUDS, cap, acceptAtGlance, crowdingRisk: roundScore(crowdingRisk), sparsityRisk: roundScore(sparsityRisk) },
      densityCalibration: {
        raw: vector,
        z,
        channelLoads: loads,
        references: Object.fromEntries(['text', 'blocks', 'actions', 'local', 'edges', 'occupancy'].map((key) => [key, referenceFor(entry, key)])),
      },
      measurements: {
        primary: { status: primary.status, viewport: primary.viewport, readiness: primary.readiness, firstViewport: first, fullPage: full, textSpacing: spacing ?? null, completedAt: primary.completedAt },
        structural: structural?.status === 'measured' ? { status: structural.status, viewport: structural.viewport, firstViewport: structural.metrics.first_viewport, fullPage: structural.metrics.full_page, completedAt: structural.completedAt } : structural ?? null,
        table: table?.status === 'measured' ? { status: table.status, viewport: table.viewport, firstViewport: table.metrics.first_viewport, fullPage: table.metrics.full_page, completedAt: table.completedAt } : table ?? null,
      },
      humanReviewRecommendation: priority === 'P0' || priority === 'P1' ? 'Required: inspect the first viewport and the affected text/table/control region before implementation.' : OR >= 55 || !acceptAtGlance ? 'Recommended: review first-glance hierarchy and the highest-risk local-density region.' : 'Sample review: confirm task prominence and production-length fixture resilience.',
    };
  });

  const scorablePages = pages.filter((page) => page.scorable);
  const portfolioMedian = (key) => medianNumber(scorablePages.map((page) => page.scores[key]));
  const archetypeSummaries = [...new Set(pages.map((page) => page.archetype))].map((archetype) => {
    const cohortPages = pages.filter((page) => page.archetype === archetype && page.scorable);
    return {
      archetype,
      count: pages.filter((page) => page.archetype === archetype).length,
      scorable: cohortPages.length,
      medianDL: medianNumber(cohortPages.map((page) => page.scores.DL)),
      medianUDS: medianNumber(cohortPages.map((page) => page.scores.UDS)),
      medianOR: medianNumber(cohortPages.map((page) => page.scores.OR)),
    };
  });
  const gradeDistribution = Object.fromEntries(['A', 'B', 'C', 'D', 'F'].map((grade) => [grade, scorablePages.filter((page) => page.scores.grade === grade).length]));
  const priorityDistribution = Object.fromEntries(['P0', 'P1', 'P2', 'Monitor', 'Unscorable'].map((priority) => [priority, pages.filter((page) => page.priority === priority).length]));

  return {
    schemaVersion: '1.0.0',
    metricVersion: METRIC_VERSION,
    generatedAt: new Date().toISOString(),
    source: { repository: 'lwmraymond/SOC_network', branch: 'codex/kibana-42page-visual', sha: SOURCE_SHA },
    environment: { browser: rawData.metadata.browser, colorScheme: rawData.metadata.colorScheme, viewports: rawData.metadata.viewports, baseUrl: rawData.metadata.baseUrl },
    calibration: {
      label: 'internal relative calibration',
      robustZ: 'clamp((x - median_reference) / (1.4826 * MAD_reference), -3, 3)',
      archetypes: ['dashboard/analytics', 'queue/table', 'entity/detail', 'authoring/workbench', 'settings/catalog'],
      densityLoadCoefficients: { text: 0.28, blocks: 0.22, weightedActions: 0.18, localP95: 0.17, domEdgeProxy: 0.15 },
      udsCoefficients: { GLA: 0.15, ODB: 0.15, GWS: 0.15, HSC: 0.15, TLR: 0.15, ICL: 0.10, DSL: 0.10, RAR: 0.05 },
      screenshotMetrics: { status: 'N/A', reason: 'Metrics-only run; screenshot edge density, feature congestion, and entropy were not computed. A DOM edge-length proxy is used and labelled.' },
    },
    limitations: rawData.limitations,
    portfolio: {
      pages: pages.length,
      scorable: scorablePages.length,
      unscorable: pages.length - scorablePages.length,
      acceptAtGlance: scorablePages.filter((page) => page.scores.acceptAtGlance).length,
      medianDL: portfolioMedian('DL'),
      medianUDS: portfolioMedian('UDS'),
      medianOR: portfolioMedian('OR'),
      gradeDistribution,
      priorityDistribution,
      archetypes: archetypeSummaries,
      highestCrowdingRisk: [...scorablePages].sort((a, b) => b.scores.crowdingRisk - a.scores.crowdingRisk).slice(0, 5).map((page) => ({ id: page.id, value: page.scores.crowdingRisk })),
      highestSparsityRisk: [...scorablePages].sort((a, b) => b.scores.sparsityRisk - a.scores.sparsityRisk).slice(0, 5).map((page) => ({ id: page.id, value: page.scores.sparsityRisk })),
      strongestExamples: [...scorablePages].filter((page) => page.scores.cap === 100).sort((a, b) => b.scores.UDS - a.scores.UDS).slice(0, 5).map((page) => ({ id: page.id, UDS: page.scores.UDS })),
    },
    pages,
    validation: null,
  };
}

function validateScoredReport(report) {
  const errors = [];
  const expectedIds = Array.from({ length: 42 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`);
  const ids = report.pages.map((page) => page.id);
  if (report.pages.length !== 42) errors.push(`Expected 42 pages; found ${report.pages.length}.`);
  if (new Set(ids).size !== ids.length) errors.push('Duplicate page IDs found.');
  for (const id of expectedIds) if (!ids.includes(id)) errors.push(`Missing ${id}.`);
  for (const page of report.pages) {
    if (!page.scorable) continue;
    const scores = page.scores;
    const recomputedRaw = roundScore(0.15 * scores.GLA + 0.15 * scores.ODB + 0.15 * scores.GWS + 0.15 * scores.HSC + 0.15 * scores.TLR + 0.10 * scores.ICL + 0.10 * scores.DSL + 0.05 * scores.RAR);
    if (Math.abs(recomputedRaw - scores.rawUDS) > 0.11) errors.push(`${page.id}: raw UDS mismatch (${scores.rawUDS} vs ${recomputedRaw}).`);
    const recomputedUDS = roundScore(Math.min(recomputedRaw, scores.cap));
    if (Math.abs(recomputedUDS - scores.UDS) > 0.11) errors.push(`${page.id}: capped UDS mismatch (${scores.UDS} vs ${recomputedUDS}).`);
    if (gradeFor(scores.UDS) !== scores.grade) errors.push(`${page.id}: grade mismatch.`);
    const accept = scores.UDS >= 70 && scores.cap === 100 && scores.GLA >= 65 && scores.HSC >= 65 && scores.TLR >= 65;
    if (accept !== scores.acceptAtGlance) errors.push(`${page.id}: accept-at-glance mismatch.`);
    for (const key of ['DL', 'UDS', 'OR', 'GLA', 'ODB', 'GWS', 'HSC', 'TLR', 'ICL', 'DSL', 'RAR']) {
      if (!Number.isFinite(scores[key]) || scores[key] < 0 || scores[key] > 100) errors.push(`${page.id}: ${key} out of range.`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    pageCount: report.pages.length,
    uniquePageCount: new Set(ids).size,
    exactCanonicalCoverage: errors.every((error) => !/Expected|Duplicate|Missing/.test(error)),
    formulaCheckedPages: report.pages.filter((page) => page.scorable).length,
  };
}

async function validateManifest(manifest, routes) {
  const expected = new Set(routes.map(({ id }) => id));
  const byKind = Object.groupBy(manifest.images, ({ kind }) => kind);
  const errors = [];
  for (const kind of ['first-viewport', 'full-page']) {
    const records = byKind[kind] ?? [];
    const ids = records.map(({ pageId }) => pageId);
    if (records.length !== 42) errors.push(`${kind}: expected 42 records, found ${records.length}`);
    if (new Set(ids).size !== ids.length) errors.push(`${kind}: duplicate page ids present`);
    for (const id of expected) if (!ids.includes(id)) errors.push(`${kind}: missing ${id}`);
    for (const record of records) {
      if (!record.validity.valid) errors.push(`${kind}: ${record.pageId} invalid (${record.validity.reasons.join('; ')})`);
      const filePath = path.join(OUTPUT_DIR, record.path);
      try {
        const fileStats = await stat(filePath);
        if (fileStats.size <= 2_000) errors.push(`${kind}: ${record.pageId} screenshot is unexpectedly small (${fileStats.size} bytes)`);
      } catch (error) {
        errors.push(`${kind}: ${record.pageId} file missing (${error.message})`);
      }
    }
  }
  return { valid: errors.length === 0, errors, firstViewportCount: (byKind['first-viewport'] ?? []).length, fullPageCount: (byKind['full-page'] ?? []).length };
}

async function run() {
  const catalog = await loadCatalog();
  await mkdir(FIRST_DIR, { recursive: true });
  await mkdir(FULL_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const measurements = [];
  const screenshotImages = [];
  const renderFailures = [];
  const viewportPlans = [
    { name: '1231x768-primary', ...PRIMARY_VIEWPORT, capture: true },
    { name: '1440x900-structural', ...STRUCTURAL_VIEWPORT, capture: false },
    { name: '1200x768-table-overflow', ...TABLE_VIEWPORT, capture: false },
  ];

  try {
    for (const viewportPlan of viewportPlans) {
      const context = await browser.newContext({
        viewport: { width: viewportPlan.width, height: viewportPlan.height },
        colorScheme: 'dark',
        reducedMotion: 'reduce',
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      for (const spec of catalog) {
        const startedAt = new Date().toISOString();
        try {
          const readiness = await waitForReadyPage(page, spec);
          const metrics = await collectMetrics(page, spec, { width: viewportPlan.width, height: viewportPlan.height, name: viewportPlan.name });
          const textSpacing = viewportPlan.name === '1231x768-primary' ? await collectTextSpacingResilience(page, spec) : null;
          let screenshotRecords = [];
          if (viewportPlan.capture && captureScreenshots) {
            screenshotRecords = await capturePair(page, spec, readiness);
            screenshotImages.push(...screenshotRecords);
          }
          measurements.push({
            pageId: spec.id,
            title: spec.title,
            route: spec.route,
            archetype: spec.archetype,
            calibrationArchetype: spec.calibrationArchetype,
            viewport: viewportPlan.name,
            status: 'measured',
            confidence: viewportPlan.capture ? 0.9 : 0.85,
            readiness,
            metrics,
            screenshotPaths: screenshotRecords.map(({ path: screenshotPath }) => screenshotPath),
            textSpacing,
            startedAt,
            completedAt: new Date().toISOString(),
          });
          console.log(`${viewportPlan.name} ${spec.id} measured${screenshotRecords.length ? ' + screenshot pair' : ''}`);
        } catch (error) {
          const failure = {
            pageId: spec.id,
            title: spec.title,
            route: spec.route,
            archetype: spec.archetype,
            calibrationArchetype: spec.calibrationArchetype,
            viewport: viewportPlan.name,
            status: 'N/A',
            reason: error instanceof Error ? error.message : String(error),
            confidence: 0,
            startedAt,
            completedAt: new Date().toISOString(),
          };
          renderFailures.push(failure);
          measurements.push(failure);
          console.error(`${viewportPlan.name} ${spec.id} N/A: ${failure.reason}`);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const manifest = {
    metricVersion: METRIC_VERSION,
    generatedAt: new Date().toISOString(),
    sourceSha: SOURCE_SHA,
    baseUrl: BASE_URL,
    requiredViewport: PRIMARY_VIEWPORT,
    colorScheme: 'dark',
    imageFormat: 'webp',
    imageQuality: SCREENSHOT_QUALITY,
    images: screenshotImages,
  };
  const manifestValidation = captureScreenshots ? await validateManifest(manifest, catalog) : { valid: true, skipped: true, reason: 'Metrics-only run; screenshot capture was not requested.', errors: [], firstViewportCount: 0, fullPageCount: 0 };
  manifest.validation = manifestValidation;
  await writeFile(path.join(SCREENSHOT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const data = {
    metadata: {
      metricVersion: METRIC_VERSION,
      generatedAt: new Date().toISOString(),
      sourceSha: SOURCE_SHA,
      baseUrl: BASE_URL,
      browser: 'Chromium via Playwright',
      colorScheme: 'dark',
      viewports: viewportPlans.map(({ name, width, height, capture }) => ({ name, width, height, screenshotCapture: capture })),
      scope: 'Page-owned content only; fixed global application header and primary sidebar excluded from geometric metrics.',
      calibration: 'Same-archetype robust-z internal relative calibration; scores remain an automated decision aid and require human review.',
    },
    catalog: catalog.map(({ rootSelector, ...spec }) => ({ ...spec, rootSelector })),
    measurements,
    screenshotManifest: 'screenshots/manifest.json',
    validation: {
      canonicalPageCount: catalog.length,
      uniqueCanonicalPageCount: new Set(catalog.map(({ id }) => id)).size,
      measuredPrimaryPages: measurements.filter(({ viewport, status }) => viewport === '1231x768-primary' && status === 'measured').length,
      measuredStructuralPages: measurements.filter(({ viewport, status }) => viewport === '1440x900-structural' && status === 'measured').length,
      measuredTablePages: measurements.filter(({ viewport, status }) => viewport === '1200x768-table-overflow' && status === 'measured').length,
      screenshotManifest: manifestValidation,
      renderFailureCount: renderFailures.length,
    },
    renderFailures,
    limitations: [
      'Fixture-backed prototype data is evaluated only for presentation geometry, not semantic correctness or realism.',
      'Automated DOM/CSS proxies support but do not replace individual human review of the first viewport and full page.',
      'Screenshot edge density/feature congestion is optional and omitted to avoid adding a decoding dependency; the field is explicitly N/A.',
      'Browser rendering is Chromium dark mode at deterministic desktop viewports; results may differ with fonts, operating systems, or zoom settings.',
      'WCAG text-spacing resilience is tested with the normative override values; automated survival detection remains a conservative proxy.',
    ],
  };
  const scoredReport = buildScoredReport(data, catalog);
  scoredReport.validation = validateScoredReport(scoredReport);
  await mkdir(path.dirname(FINAL_OUTPUT_PATH), { recursive: true });
  await writeFile(FINAL_OUTPUT_PATH, `${JSON.stringify(scoredReport, null, 2)}\n`);

  if (!manifestValidation.valid || renderFailures.length > 0 || !scoredReport.validation.valid) {
    console.error(JSON.stringify({ manifestValidation, renderFailures, scoreValidation: scoredReport.validation }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Information-density evidence complete: ${scoredReport.portfolio.scorable}/42 pages scored and validated.`);
    console.log(`Output: ${FINAL_OUTPUT_PATH}`);
  }
}

if (validateOnlyPath) {
  const report = JSON.parse(await readFile(path.resolve(validateOnlyPath), 'utf8'));
  const validation = validateScoredReport(report);
  console.log(JSON.stringify(validation, null, 2));
  if (!validation.valid) process.exitCode = 1;
} else {
  await run();
}
