# ITSM Missing Function Backlog

Date: 2026-07-21  
Repository: `lwmraymond/SOC_network`  
Authoritative branch: `agent/page-differentiation-audit`  
Baseline PR head: `4442475a828973075e0b34d3b9b0be1c14a442ae`  
Progress at audit start: Pages `42/42 GITHUB_SAVED`; Workflows `0/19`; current item `H01`.

## Prioritization summary

- P0: 11 — import graph, current workflow gate, H02–H08, and automation-template foundations.
- P1: 12 — parent-to-workflow closure, typed lifecycle, SLA/CAB/release, SOC/ITSM and automation governance.
- P2: 9 — queue efficiency, notifications, on-call, knowledge, analytics, scheduled delivery and state coverage.
- P3: 3 — AI-assisted and advanced optimization features.

This backlog does not authorize batch implementation. Each row is an independent candidate for the existing fail-closed one-page/one-workflow/one-small-gap Git cycle.

## Prioritized backlog

| Backlog ID | Priority | Domain / object | Required correction | Current evidence | Acceptance evidence | Target surface | Delivery unit |
|---|---|---|---|---|---|---|---|
| `P0-ENG-01` | `P0` | Import graph | Restore `src/catalog/workflowSpecs.ts` or remove invalid reference only through the existing workflow implementation contract; verify App imports. | `src/App.tsx` imports missing registry; GitHub 404. | App strict typecheck/build can resolve without rebuilding Router. | Shared catalog / H01 gate | One small engineering gap |
| `P0-WF-01` | `P0` | H01 | Complete the authoritative current workflow item before advancing to H02. | Progress currentItem is H01; workflowsSaved 0. | H01 committed, pushed, read back; progress advances to H02. | H01 | One workflow / one Git |
| `P0-WF-02` | `P0` | H02 Work Item Detail | Implement typed Incident/Request/Task detail with timeline, notes, SLA clocks, assignment, communication, links, resolution and audit receipts. | H02 source 404; P14/P16/P19 local previews only. | Parent opens H02; URL restores parent query/selection; typed sections interactive; receipt semantics explicit. | H02 | One workflow / one Git |
| `P0-WF-03` | `P0` | H03 Create Request | Implement request-type selection, dynamic required fields, validation, affected user, service/CI, reason, attachment placeholder, approval/fulfilment preview and submit receipt. | H03 source 404; P15 Modal is minimal. | Parent P15 opens H03; schema-driven validation and draft/submit receipt work; return context restored. | H03 | One workflow / one Git |
| `P0-WF-04` | `P0` | H04 Major Incident Command | Implement commander/team/bridge/services/timeline/action log/stakeholder updates/status/decisions/recovery/closure/PIR. | H04 source 404; P16 local Modal only. | Major incident object workflow supports command tabs and governed receipts. | H04 | One workflow / one Git |
| `P0-WF-05` | `P0` | H05 Problem / Known Error Detail | Implement statement, services/CIs, incidents, hypotheses/evidence, RCA tasks, KEDB, workaround, change, risk, lifecycle, closure validation. | H05 source 404. | P17 opens H05 with full RCA/KEDB workflow and return context. | H05 | One workflow / one Git |
| `P0-WF-06` | `P0` | H06 Change / CAB Detail | Implement Standard/Normal/Emergency type, full plans, CAB agenda/quorum/comments/reason, implementation, validation, failure/rollback and PIR. | H06 source 404; P18 local CAB only. | P18 opens H06; approval≠execution; rollback and outcome receipts explicit. | H06 | One workflow / one Git |
| `P0-WF-07` | `P0` | H07 Approval Detail | Implement target context/diff/evidence/prior decisions/comments/approve/reject/request changes/delegate/reason/receipt. | H07 source 404. | P19 opens H07 and returns to same tab/filter/selected decision. | H07 | One workflow / one Git |
| `P0-WF-08` | `P0` | H08 Catalog Item Detail | Implement description, eligibility, form schema, approval chain, fulfilment steps, SLA, dependencies, knowledge, version/lifecycle/publish and request action. | H08 source 404; P15 summary only. | P15 opens H08; item detail and request action are complete and restorable. | H08 | One workflow / one Git |
| `P0-AUTO-01` | `P0` | P34 template catalog | Add exact `AUTO-*` template fixture/data model and library filters; do not add an engine. | 0/161 exact templates; P34 uses generic PB-* records. | At least first approved small batch follows full template contract; matrix updated per template. | P34 | One template batch / one Git |
| `P0-AUTO-02` | `P0` | P34 template detail contract | Add description, applicability, conditions, I/O, actions, human tasks, approvals, timeout, retry, error, rollback, scope, capabilities, secrets, consumers, ownership, publish/deprecation and audit fields. | Current Playbook type has 12 fields only. | Selected template detail exposes required contract without production claims. | P34 | One explicit data-contract gap |
| `P1-NAV-01` | `P1` | Parent workflow navigation | Wire P14/P15/P16/P17/P18/P19 object actions to H02–H08 with URL/return context. | Buttons currently stay local or have no navigation. | Open/close restores parent query, tab, filters, selected ID and scroll. | P14–P19 | One parent-link gap |
| `P1-SR-01` | `P1` | Request lifecycle | Add draft, cancellation, requester confirmation, reopen, partial fulfilment, comments and attachments to request flow. | P15 lacks lifecycle closure. | Request workflow expresses state eligibility and required fields. | P15/H03/H02 | One workflow gap |
| `P1-SC-01` | `P1` | Catalog administration | Add item clone, form builder, field rules, entitlement, approval/workflow mapping, cost/group, publish/deprecate/version diff. | P22 generic resource editor only. | Catalog item administration is object-specific and versioned. | P22/H08 | One page gap |
| `P1-IM-01` | `P1` | Incident lifecycle and SLA | Add complete states, transition eligibility, pending reason, reopen, resolution validation and real Demo clock fields. | P16 displays statuses/SLA strings only. | Incident workflow shows clock/target/pause/risk/source/calendar and validated transitions. | P16/H02 | One workflow gap |
| `P1-CH-01` | `P1` | Change types and execution | Add explicit Standard/Normal/Emergency policy and failed/rollback/PIR paths. | P18 does not distinguish types or execution outcomes. | Change type changes approval/risk/rollback path; failure can queue rollback receipt. | P18/H06 | One workflow gap |
| `P1-REL-01` | `P1` | Release/deployment UI | Add release package/train/environment/build/version/deployment state/failure/rollback/notes/validation linked to Change. | No release/deployment object model. | New or embedded surface clearly separates Change from Release and Deployment. | P18/H06/P28 | One page or workflow gap |
| `P1-AP-01` | `P1` | Approval evidence | Add diff, evidence, prior decisions, approver/quorum, comments and decision reason validation. | P19 Modal lacks full evidence history. | Approval decision cannot submit without required reason/evidence checks. | P19/H07 | One workflow gap |
| `P1-SLA-01` | `P1` | SLA/OLA calendar contract | Add response/resolution/fulfilment/approval targets, OLA/vendor, holidays, pause/resume, forecast, warning, breach reason, source/audit. | Current pages use static SLA text. | All clocks show target, elapsed/remaining, pause, policy source and calendar. | P22/H02 | One configuration gap |
| `P1-SOC-01` | `P1` | SOC/ITSM integration state | Replace link badges with bidirectional link, source-of-truth, field ownership/conflict, retry, closure reconciliation and receipt views. | P13/P16/P12/P23 show labels only. | Link detail shows each side, sync state, conflict fields, retry and audit receipt. | H02/H06/H07 | One integration gap |
| `P1-AUTO-03` | `P1` | Visual builder nodes | Add branch, human task, wait/timer, notification, integration, error handler, rollback and output nodes. | P34 has Trigger/Condition/Action/Approval only. | Node palette/inspector validates each required node type. | P34 | One builder gap |
| `P1-AUTO-04` | `P1` | Simulation validation | Add schema/missing-field/capability/branch/unreachable/missing-rollback checks, sample input, mock context, expected vs actual and no-write indicator. | P34 has fixed trace/path percentages. | Simulation produces deterministic path evidence and validation findings. | P34 | One simulation gap |
| `P1-AUTO-05` | `P1` | Version/publish/run history | Add draft→validated→approved→published→deprecated, diff, effective time, rollback revision and run history with attempts/errors/manual intervention/receipt. | P34 only revision label and generic publish Modal. | Template versions and run records are selectable and auditable. | P34 | One lifecycle gap |
| `P2-WQ-01` | `P2` | Queue efficiency | Add vendor/customer/automation failure queues, column management, pagination, skill/load/after-hours/VIP routing and reassignment reason. | P14 has five saved views and bulk assignment. | Queue configuration remains URL/stateful and paginated. | P14/P22 | One small queue gap |
| `P2-NTF-01` | `P2` | Notification center | Add templates, channels, subscription, localization, delivery state, retry, opt-out and audit. | Only send-receipt/reference labels exist. | Notification preview and delivery history are interactive. | P22/H04 | One page gap |
| `P2-ONC-01` | `P2` | On-call/escalation | Add schedules, primary/secondary, escalation policy, acknowledge timer, override, handoff, swarm and missed acknowledgement. | No UI found. | Major Incident can page/ack/escalate via prototype receipts. | H04 | One workflow gap |
| `P2-KM-01` | `P2` | Knowledge article lifecycle | Add article search/suggestion/template/draft/review/publish/expiry/feedback/version/links/create-from-resolution. | P33 manages sources, not articles. | Incident/problem/request flows can suggest/link/create article draft. | P33/P16/P17/H02 | One page gap |
| `P2-CMDB-01` | `P2` | Asset/CI/Service separation | Introduce explicit object types, service relationships, environment, warranty/license, discovery source, data quality and impact. | P08/P12 partially mix labels. | Users can distinguish and navigate Asset, CI and Service without conflation. | H01/P08/P12 | One workflow gap |
| `P2-AN-01` | `P2` | Analytics breadth/drill-down | Add remaining metric catalog, formula/time/scope/source/freshness and route drill-down. | P20 supports four metrics, no record workflow drill-down. | Every metric resolves to exact records and parent context. | P20/H02 | One page gap |
| `P2-RPT-01` | `P2` | Scheduled delivery | Add saved/scheduled reports, recipients, timezone, access policy, delivery retry and audit. | P21 lacks scheduling/recipient config. | Schedule preview and delivery state are visible; queued≠delivered. | P21 | One page gap |
| `P2-STATE-01` | `P2` | Deployment state matrix | Run loading/empty/error/denied/stale across audited pages and workflows without hiding context or leaking records. | Source-level shared states only; browser blocked. | Automated route/state checks pass with unfiltered console errors. | P13–P22/P34/H02–H08 | One validation commit |
| `P2-EUI-01` | `P2` | Controlled field semantics | Replace read-only controlled selects without onChange (notably P22 Apply mode and P34 Capability) with semantic read-only/disabled displays. | Source audit found controlled values without change handlers. | No React controlled-form warning in browser smoke. | P22/P34 | One small bug fix |
| `P3-AI-01` | `P3` | AI-assisted ITSM | Add explainable suggestions for clustering, knowledge gaps, routing and change risk after core workflows exist. | P23 generic copilot only. | Suggestions cite evidence and require explicit user action. | P23 + ITSM workflows | Enhancement |
| `P3-I18N-01` | `P3` | Multilingual communications | Add localized notification/status templates and preview. | No localization UI. | Template preview supports locale fallback and audit. | P22/H04 | Enhancement |
| `P3-CMDB-02` | `P3` | Advanced reconciliation | Add confidence rules, survivorship, duplicate merge proposal and impact simulation. | P08 has basic reconciliation proposal. | Conflict workflow explains field ownership and rollback. | H01/P08 | Enhancement |

## Execution constraints

1. Do not advance the machine progress file past H01 until H01 itself is committed, pushed and read back.
2. Restore missing workflow modules only in authoritative progress order; do not batch H02–H08.
3. Every implementation unit must distinguish UI simulation, queued receipt, authoritative completion and production integration.
4. Do not rebuild App Shell, Router, Sidebar, Theme, backend services, policy engines, SLA engines, CMDB or audit persistence.
5. A browser-unavailable result remains `BROWSER_BLOCKED`; it is not a reason to create a second screenshot system.

## Recommended next sequence

1. `P0-ENG-01` — make the current App import graph internally coherent as part of the H01 gate.
2. `P0-WF-01` — implement and Git-save H01, then advance progress.
3. `P0-WF-02` through `P0-WF-08` — complete H02–H08 one workflow and one Git cycle at a time.
4. `P0-AUTO-01` and `P0-AUTO-02` — expand P34 through small, reviewable template-library/data-contract units rather than one batch.
5. Execute P1/P2 gaps only after the workflow foundation is readable, buildable and browser-validated.
