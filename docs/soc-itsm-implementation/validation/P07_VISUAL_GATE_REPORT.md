# P07 Visual Gate Report

Date: 2026-07-18

Status: `TECHNICAL VISUAL GATE PASS / REVIEWER ACCEPTANCE REQUIRED BEFORE P05`

## Gate result

- The page is a dedicated query workbench, not a shared renderer with a replaced title.
- D1080 prioritizes query, explicit time semantics, scope trust, histogram fallback, exact event grid and cursor navigation.
- Query, filters, grid, detail flyout and export share the same normalized envelope and permission boundary.
- Detail flyout exposes identity, event/ingest time, source, masking and narrative rather than a placeholder.
- Export uses a background job, queued receipt, audit metadata and pending authoritative rehydration semantics.
- Prototype fixtures remain development-only and production has no fixture fallback.
- Runtime icon failures, empty-root failure, duplicate landmarks and transient animation-state axe failures are covered by regression tests.

## Visual evidence

GitHub Actions run `29630430056` generated 12 exact-viewport PNGs:

### D1080 — 1920×1080

- Ready
- Filter Builder
- Event Detail Flyout
- Export Modal
- Receipt
- Error
- Denied
- Stale

### D2K — 2560×1440

- Ready
- Event Detail Flyout / high-density grid

### D4K — 3840×2160

- Ready
- Wide max-width verification

Artifact:

```text
ID: 8425293385
Digest: sha256:af2cf9d93fc2afb9dc62e583c7aeeb29635faa649433a204c0608c2e8286faba
Expires: 2026-10-16
```

The reproducible filenames and per-file SHA-256 values are recorded in `P07_SCREENSHOT_MANIFEST.md`.

## Review findings

- D1080 answers the core hunt question: what query/scope ran, how trustworthy/fresh the result is, and which exact events require inspection.
- No decorative pie chart or generic KPI wall was introduced. The four values describe result volume, coverage, freshness and timezone.
- The grid exposes 12 rows at D1080 with clear event identity and masked-field behavior.
- Query → Filter → Grid → Flyout → Export/Receipt is visually continuous.
- D4K uses EUI `restrictWidth={1800}`; typography is not scaled up and the workbench remains centered.
- Root horizontal overflow assertions pass at all three target viewports.

## Known prototype limitations

- `[BLOCKED]` Production APIs, permissions and authoritative persistence are not connected.
- `[DISCOVER]` Saved View UI still requires production repository integration before production acceptance.
- `[DESIGN]` The compact histogram table caption is functionally accessible but should receive a visual polish pass.
- `[USER-CHOICE]` Reviewer acceptance of typography, density and composition is still required before P05 begins.

P05 is not implemented by this change.
