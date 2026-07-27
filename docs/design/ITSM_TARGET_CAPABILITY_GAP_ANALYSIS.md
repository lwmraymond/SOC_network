# ITSM target capability gap analysis

Audit date: 2026-07-27  
Repository: `lwmraymond/SOC_network`  
Selected baseline: `codex/kibana-42page-visual` at `fa466957dbdc997f965e93d1b7ba709b33d5c197`  
Implementation branch: `agent/itsm-ticket-capability-framework`

## 1. Baseline selection and audit boundary

The remote default branch is not the authoritative visual implementation line. The selected baseline is the head of draft PR #8 because it contains the complete P01–P42 catalog, the latest shared Elastic UI/Borealis treatments, the P13–P22 ITSM surfaces, P34 automation prototypes, and the most recent typography/density corrections. PR #9 and PR #10 are temporary measurement/capture branches and are not product baselines.

This audit covers frontend information architecture, React/TypeScript/EUI implementation, frontend contracts, development fixtures, route behavior, responsive layout, and verification. It does not implement or claim availability of backend persistence, databases, SMTP/IMAP/Graph connectivity, SLA scheduling, automation execution, message queues, or authoritative policy decisions.

Production integration remains fail-closed:

- fixture data is available only when both `import.meta.env.DEV` and `VITE_ENABLE_FIXTURES=true` are true;
- an unavailable production adapter is displayed as unavailable and is never replaced by local arrays;
- preview, queued, accepted, simulated, and dry-run states are not completion states;
- every write contract requires impact preview, confirmation, idempotency, optimistic concurrency, a receipt, and authoritative rehydration.

## 2. Existing P13–P22 and P34 audit

| Page | Existing usable UI | Existing frontend contract behavior | Material gap before this change | Risk | Target disposition |
| --- | --- | --- | --- | --- | --- |
| P13 ITSM Overview | Service-operation summary, typed work-item attention queue, SLA/sync indicators | Prototype page fixture with explicit unavailable state outside development fixtures | No drill-through to a shared ticket detail workspace; no operational SLA administration | High | Retain overview; use shared ticket route for record-level work |
| P14 Work Queues | Saved-view queue and preview behavior | Prototype filters, rows, state simulation | Queue rows do not own a complete cross-type ticket workspace or conversation lifecycle | High | Retain queue; route selected records to shared ticket workspace |
| P15 Requests & Service Catalog | Catalog discovery, taxonomy, schema revision, request form, fulfilment view | Development-only local catalog/rows and explicit prototype receipt | No reusable request detail, approval/fulfilment timeline, governed comment model, or stable API DTO | High | Retain catalog; add `request` specialization in shared ticket workspace |
| P16 Incident Management | Incident queue, impact view, restoration steps, major incident decision preview | Prototype queued receipts; no production mutation claim | No common detail tabs, public/internal conversation, relation/approval/audit resources, or authoritative refresh contract | Critical | Retain command page; add `incident` specialization and shared ticket tabs |
| P17 Problem Management | Recurrence candidates, RCA, workaround, known error, permanent-fix linkage | Prototype candidate evidence and queued publication receipt | No normalized Problem/known-error DTO, shared relation/audit model, or reusable RCA detail tab | High | Retain workbench; add Problem-specific RCA tab and typed links |
| P18 Change Management | Calendar, queue, CAB view, conflicts, rollback readiness | Prototype decision receipt with explicit approval/execution separation | No typed standard/normal/emergency contract, implementation window DTO, common approvals/audit/conversation, or authoritative refresh | Critical | Retain calendar/CAB surface; add Change plan/Implementation/Rollback tabs |
| P19 Approvals & Tasks | Governed approval/task queue | Prototype decision semantics | Approval resource is not yet reusable inside ticket detail; no stable version/idempotency contract | High | Expose typed approvals in shared ticket workspace |
| P20 ITSM Analytics | Demand/SLA/resolution/backlog analytics | Exact-data prototype semantics | No direct policy/calendar/clock administration | Medium | Retain analytics; link operational clocks to SLA administration |
| P21 Reports & Exports | Report-job and export surfaces | Queued job/receipt model | No material dependency for this delivery; backend export remains blocked | Medium | No redesign in this change |
| P22 ITSM Settings | Domain navigation with SLA, automation, notification entries; revision/diff/publish preview | Prototype-only draft/publish receipt | Settings entries are not complete operator workspaces and do not expose required resource histories | Critical | Add dedicated SLA, Automation, and Notifications/Inbound Mail routes |
| P34 Playbooks & Automation Templates | Template library, graph composer, simulation trace, publish/manual-run preview | Simulation and queued connector receipt semantics | No normalized rule/version/run APIs, execution history governance, retry/cancel interface, or ITSM-specific trigger/action resource model | Critical | Retain P34 playbook surface; add ITSM automation administration route |

