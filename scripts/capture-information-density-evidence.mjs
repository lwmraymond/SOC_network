import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_SHA = process.env.AUDIT_SOURCE_SHA;
const BASE_URL = process.env.SOC_E2E_BASE_URL ?? 'http://127.0.0.1:5174';
const VIEWPORT = { width: 1231, height: 768 };
const OUTPUT = path.resolve('docs/design/audit-2026-07-22');
const FIRST = path.join(OUTPUT, 'screenshots/first-viewport');
const FULL = path.join(OUTPUT, 'screenshots/full-page');
const QUALITY = 78;

if (!SOURCE_SHA || !/^[0-9a-f]{40}$/i.test(SOURCE_SHA)) throw new Error('AUDIT_SOURCE_SHA is required.');

const routeSlug = (route) => route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const hash = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');

async function catalog() {
  const source = await readFile('tests/e2e/canonicalRoutes.ts', 'utf8');
  const pattern = /\{\s*id:\s*'(?<id>P\d{2})',\s*path:\s*'(?<route>[^']+)',\s*title:\s*'(?<title>[^']+)'\s*\}/g;
  const pages = [...source.matchAll(pattern)].map(({ groups }) => ({
    ...groups,
    rootSelector: groups.id === 'P07' ? '.p07Composition' : `[data-page-id="${groups.id}"]`,
  }));
  const expected = Array.from({ length: 42 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`);
  if (pages.length !== 42 || new Set(pages.map(({ id }) => id)).size !== 42 || expected.some((id) => !pages.some((page) => page.id === id))) {
    throw new Error(`Canonical catalog mismatch: ${pages.map(({ id }) => id).join(', ')}`);
  }
  return pages;
}

async function waitReady(page, spec) {
  const target = new URL(spec.route, BASE_URL);
  await page.goto(target.toString(), { waitUntil: 'networkidle', timeout: 45_000 });
  await page.locator(spec.rootSelector).waitFor({ state: 'visible', timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  const minimumText = spec.id === 'P07' ? 300 : 220;
  await page.waitForFunction(({ rootSelector, canonicalPath, minimumText }) => {
    const root = document.querySelector(rootSelector);
    if (!root || location.pathname !== canonicalPath) return false;
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 1 && rect.height > 1;
    };
    const rect = root.getBoundingClientRect();
    if (!visible(root) || rect.width < 300 || rect.height < 240) return false;
    if (root.hasAttribute('data-fixture-ready') && root.getAttribute('data-fixture-ready') !== 'true') return false;
    if ([...document.querySelectorAll('.routeLoading,[aria-busy="true"],[class*="skeleton" i],.euiLoadingSpinner')].some(visible)) return false;
    const text = (root.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (/route not found|unable to load this work surface|production adapter unavailable|application error/i.test(text)) return false;
    const surfaces = root.querySelectorAll('[data-visual-region],table,[role="grid"],article,form,svg,canvas,[role="tablist"],.euiPanel').length;
    return text.length >= minimumText && surfaces >= 2;
  }, { rootSelector: spec.rootSelector, canonicalPath: target.pathname, minimumText }, { timeout: 30_000 });

  const samples = [];
  for (let index = 0; index < 3; index += 1) {
    samples.push(await page.evaluate((selector) => {
      const root = document.querySelector(selector);
      return {
        textLength: (root?.innerText ?? '').replace(/\s+/g, ' ').trim().length,
        rootHeight: root?.scrollHeight ?? 0,
        documentHeight: document.documentElement.scrollHeight,
      };
    }, spec.rootSelector));
    if (index < 2) await page.waitForTimeout(600);
  }
  const stable = samples.slice(1).every((sample, index) => {
    const previous = samples[index];
    return Math.abs(sample.textLength - previous.textLength) / Math.max(1, previous.textLength) <= 0.01
      && Math.abs(sample.rootHeight - previous.rootHeight) / Math.max(1, previous.rootHeight) <= 0.01;
  });
  if (!stable) throw new Error(`Unstable page after readiness: ${JSON.stringify(samples)}`);

  return page.evaluate(({ selector, canonicalPath, minimumText }) => {
    const root = document.querySelector(selector);
    const text = (root?.innerText ?? '').replace(/\s+/g, ' ').trim();
    return {
      finalUrl: location.href,
      pathMatches: location.pathname === canonicalPath,
      rootVisible: Boolean(root && root.getBoundingClientRect().width > 1 && root.getBoundingClientRect().height > 1),
      fixtureReady: root?.getAttribute('data-fixture-ready') ?? 'not-applicable',
      rootTextCharacters: text.length,
      minimumText,
      rootScrollHeight: root?.scrollHeight ?? 0,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
      stableSamples: samples,
    };
  }, { selector: spec.rootSelector, canonicalPath: target.pathname, minimumText });
}

async function capture(page, spec, readiness) {
  const filename = `${spec.id}-${routeSlug(spec.route)}.webp`;
  const firstPath = path.join(FIRST, filename);
  const fullPath = path.join(FULL, filename);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: firstPath, type: 'webp', quality: QUALITY, fullPage: false, animations: 'disabled' });
  const size = await page.evaluate(() => ({
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
  const clip = { x: 0, y: 0, width: Math.min(size.width, 16_000), height: Math.min(size.height, 32_000) };
  await page.screenshot({ path: fullPath, type: 'webp', quality: QUALITY, clip, captureBeyondViewport: true, animations: 'disabled' });
  const capturedAt = new Date().toISOString();
  const common = {
    pageId: spec.id,
    route: spec.route,
    finalUrl: readiness.finalUrl,
    viewport: VIEWPORT,
    colorScheme: 'dark',
    sourceSha: SOURCE_SHA,
    captureTime: capturedAt,
    readinessCheck: {
      rootSelector: spec.rootSelector,
      minimumVisibleTextCharacters: readiness.minimumText,
      minimumMeaningfulSurfaces: 2,
      fontsReady: true,
      stableSamples: readiness.stableSamples,
      fixtureReady: readiness.fixtureReady,
    },
    validity: {
      valid: readiness.pathMatches && readiness.rootVisible && readiness.rootTextCharacters >= readiness.minimumText,
      reasons: [],
    },
    reviewerNote: 'Pending individual human visual review; this record cannot support a score until the note is replaced.',
  };
  return [
    {
      ...common,
      kind: 'first-viewport',
      path: path.relative(OUTPUT, firstPath).split(path.sep).join('/'),
      pixelSize: VIEWPORT,
      byteSize: (await stat(firstPath)).size,
      sha256: await hash(firstPath),
    },
    {
      ...common,
      kind: 'full-page',
      path: path.relative(OUTPUT, fullPath).split(path.sep).join('/'),
      pixelSize: { width: clip.width, height: clip.height },
      byteSize: (await stat(fullPath)).size,
      sha256: await hash(fullPath),
    },
  ];
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
      const file = path.join(OUTPUT, record.path);
      try {
        if ((await stat(file)).size < 2_000) errors.push(`${kind}: ${record.pageId} file too small`);
      } catch (error) {
        errors.push(`${kind}: ${record.pageId} missing (${error.message})`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    firstViewportCount: images.filter(({ kind }) => kind === 'first-viewport').length,
    fullPageCount: images.filter(({ kind }) => kind === 'full-page').length,
  };
}

await mkdir(FIRST, { recursive: true });
await mkdir(FULL, { recursive: true });
const pages = await catalog();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'dark', reducedMotion: 'reduce', deviceScaleFactor: 1 });
const page = await context.newPage();
const images = [];
const failures = [];
for (const spec of pages) {
  try {
    const readiness = await waitReady(page, spec);
    images.push(...await capture(page, spec, readiness));
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
  sourceSha: SOURCE_SHA,
  baseUrl: BASE_URL,
  viewport: VIEWPORT,
  colorScheme: 'dark',
  imageFormat: 'webp',
  imageQuality: QUALITY,
  pages: pages.map(({ rootSelector, ...spec }) => ({ ...spec, rootSelector })),
  images,
  failures,
  validation,
};
await writeFile(path.join(OUTPUT, 'screenshots/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(OUTPUT, 'screenshots/capture-validation.json'), `${JSON.stringify({ sourceSha: SOURCE_SHA, generatedAt: new Date().toISOString(), failures, validation }, null, 2)}\n`);
if (!validation.valid || failures.length) {
  console.error(JSON.stringify({ failures, validation }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Captured ${validation.firstViewportCount} first-viewport and ${validation.fullPageCount} full-page images.`);
}
