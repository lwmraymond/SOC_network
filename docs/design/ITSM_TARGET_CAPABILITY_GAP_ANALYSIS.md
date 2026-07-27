# ITSM target capability gap analysis — successor integration

Audit date: 2026-07-27  
Repository: `lwmraymond/SOC_network`  
Successor branch: `agent/itsm-ticket-capability-framework-v2`  
Target base: `codex/p01-p42-density-fixes-20260723` at `99593521404fea5299659e4617c096c58aa60075`  
Successor PR: `#12`, targeting `codex/p01-p42-density-fixes-20260723`

## 1. Integration baseline and migration disposition

PR #11 was built from `fa466957dbdc997f965e93d1b7ba709b33d5c197`. The retained product line subsequently advanced through `7e72555`, `083e44c`, `bff5903` and `9959352`. The v2 branch therefore starts directly from `9959352`; it does not rebase or force-push PR #11.

The ITSM framework was replayed as a successor change set. The two known integration conflicts were resolved manually:

- `src/App.tsx`: retain the product-line `Network SOC` and `System Overview` dashboard routes and add the shared ticket-detail route plus three ITSM administration routes. Ticket Detail remains a child workflow and is not a primary side-navigation item.
- `src/main.tsx`: retain `styles-information-density-fixes.css` and `styles-migration-15174.css`, then load the ITSM capability stylesheet and the P16 audit fix stylesheet after the retained product-line styles.

The retained baseline behaviors are not replaced:

- Create Ticket remains available from P13, P14 and P16 with its existing preflight/governed-preview semantics.
- `/dashboard/network-soc` and `/dashboard/system-overview` remain registered and navigable.
- P01–P42 canonical routes and existing route fixtures remain unchanged.
- Executive/ITSM density fixes from `9959352` remain in the source line.

## 2. Production boundary

This delivery is frontend-only. It contains React, TypeScript, Elastic UI, frontend contracts, adapters, development fixtures, tests and documentation. It does not implement or modify Go, Java or Python services, database migrations, queues, SMTP/IMAP/Microsoft Graph transports, SLA scheduling or automation execution.

The boundary is fail-closed:

- development fixtures require `import.meta.env.DEV && VITE_ENABLE_FIXTURES === 'true'`;
- no production operation falls back to fixture arrays;
- every unconfigured HTTP adapter operation throws a classified `unavailable` error;
- preview, queued, accepted, simulated and dry-run states are not completion states;
- fixture rehydration is explicitly ephemeral and `authoritative:false`;
- endpoint paths remain absent until verified from backend source.

## 3. Existing-page audit and retained role

| Existing page | Retained role | Gap closed by v2 | Remaining production dependency |
| --- | --- | --- | --- |
| P13 ITSM Overview | Service-operations overview and Create Ticket entry | Dedicated administration routes remain reachable without replacing P13 | Authoritative aggregate and ticket APIs |
| P14 Work Queues | Saved views, typed queue and preview drawer | Work-item IDs open the shared Ticket Detail while the preview remains available | Queue/saved-view persistence and ticket API |
| P15 Requests & Service Catalog | Catalog discovery, schema-driven request prototype and fulfilment view | Request IDs open the shared detail with request-specific fields and conversation | Catalog revisions, dynamic schema and request persistence |
| P16 Incident Management | Incident command, impact, restoration and major-incident prototype | Incident IDs open shared detail; P16 impact topology is now an owned CSS grid | Incident persistence, lifecycle, policy and communication services |
| P17 Problem Management | Recurrence/RCA/workaround/known-error workbench | Selected Problem opens shared detail with RCA and typed relations | Problem/known-error persistence and evidence contract |
| P18 Change Management | Calendar, collision, CAB and rollback prototype | Queue/CAB records open shared detail with plan/implementation/rollback tabs | Change, CAB and implementation services |
| P19 Approvals & Tasks | Governed approval/task queue | Shared detail consumes typed approval resources | Approval decision service and policy engine |
| P20 ITSM Analytics | Demand/SLA/backlog analytics | SLA administration separates configuration and clock operations from analytics | Analytics and SLA authoritative data |
| P21 Reports & Exports | Report jobs and export receipt semantics | No replacement; shared contracts preserve non-authoritative job semantics | Export worker and artifact store |
| P22 ITSM Settings | Domain configuration workbench | Explicit links to SLA, Automation and Notifications/Inbound Mail administration | Configuration persistence and governed publication |
| P34 Playbooks & Automation Templates | Existing playbook library and visual graph | ITSM automation administration adds rules, versions, runs, retry/cancel and audit context | Automation executor and connector contracts |