The existing visual audit records P13–P22 and P34 density concerns: queue/card rhythm, metadata line height, intrinsic-width badges, calendar labels, settings editor spacing, and automation-node spacing. New layouts therefore use 24 px module gaps, 16 px panel padding, 13/20 body text, 11/16 metadata, minimum 40 px table rows, intrinsic badges, and panel-owned overflow.

## 3. Target capability matrix

Status values:

- `IMPLEMENTED`: frontend framework and development adapter are present in this branch.
- `PARTIAL`: an existing prototype remains useful but does not meet the complete target without the new shared framework.
- `BLOCKED`: production behavior depends on an unverified backend contract or service.

| Capability | Existing UI | Existing production contract | Gap | Implemented page/component/API | Priority | Acceptance criteria | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Service Request / Service Catalog | P15 catalog, form modal, request/fulfilment views | None verified | Stable request type, dynamic fields, approval/fulfilment detail, shared thread | `Ticket` union with `ServiceRequestTicket`; `/itsm/tickets/:ticketId`; Request form tab; comments/approvals/SLA contracts | P0 | Request renders type-specific fields and stages; public/internal conversation remains distinct; writes use governed lifecycle | IMPLEMENTED frontend; production BLOCKED |
| Incident | P16 queue/command/major-incident prototype | None verified | Shared detail, affected objects, lifecycle DTO, relations, audit, conversation | `IncidentTicket`; Overview/Conversation/Activity/Relations/Approvals/SLA/Automation/Audit tabs | P0 | Impact, urgency, affected objects and lifecycle are visible; major incident action cannot imply completion | IMPLEMENTED frontend; production BLOCKED |
| Problem / Known Error | P17 recurrence/RCA/workaround/permanent fix | None verified | Stable RCA/workaround/known-error contract; linked incidents and permanent fix | `ProblemTicket`; RCA tab; typed relations to incidents/changes | P0 | Root cause and hypothesis are not conflated; workaround and permanent fix remain separate; relations are navigable | IMPLEMENTED frontend; production BLOCKED |
| Change | P18 calendar/queue/CAB prototype | None verified | Standard/normal/emergency type, risk, CAB, window, plan/validation/rollback contract | `ChangeTicket`; Change plan/Implementation/Rollback tabs; approval resources | P0 | Approval, scheduled, implementing, validation and completion remain separate states; rollback is always visible | IMPLEMENTED frontend; production BLOCKED |
| Ticket comments and conversation | No reusable cross-type workspace | None verified | Public reply/internal note, attachment placeholder, @mention, email provenance, timeline/audit metadata | `TicketComment`, `TicketAttachment`; shared thread/composer; preview before send | P0 | Visibility is explicit; attachment UI never claims upload; email source/message ID is visible; send requires preview and rehydration | IMPLEMENTED frontend; production BLOCKED |
| Ticket relations, approvals and audit | Split across P17/P18/P19 prototypes | None verified | Stable resource methods, cursor pagination, version and partial failure | Adapter methods for relations, approvals, decisions and audit events | P0 | Each resource has version/ETag semantics; partial failures are preserved; denied states do not leak counts | IMPLEMENTED contracts; production BLOCKED |
| SLA policies | P13/P20 indicators and P22 setting row | None verified | Complete start/pause/resume/stop conditions, priority/type scope and revision workflow | `/itsm/sla`; `SlaPolicy`; preview/save adapter methods | P0 | Policy editor shows all lifecycle conditions and calendar binding; save is a queued draft, not scheduler success | IMPLEMENTED frontend; scheduler BLOCKED |
| Business calendars | P22 reference only | None verified | Time zone, business hours, holidays, revision/status | `/itsm/sla` Calendars tab; `BusinessCalendar` | P0 | Calendar displays time zone, weekly windows, holidays and revision; no browser-side time calculation is authoritative | IMPLEMENTED frontend; backend BLOCKED |
| SLA clocks and escalations | P13/P16/P20 indicators | None verified | Clock resource, authoritative timestamp, breach state, escalation threshold/actions | SLA Clock monitor and Escalations tabs; `SlaClock`, `EscalationRule` | P0 | Clock states distinguish running/paused/met/breached/stopped and show authoritative watermark | IMPLEMENTED frontend; scheduler BLOCKED |
| Automation templates and rules | P34 playbook prototype | None verified | ITSM rule/template/version DTO, validation, publication and execution history | `/itsm/automation`; `AutomationTemplate`, `AutomationRule`, `AutomationVersion` | P0 | Trigger/condition/action/approval nodes remain typed; publication requires preview and version | IMPLEMENTED frontend; executor BLOCKED |
| Automation dry-run and execution history | P34 simulation flyout only | None verified | Normalized run states, partial failure, retry/cancel and audit correlation | Execution Runs tab; `AutomationRun`; dry-run/retry/cancel adapter methods | P0 | Dry-run never executes connectors; queued/partial/failed are explicit; retry warns about side effects | IMPLEMENTED frontend; executor BLOCKED |
| Notification providers | P22 navigation entry only | None verified | SMTP/Graph provider configuration, secret-presence state, test receipt | `/itsm/notifications` Providers tab; `NotificationProvider` | P0 | UI never stores secrets; test returns queued receipt and does not claim delivery | IMPLEMENTED frontend; SMTP/Graph BLOCKED |
| Templates, recipients and policies | P22 entry only | None verified | Stable templates/variables/recipient references/event conditions | Templates & Policies tab; typed recipients/templates/policies | P1 | Template variables and provider/recipient references are visible; publication remains governed | IMPLEMENTED frontend; backend BLOCKED |
| Delivery history | None | None verified | Provider message ID, attempts, normalized failure and partial state | Delivery history table; `NotificationDelivery` | P1 | queued/accepted/delivered/failed/partial are distinct; failed reason and attempt count are visible | IMPLEMENTED frontend; transport BLOCKED |
| Inbound mailboxes | None | None verified | IMAP/Graph mailbox, credential/consent presence, polling/subscription mode, test | Inbound Mailboxes tab; `InboundMailbox` | P0 | UI never connects directly or stores credentials; connection test cannot create/update a ticket | IMPLEMENTED frontend; IMAP/Graph BLOCKED |
| Inbound routing | None | None verified | Ordered conditions and create/update/ignore/quarantine actions | `InboundRoutingRule`; mailbox route list | P0 | Rule order, conditions and target ticket kind are visible; no email is ingested by preview | IMPLEMENTED frontend; ingestion service BLOCKED |
| Ingestion history | Email source exists only as a page-fixture concept | None verified | Message ID, sender, matched rule, ticket link, quarantine/failure metadata | Delivery & Ingestion tab; `IngestionEvent` | P1 | Created/updated/ignored/quarantined/failed states are distinct; source message ID is auditable | IMPLEMENTED frontend; ingestion service BLOCKED |

