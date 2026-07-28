# SOC Platform — Automation Template Management Change Manifest

## Baseline

- Repository: `lwmraymond/SOC_network`
- Source branch supplied by the user: `agent/itsm-ticket-capability-framework-v2`
- Source commit: `7813a98f9be2205f32680c9c795fd91ada787cc6`
- Input archive: `SOC_network_7813a98_clean.zip`
- Input archive SHA-256: `04dff6d7c8f01918da67cb9b1c394740ee0e0f7b0ab7dbc50d67770131341046`
- Input archive verification: **PASS**; the calculated SHA-256 exactly matched the supplied value.
- UI stack verified from the supplied source: React + TypeScript + Elastic UI `106.0.0`.

This delivery was produced directly from the supplied clean source archive. It did not use GitHub, GitHub Actions, CI workflows, screenshots, image generation, backend services or invented production endpoints.

## Product routes

| Route | Purpose |
| --- | --- |
| `/itsm/automation` | Automation overview, existing rule editor and execution-run list. Defaults to Overview rather than hiding Templates in a simple tab. |
| `/itsm/automation/templates` | First-class searchable and filterable Template Library. |
| `/itsm/automation/templates/:templateId` | Template metadata, typed input/output schemas, workflow graph and node inspector, versions, simulation and template-scoped runs. The active subsection is restorable through `?section=`. |
| `/itsm/automation/runtime` | Execution Engine Settings contract and governed settings preview. |
| `/itsm/automation/runs/:runId` | Run detail, failure classification, audit correlation and ordered step trace. |

Entry points were added from `/itsm/settings`, `/itsm/automation` and P34 `/knowledge/playbooks`. Nested Automation routes retain the existing Automation Administration sidebar selection and do not add duplicate primary-navigation items.

## File-by-file changes