## 4. Target capability status

Status vocabulary:

- `IMPLEMENTED`: runnable frontend framework and development adapter behavior exist.
- `PARTIAL`: a usable frontend surface exists, but a backend-owned portion is intentionally absent.
- `BLOCKED/TBD`: no verified backend endpoint or DTO is available.

| Capability | Implemented frontend | Acceptance behavior | Status |
| --- | --- | --- | --- |
| Service Request / Service Catalog | Request discriminated-union fields, Request form tab, approvals, SLA, relations and conversation | Dynamic values remain schema payloads; fixture writes stay non-authoritative | IMPLEMENTED frontend; backend BLOCKED/TBD |
| Incident | Impact, urgency, affected objects, major flag and lifecycle stage in shared detail | Restore, resolve and major-incident decisions remain distinct | IMPLEMENTED frontend; backend BLOCKED/TBD |
| Problem / Known Error | RCA, root cause, workaround, related incidents and permanent-fix Change | Hypothesis/root cause, workaround and permanent fix remain separate concepts | IMPLEMENTED frontend; backend BLOCKED/TBD |
| Change | Standard/normal/emergency type, risk, CAB, window, validation, implementation and rollback | Approval, implementation, validation and completion are distinct states | IMPLEMENTED frontend; backend BLOCKED/TBD |
| Ticket conversation | Public reply, Internal note, email provenance, mentions, attachment placeholders and audit metadata | Confirm → queued receipt → ephemeral non-authoritative rehydrate visibly closes the fixture loop | IMPLEMENTED frontend; persistence/upload BLOCKED/TBD |
| SLA | Policies, calendars, start/pause/resume/stop, escalations and clock monitor | Browser does not calculate authoritative SLA or claim scheduler success | IMPLEMENTED frontend; scheduler BLOCKED/TBD |
| Automation | Templates, typed rule nodes, versions, dry-run, runs, partial failure, retry and cancel | Dry-run and queued receipts never imply connector completion | IMPLEMENTED frontend; executor BLOCKED/TBD |
| Notifications | Providers, recipients, templates, policies and delivery history | Credential presence only; browser stores no secret and claims no delivery | IMPLEMENTED frontend; transport BLOCKED/TBD |
| Inbound mail | IMAP/Graph mailbox configuration, ordered routing and ingestion history | Test action cannot ingest mail or create/update a ticket in the browser | IMPLEMENTED frontend; ingestion BLOCKED/TBD |
| Production HTTP adapter | Injectable base URL, endpoint map, auth/header injection, AbortSignal, cursor/filter/sort, ETag, idempotency, DTO maps and normalized failures | Unmapped operations fail closed | IMPLEMENTED framework; endpoint mappings BLOCKED/TBD |

## 5. Shared Ticket Detail Workspace

Route:

```text
/itsm/tickets/:ticketId
```

It is intentionally not present in the primary side navigation. Entry points are owned by P14–P18 records and detail actions. The generated link carries the complete parent path and query in `returnTo`, plus a parent label. Browser back/forward and the in-page parent action restore that context.

Shared header information:

- type, key and title;
- priority and status;
- assignee and assignment group;
- service;
- SLA clock summary;
- adapter/authority state;
- ETag and version context for governed writes.

Shared tabs:

```text
Overview · Conversation · Activity · Relations · Approvals · SLA · Automation · Audit
```

Type-specific tabs:

| Type | Additional tabs/data |
| --- | --- |
| Request | Request form, request type, beneficiary, dynamic fields and fulfilment stage |
| Incident | Impact, urgency, major-incident flag, affected objects and lifecycle |
| Problem | RCA, root cause, workaround, linked incidents and permanent-fix Change |
| Change | Change plan, Implementation and Rollback, plus CAB/risk/window metadata |

## 6. Conversation fixture closure

The development fixture adapter now owns an explicit ephemeral store rather than returning immutable module arrays.

The governed flow is:

