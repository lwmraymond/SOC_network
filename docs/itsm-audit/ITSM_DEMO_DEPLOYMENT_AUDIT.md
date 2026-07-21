# ITSM Demo Deployment Audit

Date: 2026-07-21  
Repository: `lwmraymond/SOC_network`  
Branch: `agent/page-differentiation-audit`  
PR: `#4`  
Baseline head: `4442475a828973075e0b34d3b9b0be1c14a442ae`

## Environment and import-graph finding

The active execution filesystem contains the uploaded task/handoff materials but no Git checkout. Browser launch, `npm` dependency resolution, TypeScript compilation, Vite startup, console capture, and D1080 rendering therefore cannot be run here and are recorded as `BROWSER_BLOCKED`, not PASS.

GitHub source review found a branch-level import blocker:

- `src/App.tsx` imports `./catalog/workflowSpecs`, but `src/catalog/workflowSpecs.ts` returns 404.
- `src/App.tsx` lazy-imports H02–H08, but each corresponding source file returns 404.
- The same App also declares later workflow imports; this audit does not expand H09–H14 scope, but the missing registry alone is sufficient to block a clean App import graph.

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
| Source in GitHub | PASS for P13–P22/P34; FAIL for H02–H08 | GitHub file readback |
| Import resolution | BLOCKED | Restore `workflowSpecs` and workflow modules; run strict TypeScript/build |
| Fixture availability | Structural for pages; absent for workflows | Runtime fixture load |
| White screen / console error | BROWSER_BLOCKED | Browser route smoke with unfiltered console/page errors |
| Search / filter | Source-reviewed only | Browser interaction evidence |
| Flyout / Modal | Source-reviewed only | Open/close/focus-return browser evidence |
| Prototype receipt | Source-reviewed only | Browser state assertion |
| loading/empty/error/denied/stale | Shared PageFrame source exists | Route matrix browser validation |
| D1080 overflow | BROWSER_BLOCKED | 1920×1080 capture and document overflow assertion |
| Parent workflow entry / return | FAIL for H02–H08 | Parent navigation plus restorable URL/context |
| Production mutation boundary | Source-reviewed | Browser/network assertion that no production write occurs |

## Deployment conclusion

- `GITHUB_SAVED` page source is not equivalent to `LOCAL_DEPLOYMENT_PASS`.
- Current branch cannot be promoted to `BUILD_VALIDATED` from this audit.
- H02–H08 are not merely visually pending; their source is absent.
- The first executable remediation is to restore the import graph while respecting current progress order (`H01` before H02).
