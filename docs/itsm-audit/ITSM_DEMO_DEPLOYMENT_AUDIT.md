# ITSM Demo Deployment Audit

Date: 2026-07-21  
Repository: `lwmraymond/SOC_network`  
Branch: `agent/page-differentiation-audit`  
PR: `#4`  
Baseline head: `4442475a828973075e0b34d3b9b0be1c14a442ae`

## Environment and import-graph finding

The active execution filesystem contains the uploaded task/handoff materials but no Git checkout. Browser launch, `npm` dependency resolution, TypeScript compilation, Vite startup, console capture, and D1080 rendering therefore cannot be run here and are recorded as `BROWSER_BLOCKED`, not PASS.

GitHub source review found a branch-level import blocker:

- `src/catalog/workflowSpecs.ts` now exists and registers H01 only.
- H01 reuses the existing P12 `/devices/assets/:assetId` route, so it introduces no duplicate route or page import.
- `src/App.tsx` still lazy-imports H02–H08 and later workflows whose source files return 404. Those absent future modules continue to block a clean full-App import graph.

Consequently, a page module can be source-readable and structurally fixture-backed while the complete branch remains `BUILD_UNVALIDATED / BLOCKED`.

## Deployment matrix

| Surface | Source readable | Import resolves | Existing framework access | Fixture loads | Interaction works | Runtime error | Responsive | EUI aligned | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| P13 ITSM Overview<br>`src/pages/P13ItsmOverview.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural via usePrototypePage/pageFixtures | Source-reviewed | BROWSER_BLOCKED | Unverified | Source-aligned | `BLOCKED` |
| P14 Work Queues<br>`src/pages/P14WorkQueues.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed | BROWSER_BLOCKED | Unverified; local table overflow protection present | Source-aligned | `BLOCKED` |
| P15 Requests & Service Catalog<br>`src/pages/P15RequestsServiceCatalog.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed | BROWSER_BLOCKED | Unverified | Source-aligned | `BLOCKED` |
| P16 Incident Management<br>`src/pages/P16IncidentManagement.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed | BROWSER_BLOCKED | Unverified | Source-aligned | `BLOCKED` |
| P17 Problem Management<br>`src/pages/P17ProblemManagement.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed | BROWSER_BLOCKED | Unverified | Source-aligned | `BLOCKED` |
| P18 Change Management<br>`src/pages/P18ChangeManagement.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed | BROWSER_BLOCKED | Unverified; calendar/queue need D1080 check | Source-aligned | `BLOCKED` |
| P19 Approvals & Tasks<br>`src/pages/P19ApprovalsTasks.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed | BROWSER_BLOCKED | Unverified | Source-aligned | `BLOCKED` |
| P20 ITSM Analytics<br>`src/pages/P20ItsmAnalytics.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed | BROWSER_BLOCKED | Unverified; exact table and chart | Source-aligned | `BLOCKED` |
| P21 Reports & Exports<br>`src/pages/P21ReportsExports.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed | BROWSER_BLOCKED | Unverified | Source-aligned | `BLOCKED` |
| P22 ITSM Settings<br>`src/pages/P22ItsmSettings.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed; controlled Apply-mode Select needs runtime check | BROWSER_BLOCKED | Unverified | REWORK_REQUIRED | `BLOCKED` |
| P34 Playbooks & Automation Templates<br>`src/pages/P34PlaybooksAutomationTemplates.tsx` | Yes | Yes (page module) | Route declared; App graph blocked | Structural | Source-reviewed; generic PB-* only | BROWSER_BLOCKED | Unverified; graph/inspector layout | REWORK_REQUIRED; controlled Capability Select has no change semantics | `REWORK_REQUIRED` |
| H01 Asset Detail / P12 shared route<br>`src/components/page-specific/P12Asset360Workspace.tsx` | Yes | Yes (shared P12 page module) | P08 parent entry + existing `/devices/assets/:assetId` route | Structural via P12 `usePrototypePage` / page fixtures | Source-reviewed; URL state, Flyout, Modal, queued receipt, focus return | BROWSER_BLOCKED | Unverified; responsive CSS exists | Source-aligned EUI panels/tabs/Flyout/Modal | `GITHUB_SAVED / BROWSER_BLOCKED` |
| H02 Work Item Detail<br>`src/workflows/H02WorkItemDetail.tsx` | No (404) | No | Route/import declared but target absent | No | No | Expected import failure | N/A | N/A | `BLOCKED` |
| H03 Create Request<br>`src/workflows/H03CreateRequest.tsx` | No (404) | No | Route/import declared but target absent | No | No | Expected import failure | N/A | N/A | `BLOCKED` |
| H04 Major Incident Command<br>`src/workflows/H04MajorIncidentCommand.tsx` | No (404) | No | Route/import declared but target absent | No | No | Expected import failure | N/A | N/A | `BLOCKED` |
| H05 Problem / Known Error Detail<br>`src/workflows/H05ProblemKnownErrorDetail.tsx` | No (404) | No | Route/import declared but target absent | No | No | Expected import failure | N/A | N/A | `BLOCKED` |
| H06 Change / CAB Detail<br>`src/workflows/H06ChangeCabDetail.tsx` | No (404) | No | Route/import declared but target absent | No | No | Expected import failure | N/A | N/A | `BLOCKED` |
| H07 Approval Detail<br>`src/workflows/H07ApprovalDetail.tsx` | No (404) | No | Route/import declared but target absent | No | No | Expected import failure | N/A | N/A | `BLOCKED` |
| H08 Catalog Item Detail<br>`src/workflows/H08CatalogItemDetail.tsx` | No (404) | No | Route/import declared but target absent | No | No | Expected import failure | N/A | N/A | `BLOCKED` |

## Required deployment checks still outstanding

| Check | Current result | Evidence required to change status |
|---|---|---|
| Source in GitHub | PASS for P13–P22/P34/H01; FAIL for H02–H08 | GitHub file readback |
| Import resolution | PARTIAL / BLOCKED | H01 registry/page resolves structurally; restore H02–H14 modules in order, then run strict TypeScript/build |
| Fixture availability | Structural for pages/H01; absent for H02–H08 | Runtime fixture load |
| White screen / console error | BROWSER_BLOCKED | Browser route smoke with unfiltered console/page errors |
| Search / filter | Source-reviewed only | Browser interaction evidence |
| Flyout / Modal | Source-reviewed only | Open/close/focus-return browser evidence |
| Prototype receipt | Source-reviewed only | Browser state assertion |
| loading/empty/error/denied/stale | Shared PageFrame source exists | Route matrix browser validation |
| D1080 overflow | BROWSER_BLOCKED | 1920×1080 capture and document overflow assertion |
| Parent workflow entry / return | H01 source PASS; H02–H08 FAIL | H01 P08 entry preserves pathname/query in `returnTo`; later parents still require workflow navigation and browser evidence |
| Production mutation boundary | Source-reviewed | Browser/network assertion that no production write occurs |

## Deployment conclusion

- `GITHUB_SAVED` page/workflow source is not equivalent to `LOCAL_DEPLOYMENT_PASS`.
- Current branch cannot be promoted to `BUILD_VALIDATED` from this audit.
- H01 is GitHub-saved source coverage, but remains `BROWSER_BLOCKED` and not `LOCAL_DEPLOYMENT_PASS`.
- H02–H08 are not merely visually pending; their source is absent.
- The next executable remediation is H02 Work Item Detail, followed by later workflows in authoritative order.