## 4. Shared Ticket Detail Workspace

Route: `/itsm/tickets/:ticketId`

Shared header:

- ticket kind and key;
- title, priority and lifecycle status;
- assignee and assignment group;
- service;
- SLA clock summary;
- version/ETag and adapter capability context.

Shared tabs:

- Overview;
- Conversation;
- Activity;
- Relations;
- Approvals;
- SLA;
- Automation;
- Audit.

Type-specific additions:

| Type | Additional information / tabs |
| --- | --- |
| Request | request type, beneficiary, schema-driven dynamic fields, fulfilment stage, Request form |
| Incident | impact, urgency, major-incident flag, affected objects, detect/triage/investigate/restore/monitor/resolve lifecycle |
| Problem | known-error flag, RCA state, root cause, workaround, linked incidents, permanent-fix Change, RCA |
| Change | standard/normal/emergency type, risk, implementation window, CAB requirement, validation/implementation/rollback plans |

Conversation contract:

- Public reply and Internal note are separate composer modes and separate persisted visibility values.
- `@mention` tokens are captured as contract values; identity resolution is backend-owned.
- Attachment selection creates a placeholder contract only; it does not claim bytes are uploaded or available.
- Email-origin comments retain source and source-message metadata.
- Send lifecycle is `impact preview → confirm → queued/accepted receipt → authoritative refresh`.

