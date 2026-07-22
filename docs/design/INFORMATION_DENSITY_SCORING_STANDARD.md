# Webpage Information-Density Scoring Standard

Version 1.0 — 2026-07-22

## Purpose and scope

This standard measures page-owned information density, not the correctness, realism or quantity of fixture entries. It covers each page header, context strip, filter/command bar, work surface, table, form, inspector and page-owned control. The fixed global app header and primary sidebar are excluded from page-specific geometric scores.

The target is useful, structured density comparable to Kibana and mature security operations products: enough task signal above the fold, without local crowding, hierarchy competition, unreadable wrapping or non-informative blank canvas. Less content is not automatically better.

Primary condition: Chromium, dark mode, 1231×768 CSS pixels. Structural checks repeat at 1440×900 and table/overflow checks at 1200×768. The first viewport and complete scrollable page are reviewed separately.

## Evidence classes

- **Normative** — a WCAG success criterion or explicit component contract.
- **Evidence-informed** — an audit operation grounded in human-factors or visual-complexity research, with locally defined scoring boundaries.
- **Calibration heuristic** — a project threshold calibrated against EUI/Kibana patterns and same-archetype pages. It is not presented as a universal scientific limit.

## Research basis

- Tullis' display-formatting review motivates separate measurement of overall density, local density, grouping and layout complexity ([DOI 10.1177/001872088302500604](https://doi.org/10.1177/001872088302500604)).
- Rosenholtz, Li and Nakano show that feature congestion, edge density and subband entropy can model visual clutter and search difficulty ([DOI 10.1167/7.2.17](https://doi.org/10.1167/7.2.17)). This audit records DOM/CSS proxies when reproducible and labels screenshot edge density `N/A` when it is not.
- Harper, Jay, Michailidou and Quan support document-structure measures as proxies for perceived webpage complexity ([DOI 10.1080/0144929X.2012.726647](https://doi.org/10.1080/0144929X.2012.726647)).
- Michailidou, Harper and Bechhofer connect links, words, images, sections, organisation and clearness to perceived visual complexity ([DOI 10.1145/1456536.1456581](https://doi.org/10.1145/1456536.1456581)).
- Lindgaard et al. establish that users form visual impressions extremely quickly, supporting a separate first-glance measure ([DOI 10.1080/01449290500330448](https://doi.org/10.1080/01449290500330448)).
- Cowan supports restrained, meaningful chunking but does not prescribe a literal UI component limit ([DOI 10.1017/S0140525X01003922](https://doi.org/10.1017/S0140525X01003922)).
- Hick and Hyman support measuring choice uncertainty and response time; they do not prescribe a fixed button count ([Hick DOI](https://doi.org/10.1080/17470215208416600), [Hyman DOI](https://doi.org/10.1037/h0056940)).
- Sweller supports reducing extraneous processing load; the paper is not used to invent pixel thresholds ([DOI 10.1207/s15516709cog1202_4](https://doi.org/10.1207/s15516709cog1202_4)).
- Lavie and Tractinsky's classical aesthetics dimension supports orderly, clear presentation ([DOI 10.1016/j.ijhcs.2003.09.002](https://doi.org/10.1016/j.ijhcs.2003.09.002)).
- Normative accessibility checks come from [WCAG 2.2](https://www.w3.org/TR/WCAG22/), especially 1.4.10 Reflow, 1.4.12 Text Spacing and 2.5.8 Target Size (Minimum).
- Component calibration follows official [EUI Page Template](https://eui.elastic.co/docs/components/templates/page-template/), [EUI Page Header](https://eui.elastic.co/docs/components/layout/page-header/), typography and table patterns. Product comparators are the official Elastic Security, Splunk Enterprise Security and Microsoft Defender XDR queue/dashboard documentation; these are pattern references, not research evidence.

## Outputs

Every page reports:

- **Density Load (DL), 0–100:** higher is denser, not inherently worse.
- **Usable Density Score (UDS), 0–100:** higher is easier to accept and act on.
- **Overload Risk (OR), 0–100:** higher is worse; it includes crowding and excessive sparsity/late-start risk.

### UDS dimensions

`UDSraw = 0.15·GLA + 0.15·ODB + 0.15·GWS + 0.15·HSC + 0.15·TLR + 0.10·ICL + 0.10·DSL + 0.05·RAR`

| Code | Weight | Human-confirmed meaning |
|---|---:|---|
| GLA | 15% | First-glance clarity and task prioritisation |
| ODB | 15% | Overall/local density balance, including sparse/dense discontinuities |
| GWS | 15% | Grouping, whitespace and spatial rhythm |
| HSC | 15% | Hierarchy, scan path and salience competition |
| TLR | 15% | Typography, line/paragraph readability and text resilience |
| ICL | 10% | Interaction and choice load above the fold |
| DSL | 10% | Data-surface geometry and legibility, excluding entry semantics |
| RAR | 5% | Responsive and accessibility resilience |

Grades: A 85–100, B 70–84, C 55–69, D 40–54, F below 40. “Accept at a glance” requires UDS ≥70, no hard cap, and GLA/HSC/TLR ≥65.

### Hard caps

Human-confirmed first-viewport text overlap, unclamped clipping, destructive document-level horizontal overflow, or essential normal-text contrast failure caps UDS at 49. Two unresolved first-viewport P1 readability/layout failures cap UDS at 69. A blank/fatal/runtime-error page is `N/A`, not a high-scoring sparse page. Owned horizontal scrolling for a genuine table or workbench is allowed.

### Density Load

For each page, the collector calculates five first-viewport features and compares them with the same page archetype using a robust z score:

`z = clamp((x − median) / (1.4826 · MAD), −3, 3)`

If cohort MAD is zero, the cohort standard deviation, then the portfolio standard deviation, is used and disclosed by the reproducible script.

`DL = clamp(50 + 12·(0.28·ztext + 0.22·zblocks + 0.18·zactions + 0.17·zlocal + 0.15·zsurface), 0, 100)`

The features are visible text characters per 10k px², DOM blocks per 100k px², weighted actions per 100k px², local-density p95, and data-surface load. This is internal relative calibration, not a claim of Kibana parity.

### Overload Risk

`OR = 0.55·(100−UDS) + 0.30·(100−min(TLR, DSL, RAR)) + 0.15·sparsityRisk`

`sparsityRisk = 100−ODB` only when the screenshot review confirms excessive blank canvas or delayed work content; otherwise it is zero.

## Metric contract

The collector records page-owned visible geometry clipped to the usable rectangle: work-surface start, meaningful occupancy, blank ratio, text and block density, visual regions, panel depth, local-density windows, gaps, alignment entropy, heading hierarchy, typography, controls, table/list geometry, target size and horizontal overflow. Direct text nodes use `Range.getClientRects()`; computed contrast composites ancestor backgrounds.

Automated overlap/clipping and contrast counts are evidence flags, not self-executing hard caps. Every cap requires inspection of that page's screenshot pair because hidden, nested or intentionally overflow-owned elements can produce false positives.

## EUI/project calibration layer

These are calibration heuristics unless WCAG is named:

- h1 24/32, h2 16/24, h3 14/20, body 13/20, supporting 12/16, metadata 11/16.
- Body line-height target 1.5, audit floor 1.35; WCAG 1.4.12 instead tests survival under user spacing overrides.
- Paragraph target ≤72 characters per line; caution above 80.
- Standard table row ≥40px; intentionally dense queue row ≥36px.
- Panel padding normally 16px or compact 12px; control gap ≥8px; control height ≥32px.
- Page header 80–104px with ≤24px trailing blank space.
- Usually one dominant task and one filled primary action above the fold.
- Approximately 3–5 top-level perceptual groups is preferred; 6–7 is caution; more than 7 needs strong grouping. More than three simultaneous high-salience regions is a competition warning. These values are engineering calibration, not literal Cowan/Hick limits.

## Screenshot gate

No page is scored until both its 1231×768 first-viewport and full-page captures are valid and individually reviewed. Validity requires the canonical route, visible page root, ready fonts, stable geometry, meaningful content and absence of loading/error states. The manifest records route, final URL, viewport, source SHA, time, readiness, hash, validity and reviewer note. Contact sheets are index aids only.

## Reproduction and limitations

Run `node scripts/build-information-density-scorecard.mjs` after placing the raw collector JSON, reviewed screenshot manifest and manual review JSON in `docs/design/audit-2026-07-22/`.

The audit uses prototype fixtures only for geometry, is not a user study, does not evaluate entry semantics, and cannot prove user performance. Screenshot/DOM proxies support—not replace—human judgement. Screenshot edge density is `N/A`; WCAG text-spacing survival needs a separate override test.