| File | Change |
| --- | --- |
| `CHANGE_MANIFEST.md` | This delivery record, validation boundary and backend blockers. |
| `docs/design/ITSM_AUTOMATION_TEMPLATE_MANAGEMENT.md` | Product scope, route ownership, governed-action model and execution boundary. |
| `docs/design/ITSM_AUTOMATION_TEMPLATE_BACKEND_MAPPING.md` | Explicit optional endpoint map; every unverified operation remains TBD and fail-closed. |
| `src/App.tsx` | Registers Template Library/detail, Runtime Settings and Run Detail routes; preserves the existing Automation parent navigation selection. |
| `src/main.tsx` | Loads the Automation Template EUI stylesheet. |
| `src/pages/itsm/index.ts` | Exports the three new Automation management pages. |
| `src/pages/itsm/ItsmAutomationManagementPage.tsx` | Reworks `/itsm/automation` into Overview / Rule editor / Execution runs and links to dedicated Template and Runtime routes. |
| `src/pages/itsm/ItsmAutomationTemplatesPage.tsx` | Implements Template Library and URL-restorable Template Detail sections. |
| `src/pages/itsm/ItsmAutomationRuntimePage.tsx` | Implements the Execution Engine Settings page. |
| `src/pages/itsm/ItsmAutomationRunDetailPage.tsx` | Implements standalone run detail and step trace. |
| `src/itsm/components/GovernedAction.tsx` | Adds optional disabled state and rehydration completion callback while preserving preview → confirm → receipt → rehydrate. |
| `src/components/page-specific/P22ItsmSettingsWorkspace.tsx` | Adds clear Automation Overview, Template Library and Runtime Settings entry points. |
| `src/components/page-specific/P34PlaybooksAutomationTemplatesWorkspace.tsx` | Adds a secondary link to the ITSM Template Library without replacing or duplicating P34. |
| `src/styles-itsm-automation-templates.css` | EUI-aligned responsive layouts for library actions, schema editor, workflow inspector, simulation, versions, runtime and run details. |
| `src/itsm/automation/contracts.ts` | Defines managed templates, five lifecycle states, typed schemas, six node types, version lifecycle, simulation, runtime settings and managed runs/steps. |
| `src/itsm/automation/adapter.ts` | Adds development-only ephemeral review state, governed lifecycle writes, ETag/version conflicts, simulation, runtime validation, run normalization and production fail-closed composition. |
| `src/itsm/automation/api.ts` | Provides injectable/resettable Automation Template adapter access using the existing ITSM fixture boundary. |
| `src/itsm/automation/httpAdapter.ts` | Adds explicit endpoint injection, auth/header injection, AbortSignal, pagination/filter/sort/include, ETag/If-Match, idempotency and normalized errors. No default production URL is provided. |
| `src/itsm/automation/model.ts` | Adds lifecycle/status presentation, filters and duration formatting. |
| `src/itsm/automation/routes.ts` | Centralizes first-class Automation route and href contracts. |
| `src/itsm/automation/components/TemplateLibrary.tsx` | Search and category/status/owner/dependency/publication/update-time filters; Open, Clone, Create draft and Archive actions. |
| `src/itsm/automation/components/TemplateEditor.tsx` | Draft-only metadata editor for name, description, category, owner, tags and permission/dependency context. |
| `src/itsm/automation/components/SchemaEditor.tsx` | Typed input/output field editor with required/default/validation/secret/reference metadata. |
| `src/itsm/automation/components/WorkflowGraph.tsx` | Ordered EUI Steps graph and node inspector for trigger, condition, action, approval, wait and notification nodes. |
| `src/itsm/automation/components/VersionPanel.tsx` | Draft creation, validation findings, diff, publish, rollback, deprecate and archive governed actions. |
| `src/itsm/automation/components/SimulationPanel.tsx` | JSON sample input and textual/EUI step trace; explicitly states `simulation only / no connector executed`. |
| `src/itsm/automation/components/RuntimeSettings.tsx` | Source/effective/configured values, validation, permission and restart/redeploy/TBD requirement display. |
| `src/itsm/automation/components/RunDetail.tsx` | Template/version, trigger, mode, attempts, duration, failure, audit ID, retry/cancel warnings and step trace. |
| `src/itsm/automation/adapter.test.ts` | Unit contracts for lifecycle states, draft/validation gates, ETag conflict, six nodes, simulation, runtime TBD and production fail-closed behavior. |
| `src/itsm/automation/httpAdapter.test.ts` | Unit contracts for unmapped endpoints, query/header semantics and normalized transport/conflict failures. |
| `src/itsm/automation/model.test.ts` | Filter, status and duration presentation contracts. |
| `src/itsm/automation/routes.test.ts` | Stable first-class URL contracts. |

## Contract and adapter behavior

- Template lifecycle: `draft`, `validating`, `published`, `deprecated`, `archived`.
- Version lifecycle: `draft`, `validating`, `validated`, `published`, `deprecated`, `archived`.
- Schema field types: `string`, `number`, `boolean`, `object`, `array`, `datetime`, `reference`, `secret`.
- Workflow nodes: `trigger`, `condition`, `action`, `approval`, `wait`, `notification`.
- Node inspector includes configuration, capability, timeout, retry/backoff, idempotency, side-effect class, compensation and approval timeout.
- All fixture mutations return non-authoritative queued receipts and rehydrate browser-memory review state with `authoritative:false`.
- Published/deprecated/archived definitions cannot be edited until a draft version is created.
- Publish requires a validated version and preserves validation/dependency findings.
- Simulation returns textual step outcomes and expected receipts with `connectorExecuted:false` and `authoritative:false`.
- Runtime fields with source `TBD` are unavailable and rejected by both preview and execute paths.
- Production adapter operations not backed by an explicitly injected endpoint return classified `unavailable`; no synthetic success is generated.

## Validation — Pro delivery environment

The following results record the constrained environment in which the returned archive was produced. They are retained for provenance; the later local integration validation supersedes them for the current branch.