## 5. Frontend API contract and adapter boundary

Primary files:

- `src/itsm/contracts.ts`
- `src/itsm/client.ts`
- `src/itsm/hooks.ts`

All endpoint paths are intentionally marked `TBD` until verified against SOC-platform or another authoritative backend source. Stable frontend method and payload names are defined for:

- tickets, requests, incidents, problems and changes;
- comments, attachment placeholders, relations, approvals and audit events;
- SLA policies, calendars, clocks and escalations;
- automation templates, rules, versions, runs, retry and cancel;
- notification providers, recipients, templates, policies and deliveries;
- inbound mailboxes, routing rules, ingestion events and connection tests.

Cross-cutting semantics:

| Concern | Frontend contract |
| --- | --- |
| Pagination | cursor-based `CursorPage<T>` with next/previous cursor and optional total |
| Filter/sort | `ListQuery.filters`, `ListQuery.sort`, `ListQuery.include` |
| Optimistic concurrency | resource `version`/`etag`; mutation `expectedVersion`/`ifMatch` |
| Idempotency | mandatory `MutationContext.idempotencyKey` |
| Permission | capability snapshot plus per-resource permission/obligation values |
| Validation | structured field/code/message/severity issues |
| Partial failure | operation/resource/code/message/retryable details preserved in page or receipt |
| Error normalization | unavailable, permission, validation, conflict, offline, timeout, partial or unknown |
| Authoritative refresh | queued result is non-authoritative; a follow-up adapter read supplies the displayed resource |

## 6. State model

Every new capability page supports the same explicit states:

- loading;
- ready;
- empty;
- filtered-empty;
- error;
- denied;
- offline;
- stale;
- partial.

Development builds expose a query-driven state switcher for deterministic review. Production does not use the switcher and does not reveal fixture values when the adapter is unavailable.

Write operations support:

1. `idle`;
2. `previewing`;
3. `preview`;
4. `confirming`;
5. `queued`;
6. `rehydrating`;
7. `complete` only after refresh;
8. `error` with normalized classification.

A development-fixture refresh remains explicitly non-authoritative.

## 7. Routes and navigation

| Route | Purpose |
| --- | --- |
| `/itsm/tickets/:ticketId` | Shared Request / Incident / Problem / Change detail and conversation workspace |
| `/itsm/sla` | SLA policies, business calendars, escalations and clock monitor |
| `/itsm/automation` | Automation templates, rule editor, publication/dry-run controls and execution runs |
| `/itsm/notifications` | Notification providers, templates/policies, inbound mailboxes, delivery and ingestion history |

