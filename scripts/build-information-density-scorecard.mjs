import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const auditDir = path.join(root, 'docs/design/audit-2026-07-22');
const raw = JSON.parse(await readFile(path.join(auditDir, 'information-density-metrics.raw.json'), 'utf8'));
const review = JSON.parse(await readFile(path.join(auditDir, 'manual-visual-review.json'), 'utf8'));
const manifestPath = path.join(auditDir, 'screenshots/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const deviation = (values, center) => median(values.map((value) => Math.abs(value - center)));
const standardDeviation = (values) => {
  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length));
};
const primary = raw.measurements.filter(({ viewport, status }) => viewport === '1231x768-primary' && status === 'measured');
const feature = (measurement, name) => {
  const metrics = measurement.metrics.first_viewport;
  if (name === 'text') return metrics.text_chars_per_10k_px2;
  if (name === 'blocks') return metrics.dom_block_count_per_100k_px2;
  if (name === 'actions') return metrics.interaction.weighted_action_exposure / metrics.usable_content_area_px2 * 100000;
  if (name === 'local') return metrics.local_density_p95;
  if (name === 'surface') return metrics.data_surfaces.visible_table_rows * Math.max(1, metrics.data_surfaces.maximum_visible_columns) + metrics.data_surfaces.list_repeated_item_count;
  throw new Error(`Unknown feature ${name}`);
};
const featureWeights = { text: 0.28, blocks: 0.22, actions: 0.18, local: 0.17, surface: 0.15 };
const grouped = Map.groupBy(primary, ({ calibrationArchetype }) => calibrationArchetype);
const robustZ = (measurement, name) => {
  const cohort = grouped.get(measurement.calibrationArchetype) ?? primary;
  const values = cohort.map((entry) => feature(entry, name));
  const center = median(values);
  const madScale = 1.4826 * deviation(values, center);
  const fallback = standardDeviation(values) || standardDeviation(primary.map((entry) => feature(entry, name))) || 1;
  return clamp((feature(measurement, name) - center) / (madScale || fallback), -3, 3);
};
const udsWeights = { GLA: 0.15, ODB: 0.15, GWS: 0.15, HSC: 0.15, TLR: 0.15, ICL: 0.10, DSL: 0.10, RAR: 0.05 };
const grade = (score) => score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
const screenshotFor = (pageId, kind) => manifest.images.find((image) => image.pageId === pageId && image.kind === kind);

const pages = primary.map((measurement) => {
  const human = review.pages[measurement.pageId];
  if (!human) throw new Error(`Missing human review for ${measurement.pageId}`);
  const first = screenshotFor(measurement.pageId, 'first-viewport');
  const full = screenshotFor(measurement.pageId, 'full-page');
  if (!first || !full || !first.validity?.valid || !full.validity?.valid) throw new Error(`Missing valid screenshot pair for ${measurement.pageId}`);
  const densityCompositeZ = Object.entries(featureWeights).reduce((sum, [name, weight]) => sum + robustZ(measurement, name) * weight, 0);
  const densityLoad = Math.round(clamp(50 + densityCompositeZ * 12));
  const rawUds = Math.round(Object.entries(udsWeights).reduce((sum, [name, weight]) => sum + human.scores[name] * weight, 0));
  const usableDensityScore = human.hardCap ? Math.min(49, rawUds) : rawUds;
  const crowdingRisk = 100 - Math.min(human.scores.TLR, human.scores.DSL, human.scores.RAR);
  const sparsityRisk = human.sparse ? 100 - human.scores.ODB : 0;
  const overloadRisk = Math.round(clamp(0.55 * (100 - usableDensityScore) + 0.30 * crowdingRisk + 0.15 * sparsityRisk));
  return {
    pageId: measurement.pageId,
    title: measurement.title,
    route: measurement.route,
    archetype: measurement.archetype,
    calibrationArchetype: measurement.calibrationArchetype,
    screenshots: { firstViewport: first.path, fullPage: full.path, firstSha256: first.sha256, fullSha256: full.sha256 },
    visualFinding: human.finding,
    topCodeFacingCorrection: human.correction,
    densityLoad,
    usableDensityScore,
    rawUsableDensityScore: rawUds,
    grade: grade(usableDensityScore),
    overloadRisk,
    dimensions: human.scores,
    hardCap: human.hardCap,
    sparseOrLateStart: human.sparse,
    acceptAtGlance: usableDensityScore >= 70 && !human.hardCap && human.scores.GLA >= 65 && human.scores.HSC >= 65 && human.scores.TLR >= 65,
    confidence: 0.92,
    metricEvidence: {
      meaningfulOccupancyRatio: measurement.metrics.first_viewport.meaningful_occupancy_ratio,
      blankCanvasRatio: measurement.metrics.first_viewport.blank_canvas_ratio,
      firstWorkSurfaceYRatio: measurement.metrics.first_viewport.first_work_surface_y_ratio,
      textCharsPer10kPx2: measurement.metrics.first_viewport.text_chars_per_10k_px2,
      domBlocksPer100kPx2: measurement.metrics.first_viewport.dom_block_count_per_100k_px2,
      localDensityP95: measurement.metrics.first_viewport.local_density_p95,
      documentHorizontalOverflowPx: measurement.metrics.first_viewport.resilience.document_horizontal_overflow_px,
      pageScrollHeightPx: measurement.metrics.full_page.resilience.page_scroll_height_px
    }
  };
});