### Repository-native commands

| Command | Actual result |
| --- | --- |
| `npm ci --no-audit --no-fund` | **BLOCKED** — exit 1. The configured package registry returned HTTP 503 for `zwitch-1.0.5.tgz`; an alternate public-registry attempt earlier also encountered DNS `EAI_AGAIN`. No complete dependency tree was available. |
| `npm run lint` | **BLOCKED** — exit 127 because `eslint` was not installed after the failed `npm ci`. |
| `npm run typecheck` | **BLOCKED** — exit 1 because the incomplete dependency tree lacked React, Node, Vite and transitive type packages. |
| `npm run test` | **BLOCKED** — exit 127 because `vitest` was not installed. |
| `npm run build` | **BLOCKED** — exit 1 at TypeScript startup because the dependency/type tree was incomplete. |

No repository-native command is reported as passing.

### Dependency-independent supplementary checks

| Check | Result |
| --- | --- |
| Global TypeScript 5.8.3 strict contract check over changed Automation sources and relevant existing ITSM components, including unused-symbol checking | **PASS** |
| TypeScript isolated transpile syntax check across all 28 changed `.ts` / `.tsx` files | **PASS** |
| Executable Automation domain assertions | **PASS** — lifecycle states, draft/validate workflow, concurrency, six nodes, simulation boundary, runtime TBD rejection, template-scoped run mapping, routes and production fail-closed behavior. |
| Source integration assertions | **PASS** — four routes registered, P22/P34 links present, no default `/api/...` path in the new HTTP adapter, simulation boundary present. |

These supplementary checks do not replace the repository-native lint, typecheck, test or build commands; those must be rerun after dependencies can be installed.

## Local integration validation — 2026-07-28

The returned archive was overlaid onto a clean worktree at baseline `7813a98f9be2205f32680c9c795fd91ada787cc6`. Local review found and corrected two HTTP-adapter defects before publication:

- list responses were unwrapped too early, discarding `nextCursor`, `previousCursor`, `total`, `partialFailures` and `authoritativeAt`;
- missing endpoint mappings threw before returning the method's promised rejection, breaking the asynchronous adapter contract.

The write-header test was also adjusted to satisfy the repository's no-unused-variables lint rule without reducing its assertions.

| Command / check | Actual result |
| --- | --- |
| `git diff --check` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run test` | **PASS** — 14 files, 49 tests |
| `npm run build` | **PASS** — Vite production build completed; the existing large-chunk advisory remains non-blocking |
| Headless runtime route check | **PASS** — `/itsm/automation`, Template Library/detail, Runtime Settings and Run Detail loaded in fixture review mode |
| Runtime interaction check | **PASS** — simulation reported `connectorExecuted:false` and `authoritative:false`; all 12 runtime settings rendered |
| Browser console / page errors | **PASS** — none across the five checked routes |
| 1440 × 900 document overflow | **PASS** — none across the five checked routes |

No screenshots, videos, traces or GitHub Actions were generated or used for this validation.

## BLOCKED / TBD backend capabilities

The following remain backend-owned and are not implemented or claimed as connected:

- authoritative Template list/detail persistence;
- clone, draft-version, metadata, schema and workflow persistence;
- validation service and immutable validation evidence;
- publish, rollback, deprecate and archive lifecycle service;
- non-executing server simulation/sandbox guarantees;
- queue partitioning and concurrency configuration;
- execution timeout, retry/backoff and dead-letter configuration;
- idempotency registry/window enforcement;
- approval timeout enforcement;
- compensation executor and partial-side-effect ledger;
- restart/redeploy execution;
- retention enforcement;
- authoritative run detail and step trace;
- retry/cancel executor semantics;
- IAM/capability policy decisions;
- authoritative audit ledger and retention.

No Go, Java, Python, database, queue, SMTP/IMAP/Graph, scheduler or executor implementation was added or modified.