All four routes are added to the existing `Ticket System / ITSM` side-navigation group. Existing P13–P22 and P34 routes remain intact.

## 8. Responsive and visual acceptance

The implementation inherits the existing EUI quality standard and adds the following route-specific layout rules:

| Viewport | Layout expectation |
| --- | --- |
| 1440 × 900 | Shared detail uses at most two primary columns; composer/admin inspector collapses before content becomes cramped; tables own horizontal overflow |
| 2560 × 1440 | Three-column ticket overview is allowed; conversation remains a readable thread plus composer; max content width is 2800 px |
| 3840 × 2160 | Content stays centered within the 2800 px cap; cards use auto-fit grids rather than stretching copy across the full canvas |

Required visual gates:

- no document-level horizontal overflow;
- no visible text overlap or clipped labels;
- body 13/20, supporting 12/16, metadata 11/16;
- standard table rows at least 40 px;
- intrinsic-width badges;
- 24 px module separation and 8 px internal control/item rhythm;
- warning/danger meaning is expressed in text, not color alone;
- page title remains on the EUI page canvas without a decorative hero bar.

Planned deterministic screenshot paths:

```text
artifacts/itsm-capability-screenshots/1440x900/
artifacts/itsm-capability-screenshots/2560x1440/
artifacts/itsm-capability-screenshots/3840x2160/
```

Each directory must contain the shared ticket, SLA, automation and notifications/inbound-mail pages.

## 9. Production integration blockers

| Blocker | Required owner / input | Frontend behavior until resolved |
| --- | --- | --- |
| Canonical endpoint paths and API version | SOC-platform/backend owners | `ITSM_ENDPOINTS` stays `TBD`; production adapter reports unavailable |
| Ticket schemas, custom-field schema and service catalog revisions | ITSM domain/backend owners | Typed stable envelope plus flexible dynamic fields; no hard-coded production success |
| Identity, roles, groups and capability policy | IAM/policy owners | Capability model displays unknown/conditional/deny; UI does not infer authorization |
| Comment persistence, attachment upload and malware scanning | Ticket/evidence services | Composer and attachment placeholder UI only; no upload-complete claim |
| SLA scheduler and business-calendar engine | SLA service owner | Policies/calendars/clocks are frontend contracts; no browser timer is authoritative |
| Automation executor, connector idempotency and compensation | Automation platform owner | Dry-run and queued receipts only; partial failure remains explicit |
| SMTP/Microsoft Graph notification transport | Messaging owner | Provider configuration/test UI only; no delivery claim |
| IMAP/Microsoft Graph ingestion and message threading | Messaging owner | Mailbox/routing/history UI only; no polling/subscription runs in browser |
| Audit ledger and retention | Governance owner | Structured audit DTO; fixture events are review-only |
| SOC-platform repository/API evidence | Backend owners | No Go/Java/Python service or migration is added or modified by this branch |

## 10. Delivery acceptance checklist

- [x] Select the latest complete P01–P42 + EUI baseline rather than assuming the default branch.
- [x] Preserve the development-only fixture gate and production fail-closed behavior.
- [x] Define stable frontend contracts and adapter methods for all requested resources.
- [x] Implement a shared, type-differentiated Ticket Detail Workspace.
- [x] Implement Public reply/Internal note conversation with preview and attachment placeholder semantics.
- [x] Implement SLA policies/calendars/escalations/clock administration framework.
- [x] Implement Automation templates/rule editor/runs/retry framework.
- [x] Implement notification provider/template/policy/delivery and inbound mailbox/routing/ingestion framework.
- [x] Connect new routes to existing ITSM navigation without replacing P13–P22 or P34.
- [ ] Complete lint, TypeScript, unit, production build and route smoke validation.
- [ ] Capture and visually inspect the four critical routes at 1440 × 900, 2560 × 1440 and 3840 × 2160.
- [ ] Record final commit SHA, validation evidence and remaining backend blockers.
