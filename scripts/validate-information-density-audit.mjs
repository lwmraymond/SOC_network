import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const auditDir = path.join(root, 'docs/design/audit-2026-07-22');
const [raw, scorecard, manifest, review, report] = await Promise.all([
  readFile(path.join(auditDir, 'information-density-metrics.raw.json'), 'utf8').then(JSON.parse),
  readFile(path.join(auditDir, 'information-density-scorecard.json'), 'utf8').then(JSON.parse),
  readFile(path.join(auditDir, 'screenshots/manifest.json'), 'utf8').then(JSON.parse),
  readFile(path.join(auditDir, 'manual-visual-review.json'), 'utf8').then(JSON.parse),
  readFile(path.join(root, 'docs/design/P01_P42_INFORMATION_DENSITY_AUDIT_2026-07-22.md'), 'utf8'),
]);
const expected = Array.from({ length: 42 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const ids = scorecard.pages.map(({ pageId }) => pageId);
assert(scorecard.pages.length === 42, 'Scorecard must contain 42 pages.');
assert(new Set(ids).size === 42 && expected.every((id) => ids.includes(id)), 'Scorecard page IDs must be exactly P01-P42.');
assert(Object.keys(review.pages).length === 42 && expected.every((id) => review.pages[id]), 'Manual review must contain P01-P42.');
assert(raw.validation.measuredPrimaryPages === 42 && raw.validation.measuredStructuralPages === 42 && raw.validation.measuredTablePages === 42 && raw.validation.renderFailureCount === 0, 'Raw metrics validation failed.');
assert(manifest.images.length === 84, 'Manifest must contain 84 images.');
for (const id of expected) {
  for (const kind of ['first-viewport', 'full-page']) {
    const records = manifest.images.filter((image) => image.pageId === id && image.kind === kind);
    assert(records.length === 1, `${id} ${kind} must have exactly one manifest record.`);
    const record = records[0];
    assert(record.validity?.valid === true, `${id} ${kind} must be valid.`);
    assert(record.reviewerNote && !/pending/i.test(record.reviewerNote), `${id} ${kind} must have a completed reviewer note.`);
    const file = path.join(auditDir, record.path);
    assert((await stat(file)).size === record.byteSize, `${id} ${kind} byte size mismatch.`);
    const hash = createHash('sha256').update(await readFile(file)).digest('hex');
    assert(hash === record.sha256, `${id} ${kind} SHA-256 mismatch.`);
  }
}
for (const page of scorecard.pages) {
  const weights = scorecard.formula.usableDensityScore;
  const rawUds = Math.round(Object.entries(weights).reduce((sum, [name, weight]) => sum + page.dimensions[name] * weight, 0));
  assert(rawUds === page.rawUsableDensityScore, `${page.pageId} raw UDS mismatch.`);
  assert(page.usableDensityScore === (page.hardCap ? Math.min(49, rawUds) : rawUds), `${page.pageId} hard-cap UDS mismatch.`);
  assert(report.includes(`| ${page.pageId} ${page.title} |`) && report.includes(`| ${page.densityLoad} | ${page.usableDensityScore} | ${page.grade} | ${page.overloadRisk} |`), `${page.pageId} report row mismatch.`);
}
console.log('Information-density audit validation passed: 42 pages, 84 reviewed screenshots, 126 measurements, hashes and score/report formulas consistent.');