1. build `CommentCreateInput` with visibility, body, mentions and attachment placeholder IDs;
2. preview permissions, validation and affected resources;
3. confirm an idempotent write request;
4. return a queued receipt with `authoritative:false`;
5. append the comment and audit event to browser-memory review state;
6. call `refreshTicket`;
7. render the rehydrated thread while retaining the non-authoritative fixture watermark.

Public and internal visibility remain separate. Email-origin fixtures retain `sourceMessageId`. Attachment actions create only `uploadState: placeholder`; no bytes, checksum or malware-scan result is fabricated.

## 7. Administration information density and theme strategy

The three administration pages use a meaningful three-level 4K structure rather than stretching forms or adding empty panels:

1. five-item operational KPI strip;
2. primary policy/editor/history workspace;
3. three secondary panels for health, versions/dependencies/permissions and recent failures or delivery/ingestion state.

At 3840×2160, the ready/data-filled management content must occupy at least 35% of the viewport height. The test also requires five KPI panels and three populated secondary panels. Maximum content width expands in bounded steps rather than filling the entire canvas.

Light theme is the primary ELK/Kibana acceptance mode. Page titles remain directly on the canvas; panels use EUI borders and restrained surfaces. Warning/danger meaning uses badges and callouts rather than large saturated title areas. The same routes are also captured and inspected in dark mode.

## 8. Frontend contract files

```text
src/itsm/contracts.ts
src/itsm/client.ts
src/itsm/httpAdapter.ts
src/itsm/hooks.ts
src/itsm/components/
src/pages/itsm/
```

Cross-cutting semantics:

| Concern | Contract |
| --- | --- |
| Pagination | `CursorPage<T>` with cursor, total and authoritative timestamp |
| Filter/sort/include | `ListQuery` serialized by the HTTP adapter |
| Optimistic concurrency | resource `version`/`etag`; mutation `expectedVersion`/`ifMatch` |
| Idempotency | mandatory `MutationContext.idempotencyKey` for writes |
| Capability | adapter capability snapshot plus per-resource permissions/obligations |
| Validation | structured field/code/message/severity issues |
| Partial failure | operation/resource/code/message/retryable detail retained |
| Errors | unavailable, permission, validation, conflict, offline, timeout, partial or unknown |
| Rehydration | queued result is non-authoritative; UI displays the follow-up read |

Backend mapping is documented separately in `ITSM_BACKEND_CONTRACT_MAPPING.md`.

## 9. Validation contract

The successor validation must run:

```text
npm ci --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright test tests/e2e/all-pages.smoke.spec.ts tests/e2e/itsm-capability-v2.spec.ts --workers=1
```

Browser coverage includes:

- P01–P42 canonical smoke;
- four differentiated ticket types;
- P16 computed grid/overlap geometry;
- fixture comment/mention/email/attachment rehydration;
- P14–P18 detail navigation and parent-context restoration;
- P22 administration links;
- light and dark screenshots at 1440×900, 2560×1440 and 3840×2160;
- first viewport and full page for each route;
- no runtime errors, clipping or document-level horizontal overflow;
- light-theme hierarchy, warning contrast and 4K management-density assertions.

The actual run, commit and screenshot findings are recorded in `ITSM_VALIDATION_EVIDENCE.md` after the branch validation completes.

## 10. Remaining production blockers

| Blocker | Required backend owner/input | Frontend behavior until resolved |
| --- | --- | --- |
| Verified endpoint map and API version | SOC-platform/backend owners | HTTP adapter methods remain unmapped and classified unavailable |
| Ticket/catalog/custom-field DTOs | ITSM domain owners | Stable frontend union and dynamic fields only; no production persistence claim |
| Identity/group/capability decisions | IAM/policy owners | Conditional/deny/unknown decisions remain explicit |
| Comments and attachments | Ticket/evidence services | Ephemeral comments and placeholder-only attachments in development fixtures |
| SLA scheduler/calendar engine | SLA service owner | Policy and clock contracts only; browser time is non-authoritative |
| Automation executor/compensation | Automation owner | Dry-run/queued/partial states only |
| SMTP/Graph transport | Messaging owner | Configuration and delivery-history framework only |
| IMAP/Graph ingestion/threading | Messaging owner | Mailbox/routing/ingestion-history framework only |
| Audit ledger and retention | Governance owner | Structured audit DTO and review-only fixture events |
