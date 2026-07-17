# SOC / ITSM Discovery Baseline

Date: 2026-07-18
Status: `G0 DISCOVERY COMPLETE / IMPLEMENTATION-GATED`

## Verified repository baseline

- `[VERIFIED]` Repository: `lwmraymond/SOC_network`, default branch `main`, private, push access available.
- `[VERIFIED]` At discovery start the repository contained only `README.md` and `test.md`.
- `[VERIFIED]` No React application entry, router, sidebar, top bar, global search, API client, schema, generated types, permission model, telemetry, audit/receipt service, or test harness existed.
- `[VERIFIED]` Therefore there is no existing product shell to preserve. The initial shell introduced by this project is a reversible `[DESIGN]` baseline, not a production fact.

## Input package verification

- `[VERIFIED]` Main execution source: `soctask.md`.
- `[VERIFIED]` Master implementation source: `SOC_ITSM_AGENT_MASTER_TASK.md`.
- `[VERIFIED]` Design package contains 42 page specifications, 19 parent-owned workflow specifications, global IA/query/filter/component/EUI/ITSM rules, screenshots, audit evidence, registers, and validation artifacts.
- `[VERIFIED]` The package state is `SEMANTIC DESIGN COMPLETE / IMPLEMENTATION-GATED`; it is not evidence of production API, schema, permission, or visual acceptance.

## Current capability inventory

| Capability | Status | Evidence / disposition |
|---|---|---|
| React entry and build | Missing | Foundation must create it |
| Router and canonical URLs | Missing | Foundation must create it |
| Sidebar/top bar/global search | Missing | Foundation must create a proposed shell |
| EUI and design tokens | Missing | Add dependencies and token layer |
| Query/filter/saved view | Missing | Implement normalized contracts first |
| Data grid and cursor adapter | Missing | Implement server-ready adapter boundary |
| Overlay/focus/history | Missing | Implement flyout/modal/full-page primitives |
| Route/row/field/action/export policy | Missing | Introduce unified decision interface |
| API/OpenAPI/GraphQL/BFF | `[BLOCKED]` | No backend repository or endpoint supplied |
| Production schema/generated types | `[BLOCKED]` | No schema source supplied |
| Authentication/authorization provider | `[BLOCKED]` | No identity or policy service supplied |
| Audit/action receipt/async job | `[BLOCKED]` | No production service supplied; UI contracts only |
| Unit/integration/E2E/a11y/visual | Missing | Establish Vitest, Testing Library, Playwright and axe |

## 42 pages / 19 workflows mapping

All 42 pages are currently `MISSING` in code. All 19 workflows are currently `MISSING` in code. The canonical proposed route catalog is maintained in `03_ROUTE_AND_IA_CATALOG.md`. Parent-owned workflows will not receive sidebar entries.

## Conflicts and duplication

- `[VERIFIED]` There are no existing routes to conflict with.
- `[DESIGN]` The package route set becomes the provisional canonical route set.
- `[USER-CHOICE]` Final sidebar labels, feature flags, default landing page, tenant branding, and compact/default density remain open.
- `[BLOCKED]` Production object ownership cannot be verified against actual backend schemas.

## G0 / G1 conclusion

G0 can proceed with a proposed IA because the repository is empty. G1 can proceed from the supplied semantic package. G2-G6 remain gated by production API/schema/permission/runtime inputs and stakeholder acceptance.