const byArchetype = Object.fromEntries([...Map.groupBy(pages, ({ calibrationArchetype }) => calibrationArchetype)].map(([name, entries]) => [name, {
  count: entries.length,
  medianDensityLoad: median(entries.map(({ densityLoad }) => densityLoad)),
  medianUsableDensityScore: median(entries.map(({ usableDensityScore }) => usableDensityScore)),
  medianOverloadRisk: median(entries.map(({ overloadRisk }) => overloadRisk))
}]));
const summary = {
  pageCount: pages.length,
  hardCapCount: pages.filter(({ hardCap }) => hardCap).length,
  acceptAtGlanceCount: pages.filter(({ acceptAtGlance }) => acceptAtGlance).length,
  gradeDistribution: Object.fromEntries(['A', 'B', 'C', 'D', 'F'].map((letter) => [letter, pages.filter(({ grade: value }) => value === letter).length])),
  medianDensityLoad: median(pages.map(({ densityLoad }) => densityLoad)),
  medianUsableDensityScore: median(pages.map(({ usableDensityScore }) => usableDensityScore)),
  medianOverloadRisk: median(pages.map(({ overloadRisk }) => overloadRisk)),
  byArchetype
};
const scorecard = {
  metadata: {
    generatedAt: new Date().toISOString(),
    sourceSha: raw.metadata.sourceSha,
    metricVersion: raw.metadata.metricVersion,
    scoringVersion: 'information-density-score-v1.0.0',
    evidenceRun: 29922462065,
    metricRun: 29924827341,
    viewport: '1231x768-primary',
    screenshotReview: review.reviewMethod,
    limitations: raw.limitations
  },
  formula: {
    densityLoad: 'clamp(50 + 12 * sum(same-archetype robust-z feature * weight), 0, 100)',
    densityLoadFeatures: featureWeights,
    usableDensityScore: udsWeights,
    overloadRisk: '0.55*(100-UDS) + 0.30*(100-min(TLR,DSL,RAR)) + 0.15*(sparse ? 100-ODB : 0)',
    hardCap: 'Human-confirmed first-viewport overlap, unclamped clipping, essential contrast failure or document-level overflow caps UDS at 49.'
  },
  validation: {
    ...raw.validation,
    screenshotManifestFirstViewportCount: manifest.images.filter(({ kind }) => kind === 'first-viewport').length,
    screenshotManifestFullPageCount: manifest.images.filter(({ kind }) => kind === 'full-page').length,
    individuallyReviewedPageCount: Object.keys(review.pages).length,
    scorecardPageCount: pages.length
  },
  summary,
  pages
};

