# SOC / ITSM Interactive Design Prototype

React + Elastic UI implementation workspace for the SOC / SIEM / XDR / ITSM redesign.

## Current gate

`P07 REVIEW ACCEPTED / 42 PRIMARY PAGES + 19 PARENT-OWNED WORKFLOWS IMPLEMENTED AS VISUAL PROTOTYPES / PRODUCTION CONTRACTS BLOCKED`

The repository now contains independently composed prototypes for P01–P42 and H01–H19. The work is suitable for visual, interaction, accessibility and frontend-contract review. It does **not** claim production API/schema/permission acceptance or production mutation readiness.

## Runtime prerequisites

Use Node `22.16.0` from `.nvmrc`, or another version accepted by:

```text
^20.19.0 || >=22.12.0
```

Direct toolchain versions are pinned. `package-lock.json` freezes transitive dependency resolution for CI and developer machines.

## Install

```bash
npm ci
```

## Run the interactive prototype

Fixture mode must be enabled explicitly. Open any canonical route, for example `/dashboard/soc`, `/analyzer/alerts`, `/analyzer/search`, `/itsm/incidents`, `/runtime/script-workbench`, or `/settings/authentication`.

### macOS / Linux / Git Bash

```bash
VITE_ENABLE_FIXTURES=true npm run dev
```

### Windows PowerShell

```powershell
$env:VITE_ENABLE_FIXTURES='true'
npm run dev
```

### Windows Command Prompt

```cmd
set VITE_ENABLE_FIXTURES=true
npm run dev
```

Default URL:

```text
http://localhost:5173/dashboard/soc
```

Without `VITE_ENABLE_FIXTURES=true`, production routes intentionally show adapter-unavailable states. They do not fall back to local fixture arrays.

## Validation

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e:smoke
npm run e2e:visual
```

The production build includes a sentinel scan that fails if development fixture content reaches `dist`.

### Local system Chromium

Playwright can use a preinstalled Chromium binary without downloading a browser:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run e2e:gate
```

A managed Chromium `URLBlocklist` may still prevent localhost navigation. Do not modify or bypass the policy; record the browser Gate as `[BLOCKED]` and run it in an approved environment.

## Implemented scope

- 42 canonical primary page routes in the required Sidebar group order.
- 19 parent-owned workflows with no duplicate Sidebar entries.
- Dedicated dashboard, queue, hunt, entity 360, ITSM command workspace, catalog, editor, settings and governance compositions.
- Normalized Query, Filter Builder, Saved View, Cursor, Permission, Action, Export Job, Receipt and Audit contracts.
- P05 Alert Queue and P07 Event Search & Hunt use the same Foundation interfaces without creating duplicate mechanisms.
- Loading, ready, empty, filtered-empty, error, denied, offline, stale, degraded and partial states.
- Prototype action lifecycle with explicit impact, confirmation, queued receipt and pending authoritative rehydration.
- Light/dark theme, keyboard focus, focus restoration, reduced motion, exact-data chart fallbacks and D1080/D2K/D4K tests.

## EUI icon bootstrap

EUI 106 dynamic icon imports are incompatible with Vite dependency pre-bundling for the paths used by this application. `src/euiIcons.ts` explicitly registers every icon used by the shell and current prototypes before React renders. New icons must be added to the registry and covered by browser tests.

## Production boundary

- Fixtures live only under `src/prototype/` and require explicit development enablement.
- Prototype action receipts never represent production acceptance or completion.
- No browser-side array mutation is presented as an authoritative write.
- Production API/BFF, schemas, policy provider, Saved View persistence, export worker, audit store, approval service and authoritative rehydration remain `[BLOCKED]`.
- Candidate fields, permissions, SLA rules and thresholds remain `[DISCOVER]` until verified against production sources.

## Validation execution policy

Compilation and static validation are run locally before source submission. `.github/workflows/ci.yml` is manual-only (`workflow_dispatch`) and is not triggered automatically by branch pushes or pull requests.

## Documentation

- `docs/soc-itsm-implementation/PROTOTYPE_VISUAL_REVIEW.md`
- `docs/soc-itsm-implementation/ALL_PAGES_VISUAL_IMPLEMENTATION_REPORT.md`
- `docs/soc-itsm-implementation/pages/`
- `docs/soc-itsm-implementation/workflows/`
- `docs/soc-itsm-implementation/validation/ALL_PAGES_ROUTE_REPORT.md`
- `docs/soc-itsm-implementation/validation/WORKFLOW_OWNERSHIP_REPORT.md`
- `docs/soc-itsm-implementation/validation/PAGE_INDEPENDENCE_REPORT.md`
- `docs/soc-itsm-implementation/validation/ALL_PAGES_TEST_REPORT.md`
- `docs/soc-itsm-implementation/validation/ALL_PAGES_VISUAL_GATE_REPORT.md`

## Full prototype validation wave

The review branch contains 42 primary routes and 19 parent-owned workflow surfaces. The source is compiled and tested locally before submission. GitHub Actions is secondary verification and runs:

```text
npm ci
lint
TypeScript checks
28 unit/contract tests
production build + fixture-boundary scan
61-route Chromium validation
full-page and overlay axe validation
frozen 145-item screenshot capture
```

The frozen screenshot composition is:

```text
42 primary-page D1080 Ready
19 parent-owned workflow D1080 Ready
42 supplemental D2K/D4K/theme views
42 page-specific state or overlay views
= 145
```

Generated runner evidence is stored under `docs/soc-itsm-implementation/validation/generated/` during CI and uploaded as GitHub Actions artifacts. P07 has user acceptance; all remaining visual surfaces stay reviewer-pending. Production API, schema, permission and write-service blockers remain recorded in `PRODUCTION_INTEGRATION_BLOCKERS.md`.
