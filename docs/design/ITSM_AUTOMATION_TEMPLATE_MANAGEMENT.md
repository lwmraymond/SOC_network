# ITSM Automation Template management frontend framework

## Scope

This frontend-only work surface separates reusable ITSM Automation Templates from the broader P34 playbook prototype and from rule/run administration.

Routes:

- `/itsm/automation` — overview, rule editor and execution runs;
- `/itsm/automation/templates` — searchable Template Library;
- `/itsm/automation/templates/:templateId` — metadata, schema, workflow, versions, simulation and template-scoped runs;
- `/itsm/automation/runtime` — execution-engine settings contract;
- `/itsm/automation/runs/:runId` — run detail and step trace.

## Governance boundary

All writes use impact preview, confirmation, a queued/accepted non-authoritative receipt and resource rehydration. Development fixture state is browser-memory review state only and always returns `authoritative:false`.

Simulation is explicitly non-executing:

- no connector is invoked;
- no notification is sent;
- no approval decision is recorded;
- no Ticket or external object is mutated;
- expected receipts are contract projections, not issued receipts.

## Backend mapping

No production endpoint is assumed. `createHttpAutomationTemplateManagementAdapter` requires explicit endpoint injection for every operation. Missing endpoint keys throw a classified unavailable error.

| Frontend operation | Required backend capability | Mapping status |
| --- | --- | --- |
| list/get templates | Cursor pagination, filters, sort, ETag/version and permission envelope | BLOCKED / TBD |
| list template versions | Immutable version history, validation findings and release metadata | BLOCKED / TBD |
| clone/create draft/save metadata/schema/workflow | Idempotent mutation, optimistic concurrency, preview and authoritative refresh | BLOCKED / TBD |
| publish/rollback/deprecate/archive | Governed lifecycle service and audit receipt | BLOCKED / TBD |
| simulate template | Non-executing evaluator returning textual step trace and expected receipts | BLOCKED / TBD |
| runtime settings read/write | Effective configuration source, validation, permission and apply requirement | BLOCKED / TBD |
| run detail and step trace | Template/version, trigger source, attempts, duration, failure and audit correlation | BLOCKED / TBD |
| retry/cancel | Executor-owned idempotency, side-effect risk and compensation status | BLOCKED / TBD |

The browser must never connect directly to a queue, connector, SMTP/IMAP/Graph transport, database, scheduler or execution engine.
