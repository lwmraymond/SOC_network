# H01 Asset Detail — Scoped Validation

Date: 2026-07-21  
Repository: `lwmraymond/SOC_network`  
Branch: `agent/page-differentiation-audit`

## Scope

This record validates the H01 frontend Demo source only. It does not claim repository-wide build, runtime, browser, accessibility, production integration, or user acceptance.

## GitHub source evidence

| Node | Path | Commit | GitHub blob |
|---|---|---|---|
| Brief | `docs/workflow-briefs/H01.md` | `8053afcfce7e3f90421679dc693c1635a6236011` | `764bf0ea80c81ee88766d7a9dd31e59d823c37e5` |
| Layout | `src/components/page-specific/P12Asset360Workspace.css` | `3a9b56345b0536e690092fb6e5ed5dd00bbf7d19` | `1d1b3206cd3c51f44233280c1c173a1379ae8140` |
| Workflow workspace | `src/components/page-specific/P12Asset360Workspace.tsx` | `2fc64021a2917bb81ad6aa813e58490ce8077237` | `013db8ef623b05443993d95db43d2de448591c96` |
| Parent entry | `src/components/page-specific/p08/P08AssetInventoryWorkspace.tsx` | `308339892a973ee77a2c742788c8991b785468c4` | `b547663d453d7fe1dbe3fc15cd30375e9afee7d4` |
| Workflow registry | `src/catalog/workflowSpecs.ts` | `484fd6bc119a0a22cab8f1602b4adeb4abe049b7` | `5ae73d58d718f2abbce44a67aa3961642abe2e7a` |

The four executable-source files were reconstructed locally from the exact submitted UTF-8 content. Git blob SHA-1 values matched the GitHub file readback values byte-for-byte.

## Scoped source checks

| Check | Result | Evidence |
|---|---|---|
| TypeScript/TSX parser and transpile syntax | `PASS` | P12: 0 diagnostics; P08: 0; workflow catalog: 0 |
| Possible unused imported identifiers | `PASS` | P12: 35 imports / 0 possible unused; P08: 29 / 0; catalog: 0 / 0 |
| CSS brace structure | `PASS` | Balance: 0 |
| Route object identity | `PASS` | `useParams` binds `/devices/assets/:assetId` |
| Restorable URL state | `PASS` | tab, revision, timeline/search/source, relationship and vulnerability state use `useSearchParams` |
| Parent context restoration | `PASS` | P08 supplies its pathname and query in `returnTo`; H01 validates an internal `/devices/` return target |
| Asset / CI / Service separation | `PASS` | Separate identity, configuration authority and service-impact fields and explanatory boundary |
| Progressive evidence detail | `PASS` | Evidence/source-field inspector uses `EuiFlyout` |
| Governed write-like actions | `PASS` | Impact review uses `EuiModal`, required reason and explicit confirmation |
| Receipt semantics | `PASS` | Receipt says queued and authoritative rehydration pending; no production mutation is claimed |
| Focus return | `PASS` | Evidence Flyout and action Modal restore focus to their triggering button |
| Template-risk scan | `PASS` | No `MetricStrip`, `StatusStrip`, `TimelinePanel`, `RelationshipMap`, or generic `WorkflowFrame`; no production completion language |

## Difference review

H01 is distinct from H05 Problem / Known Error Detail across four core dimensions:

1. First viewport: asset identity, provenance, revision and action authority rather than recurrence/RCA/workaround.
2. Primary workspace: telemetry, software, vulnerability, relationship and audit tabs rather than Problem/KEDB/fix lifecycle.
3. Main interaction: inspect source-field evidence and queue a revisioned target action rather than publish a workaround or close a Problem.
4. Object boundary: Asset, ITSM CI and Business Service authority separation rather than permanent-fix and accepted-risk evidence.

Distinct status: `PASS`.  
User visual review: `PENDING`.

## Blocked validation

| Validation | Status | Reproducible reason |
|---|---|---|
| Actual repository strict TypeScript with installed EUI types | `BLOCKED` | Active execution filesystem has no repository checkout or project dependencies; parser/transpile check is not substituted for `npm run typecheck` |
| Full lint / unit / build | `BLOCKED` | In addition to unavailable checkout/dependencies, current `src/App.tsx` still imports absent H02–H14 modules; H01 did not create or modify later workflows |
| Browser route / console / responsive / focus test | `BROWSER_BLOCKED` | No runnable local application or browser server is available in this execution mode |
| Visual user acceptance | `PENDING` | No screenshot or user viewing evidence exists |
| Production integration | `DEFERRED` | Asset, CMDB, Case, Incident, Change, response, permission and audit services remain outside this frontend Demo scope |

## Validation result

`SCOPED_SOURCE_VALIDATION_PASS`

This is sufficient for GitHub source save and progress advancement under the existing workflow protocol, but not for `LOCAL_DEPLOYMENT_PASS` or `BUILD_VALIDATED`.