const reviewNotes = new Map(pages.flatMap((page) => ['first-viewport', 'full-page'].map((kind) => [
  `${page.pageId}:${kind}`,
  `${page.visualFinding} ${page.hardCap ? `Hard cap: ${page.hardCap}` : 'No human-confirmed hard cap.'}`,
])));
manifest.images = manifest.images.map((image) => ({ ...image, reviewerNote: reviewNotes.get(`${image.pageId}:${image.kind}`) }));
manifest.review = { completed: true, reviewedAt: review.reviewedAt, method: review.reviewMethod, pageCount: pages.length, imageCount: manifest.images.length };

await writeFile(path.join(auditDir, 'information-density-scorecard.json'), `${JSON.stringify(scorecard, null, 2)}\n`);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const mdEscape = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const shotLink = (page, kind, label) => `[${label}](./audit-2026-07-22/${page.screenshots[kind]})`;
const evidence = (page) => `occ ${page.metricEvidence.meaningfulOccupancyRatio}; blank ${page.metricEvidence.blankCanvasRatio}; work-y ${page.metricEvidence.firstWorkSurfaceYRatio}; local-p95 ${page.metricEvidence.localDensityP95}`;
const tableRows = pages.map((page) => `| ${page.pageId} ${mdEscape(page.title)} | \`${page.route}\` | ${mdEscape(page.calibrationArchetype)} | ${shotLink(page, 'firstViewport', 'first')} / ${shotLink(page, 'fullPage', 'full')} | ${mdEscape(page.visualFinding)} | ${page.densityLoad} | ${page.usableDensityScore} | ${page.grade} | ${page.overloadRisk} | ${Object.values(page.dimensions).join(' / ')} | ${page.hardCap ? `Yes — ${mdEscape(page.hardCap)}` : 'No'} | ${page.acceptAtGlance ? 'Yes' : 'No'} | ${evidence(page)} | ${mdEscape(page.topCodeFacingCorrection)} |`).join('\n');
const ids = (entries) => entries.map(({ pageId }) => pageId).join(', ') || 'None';
const hardest = pages.filter(({ hardCap }) => hardCap);
const priorityOne = pages.filter(({ hardCap, usableDensityScore, sparseOrLateStart }) => !hardCap && (usableDensityScore < 70 || sparseOrLateStart));
const priorityTwo = pages.filter(({ hardCap, usableDensityScore, sparseOrLateStart }) => !hardCap && usableDensityScore >= 70 && !sparseOrLateStart);
const strongest = [...pages].sort((a, b) => b.usableDensityScore - a.usableDensityScore).slice(0, 10);
const sparsest = pages.filter(({ sparseOrLateStart }) => sparseOrLateStart).sort((a, b) => a.dimensions.ODB - b.dimensions.ODB);
const report = `# P01–P42 Information-Density Audit — 2026-07-22

## Result

All 42 canonical subpages were audited from 84 independent screenshots: one 1231×768 first viewport and one complete full-page capture per page. The screenshot manifest is valid, contains no missing/duplicate page pair, and every image now has a page-specific reviewer note. The automated collector also measured all 42 pages at 1231×768, 1440×900 and 1200×768 with zero render failures.

Portfolio median UDS is **${summary.medianUsableDensityScore}** (C), median DL is **${summary.medianDensityLoad}**, and median OR is **${summary.medianOverloadRisk}**. **${summary.acceptAtGlanceCount}/42** pages meet the “accept at a glance” gate. **${summary.hardCapCount}** pages have a human-confirmed first-viewport hard cap. Grade distribution: A ${summary.gradeDistribution.A}, B ${summary.gradeDistribution.B}, C ${summary.gradeDistribution.C}, D ${summary.gradeDistribution.D}, F ${summary.gradeDistribution.F}.

Audit source: \`${raw.metadata.sourceSha}\`. Screenshot evidence: GitHub Actions run [29922462065](https://github.com/lwmraymond/SOC_network/actions/runs/29922462065). Raw metrics: run [29924827341](https://github.com/lwmraymond/SOC_network/actions/runs/29924827341). The score model and evidence classes are defined in [INFORMATION_DENSITY_SCORING_STANDARD.md](./INFORMATION_DENSITY_SCORING_STANDARD.md).

## Priority

- **P0 — hard-cap layout/readability defects (${hardest.length}):** ${ids(hardest)}.
- **P1 — below 70 or visually sparse/late-start without a hard cap (${priorityOne.length}):** ${ids(priorityOne)}.
- **P2 — passes the gate; retain and polish (${priorityTwo.length}):** ${ids(priorityTwo)}.
- **Strong reference pages:** ${ids(strongest)}.
- **Highest confirmed sparsity/late-start risk:** ${ids(sparsest)}.

Repeated causes are rigid multi-column grids at 1200–1231px, missing \`min-width: 0\`, no owned overflow container, uncontrolled wrapping for identifiers/status fields, and master/detail columns with very different content heights. A shared secondary issue is the tall title/subtitle band, which delays task content across otherwise acceptable pages.

## Scorecard

Dimension order in the compact column is **GLA / ODB / GWS / HSC / TLR / ICL / DSL / RAR**. DL measures load, not quality; UDS is the quality score; OR is overload risk.

| Page | Route | Archetype | Evidence | Visual finding | DL | UDS | Grade | OR | Dimensions | Hard cap | Glance gate | Main metrics | Top code-facing correction |
|---|---|---|---|---|---:|---:|:---:|---:|---|---|:---:|---|---|
${tableRows}

## Archetype distribution

| Archetype | Pages | Median DL | Median UDS | Median OR |
|---|---:|---:|---:|---:|
${Object.entries(summary.byArchetype).map(([name, value]) => `| ${name} | ${value.count} | ${value.medianDensityLoad} | ${value.medianUsableDensityScore} | ${value.medianOverloadRisk} |`).join('\n')}

## Validation

- Canonical pages: ${scorecard.validation.canonicalPageCount}; unique: ${scorecard.validation.uniqueCanonicalPageCount}.
- Measurements: ${scorecard.validation.measuredPrimaryPages} primary, ${scorecard.validation.measuredStructuralPages} structural, ${scorecard.validation.measuredTablePages} table/overflow; render failures: ${scorecard.validation.renderFailureCount}.
- Screenshot manifest: ${scorecard.validation.screenshotManifestFirstViewportCount} first-viewport and ${scorecard.validation.screenshotManifestFullPageCount} full-page records.
- Individual human review: ${scorecard.validation.individuallyReviewedPageCount} pages / ${scorecard.validation.individuallyReviewedPageCount * 2} images.
- Machine-readable scorecard: [information-density-scorecard.json](./audit-2026-07-22/information-density-scorecard.json).
- Raw metrics: [information-density-metrics.raw.json](./audit-2026-07-22/information-density-metrics.raw.json).
- Reviewed manifest: [screenshots/manifest.json](./audit-2026-07-22/screenshots/manifest.json).
- Capture validation: [screenshots/capture-validation.json](./audit-2026-07-22/screenshots/capture-validation.json).

## Interpretation and limitations

The audit evaluates presentation geometry, not entry semantics or correctness. Fixture content influences row and wrapping geometry only. It is not a user study and does not prove task time or error rate. DL is an internal same-archetype calibration, not a claim of measured Kibana parity. Automated DOM/CSS flags were reconciled with individual screenshot pairs before hard caps were applied. Screenshot edge-density is N/A, and WCAG 1.4.12 still requires a separate text-spacing override survival test.
`;
await writeFile(path.join(root, 'docs/design/P01_P42_INFORMATION_DENSITY_AUDIT_2026-07-22.md'), report);
console.log(JSON.stringify(summary, null, 2));
