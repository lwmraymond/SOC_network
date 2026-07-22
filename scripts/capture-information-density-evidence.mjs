import { chromium } from '@playwright/test';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

/* global document, getComputedStyle, location, window */

const run = promisify(execFile);
const sourceSha = process.env.AUDIT_SOURCE_SHA;
const baseUrl = process.env.SOC_E2E_BASE_URL ?? 'http://127.0.0.1:5174';
const viewport = { width: 1231, height: 768 };
const output = path.resolve('docs/design/audit-2026-07-22');
const firstDir = path.join(output, 'screenshots/first-viewport');
const fullDir = path.join(output, 'screenshots/full-page');
const quality = 78;
if (!sourceSha || !/^[0-9a-f]{40}$/i.test(sourceSha)) throw new Error('AUDIT_SOURCE_SHA is required.');

const slug = (route) => route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const sha256 = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');

async function catalog() {
  const source = await readFile('tests/e2e/canonicalRoutes.ts', 'utf8');
  const pattern = /\{\s*id:\s*'(?<id>P\d{2})',\s*path:\s*'(?<route>[^']+)',\s*title:\s*'(?<title>[^']+)'\s*\}/g;
  const pages = [...source.matchAll(pattern)].map(({ groups }) => ({
    ...groups,
    rootSelector: groups.id === 'P07' ? '.p07Composition' : `[data-page-id="${groups.id}"]`,
  }));
  const expected = Array.from({ length: 42 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`);
  if (pages.length !== 42 || new Set(pages.map(({ id }) => id)).size !== 42 || expected.some((id) => !pages.some((page) => page.id === id))) throw new Error('Canonical catalog is not exactly P01-P42.');
  return pages;
}

async function waitReady(page, spec) {
  const target = new URL(spec.route, baseUrl);
  await page.goto(target.toString(), { waitUntil: 'networkidle', timeout: 45_000 });
  await page.locator(spec.rootSelector).waitFor({ state: 'visible', timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  const minimumText = spec.id === 'P07' ? 300 : 220;
  await page.waitForFunction(({ rootSelector, pathname, minimumText }) => {
    const root = document.querySelector(rootSelector);
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
  }, { rootSelector: spec.rootSelector, pathname: target.pathname, minimumText }, { timeout: 30_000 });

  const samples = [];
  for (let index = 0; index < 4; index += 1) {
    samples.push(await page.evaluate((selector) => {
      const root = document.querySelector(selector);
      return {
        textLength: (root?.innerText ?? '').replace(/\s+/g, ' ').trim().length,
        rootHeight: root?.scrollHeight ?? 0,
        documentHeight: document.documentElement.scrollHeight,
      };
    }, spec.rootSelector));
    if (index < 3) await page.waitForTimeout(600);
  }
  const [previous, latest] = samples.slice(-2);
  for (const key of ['textLength', 'rootHeight', 'documentHeight']) {
    if (Math.abs(latest[key] - previous[key]) / Math.max(1, previous[key]) > 0.01) throw new Error(`Unstable page: ${JSON.stringify(samples)}`);
  }
  const state = await page.evaluate(({ selector, pathname }) => {
    const root = document.querySelector(selector);
    return {
      finalUrl: location.href,
      pathMatches: location.pathname === pathname,
      rootVisible: Boolean(root && root.getBoundingClientRect().width > 1 && root.getBoundingClientRect().height > 1),
      fixtureReady: root?.getAttribute('data-fixture-ready') ?? 'not-applicable',
      rootTextCharacters: (root?.innerText ?? '').replace(/\s+/g, ' ').trim().length,
      rootScrollHeight: root?.scrollHeight ?? 0,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
    };
  }, { selector: spec.rootSelector, pathname: target.pathname });
  return { ...state, minimumText, stableSamples: samples };
}

async function webpScreenshot(page, destination, options) {
  const temporary = `${destination}.png`;
  await page.screenshot({ path: temporary, type: 'png', animations: 'disabled', ...options });
  const png = await readFile(temporary);
  if (png.toString('ascii', 1, 4) !== 'PNG') throw new Error(`Unexpected screenshot format for ${destination}`);
  const pixelSize = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  await run('cwebp', ['-quiet', '-mt', '-q', String(quality), temporary, '-o', destination]);
  await unlink(temporary);
  return pixelSize;
}

async function capturePair(page, spec, readiness) {
  const filename = `${spec.id}-${slug(spec.route)}.webp`;
  const firstPath = path.join(firstDir, filename);
  const fullPath = path.join(fullDir, filename);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const firstPixelSize = await webpScreenshot(page, firstPath, { fullPage: false });
  const pageSize = await page.evaluate(() => ({
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  if (pageSize.width > 16_000 || pageSize.height > 32_000) throw new Error(`Full page exceeds evidence limit: ${pageSize.width}×${pageSize.height}`);
  const fullPixelSize = await webpScreenshot(page, fullPath, { fullPage: true });
  if (fullPixelSize.height < pageSize.height) throw new Error(`Full-page capture clipped at ${fullPixelSize.height}px; expected at least ${pageSize.height}px`);
  const common = {
    pageId: spec.id,
    route: spec.route,
    finalUrl: readiness.finalUrl,
    viewport,
    colorScheme: 'dark',
    captureTime: new Date().toISOString(),
    sourceSha,
    readinessCheck: {
      rootSelector: spec.rootSelector,
      minimumVisibleTextCharacters: readiness.minimumText,
      minimumMeaningfulSurfaces: 2,
      fontsReady: true,
      stableSamples: readiness.stableSamples,
      fixtureReady: readiness.fixtureReady,
    },
    validity: { valid: readiness.pathMatches && readiness.rootVisible && readiness.rootTextCharacters >= readiness.minimumText, reasons: [] },
    reviewerNote: 'Pending individual human visual review; this record cannot support a score until the note is replaced.',
  };
  return Promise.all([
    { ...common, kind: 'first-viewport', path: path.relative(output, firstPath).split(path.sep).join('/'), pixelSize: firstPixelSize },
    { ...common, kind: 'full-page', path: path.relative(output, fullPath).split(path.sep).join('/'), pixelSize: fullPixelSize },
  ].map(async (record) => ({ ...record, byteSize: (await stat(path.join(output, record.path))).size, sha256: await sha256(path.join(output, record.path)) })));
}

async function validate(images, pages) {
  const errors = [];
  for (const kind of ['first-viewport', 'full-page']) {
    const records = images.filter((image) => image.kind === kind);
    if (records.length !== 42) errors.push(`${kind}: ${records.length} records`);
    if (new Set(records.map(({ pageId }) => pageId)).size !== 42) errors.push(`${kind}: duplicate page ids`);
    for (const page of pages) if (!records.some(({ pageId }) => pageId === page.id)) errors.push(`${kind}: missing ${page.id}`);
    for (const record of records) {
      if (!record.validity.valid) errors.push(`${kind}: invalid ${record.pageId}`);
      if (record.pixelSize.width !== viewport.width) errors.push(`${kind}: ${record.pageId} width ${record.pixelSize.width}`);
      if (kind === 'first-viewport' && record.pixelSize.height !== viewport.height) errors.push(`${kind}: ${record.pageId} height ${record.pixelSize.height}`);
      if (kind === 'full-page' && record.pixelSize.height < viewport.height) errors.push(`${kind}: ${record.pageId} height ${record.pixelSize.height}`);
      try { if ((await stat(path.join(output, record.path))).size < 2_000) errors.push(`${kind}: ${record.pageId} file too small`); }
      catch (error) { errors.push(`${kind}: ${record.pageId} missing (${error.message})`); }
    }
  }
  for (const page of pages) {
    const first = images.find((image) => image.pageId === page.id && image.kind === 'first-viewport');
    const full = images.find((image) => image.pageId === page.id && image.kind === 'full-page');
    if (first && full && full.pixelSize.height > viewport.height && first.sha256 === full.sha256) errors.push(`full-page: ${page.id} is byte-identical to first viewport`);
  }
  return {
    valid: errors.length === 0,
    errors,
    firstViewportCount: images.filter(({ kind }) => kind === 'first-viewport').length,
    fullPageCount: images.filter(({ kind }) => kind === 'full-page').length,
  };
}

await mkdir(firstDir, { recursive: true });
await mkdir(fullDir, { recursive: true });
const pages = await catalog();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport, colorScheme: 'dark', reducedMotion: 'reduce', deviceScaleFactor: 1 });
const page = await context.newPage();
const images = [];
const failures = [];
for (const spec of pages) {
  try {
    const readiness = await waitReady(page, spec);
    images.push(...await capturePair(page, spec, readiness));
    console.log(`${spec.id}: valid screenshot pair`);
  } catch (error) {
    failures.push({ pageId: spec.id, route: spec.route, reason: error instanceof Error ? error.message : String(error), confidence: 0 });
    console.error(`${spec.id}: N/A ${failures.at(-1).reason}`);
  }
}
await context.close();
await browser.close();
const validation = await validate(images, pages);
const manifest = {
  metricVersion: 'information-density-screenshot-manifest-v1.0.0',
  generatedAt: new Date().toISOString(),
  sourceSha,
  baseUrl,
  viewport,
  colorScheme: 'dark',
  imageFormat: 'webp',
  imageQuality: quality,
  pages,
  images,
  failures,
  validation,
};
await writeFile(path.join(output, 'screenshots/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(output, 'screenshots/capture-validation.json'), `${JSON.stringify({ sourceSha, generatedAt: new Date().toISOString(), failures, validation }, null, 2)}\n`);
if (!validation.valid || failures.length) {
  console.error(JSON.stringify({ failures, validation }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Captured ${validation.firstViewportCount} first-viewport and ${validation.fullPageCount} full-page images.`);
}
