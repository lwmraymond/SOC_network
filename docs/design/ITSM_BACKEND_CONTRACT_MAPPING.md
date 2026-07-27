# ITSM backend contract mapping

Mapping date: 2026-07-27  
Frontend repository: `lwmraymond/SOC_network`  
Successor branch: `agent/itsm-ticket-capability-framework-v2`

## 1. Source-verification result

No repository named `SOC-platform` or equivalent authoritative backend source is available through the GitHub installation used for this work. The accessible repository list was checked, and `lwmraymond/SOC-platform` returned `Not Found`.

Consequently:

- no backend endpoint in this document is marked verified;
- no path is invented or inferred from a UI name;
- no backend DTO is claimed to exist;
- the default `ITSM_ENDPOINTS` descriptors contain `status: 'tbd'` and no `path`;
- `createHttpItsmAdapter(config)` can only call operations explicitly supplied by an integrator in `config.endpoints`;
- every missing operation returns a classified non-retryable `unavailable` error.

A future update may mark a mapping verified only after the corresponding controller/router/handler and DTO are read from an authoritative backend repository or specification.

## 2. HTTP adapter integration contract

`createHttpItsmAdapter(config)` provides the transport boundary without connecting the browser directly to a database, scheduler, queue, SMTP, IMAP, Graph mailbox or automation executor.

Configuration supports:

- `baseUrl`;
- a partial operation-to-`method/path` endpoint map;
- injected `fetch` implementation;
- common headers and asynchronous auth/header injection;
- request and response DTO mapping by operation;
- `AbortSignal` propagation;
- cursor, limit, filter, sort and include query serialization;
- `ETag`/`If-Match` and expected-version headers;
- `Idempotency-Key` and client-request ID;
- response ETag/request ID extraction;
- permission, validation, conflict, timeout, offline, unavailable and partial-failure normalization.

Endpoint templates may use explicit variables such as `{ticketId}` or `{ruleId}` only when the integrator supplies a verified endpoint definition. The framework does not ship a default production URL.

## 3. Method mapping inventory

`Backend endpoint / DTO` is `TBD` for every operation because no authoritative backend source was accessible.

### Capability and tickets

| Frontend method | Backend endpoint / DTO | Frontend request/response rule | Missing authoritative fields / decisions |
| --- | --- | --- | --- |
| `getCapabilities` | TBD | Map subject, adapter, checked timestamp and permission decisions into `CapabilitySnapshot` | Identity subject, capability vocabulary, obligations and source watermark |
| `listTickets` | TBD | Serialize `ListQuery`; map cursor page into discriminated `Ticket[]` | Canonical pagination, filters, sort fields, permissions and partial coverage |
| `getTicket` | TBD | Map one record and related resources into `TicketBundle` | Canonical union discriminator, custom fields, relation expansion and clock authority |
| `previewCreateTicket` | TBD | Send `TicketCreateInput`; map `ImpactPreview` | Validation schema, permissions, affected resources and preview expiry |
| `createTicket` | TBD | Send body plus idempotency/concurrency headers; map receipt/resource envelope | Authoritative key allocation, persistence state and refresh token |
| `previewUpdateTicket` | TBD | Send ticket ID and patch; map impact/validation | Allowed transitions, policy obligations and collision details |
| `updateTicket` | TBD | Send patch with `If-Match`, expected version and idempotency key | Conflict payload, authoritative resource and receipt state |
| `refreshTicket` | TBD | Re-read ticket after a receipt; may reuse a verified detail GET | Receipt correlation and authoritative-at semantics |

### Conversation, attachments, relations, approvals and audit

| Frontend method | Backend endpoint / DTO | Frontend request/response rule | Missing authoritative fields / decisions |
| --- | --- | --- | --- |
| `listComments` | TBD | Cursor/filter/sort into `TicketComment[]` | Visibility policy, redaction, email provenance and retention |
| `previewCreateComment` | TBD | Map visibility/body/mentions/attachment IDs into preview | Mention resolution, recipient impact and permission obligations |
| `createComment` | TBD | Governed write; queued receipt then ticket refresh | Persistence, notification side effects and authoritative timestamp |
| `createAttachmentPlaceholder` | TBD | Create metadata placeholder only | Upload URL, checksum, size, malware scan and completion contract |
| `listRelations` | TBD | Map typed targets and relation kinds | Allowed relation graph, direction and permissions |
| `createRelation` | TBD | Governed relation write | Duplicate/cycle validation and authoritative graph version |
| `listApprovals` | TBD | Map approval stages and decisions | Policy reference, delegated approver and separation-of-duties state |
| `decideApproval` | TBD | Send decision/rationale with concurrency/idempotency | Decision authority, transition receipt and audit result |
| `listAuditEvents` | TBD | Cursor/sort into immutable event records | Ledger ordering, signatures, retention and redaction |

### SLA

| Frontend method | Backend endpoint / DTO | Frontend request/response rule | Missing authoritative fields / decisions |
| --- | --- | --- | --- |
| `listSlaPolicies` | TBD | Map applicability, target and event conditions into `SlaPolicy` | Condition DSL, revision lifecycle and policy precedence |
| `listBusinessCalendars` | TBD | Map timezone, weekly hours and holidays | Calendar exception model and authoritative calculation version |
| `listSlaClocks` | TBD | Map state, elapsed/remaining and authoritative watermark | Scheduler source, pause ledger, breach semantics and projections |
| `listEscalationRules` | TBD | Map thresholds and typed actions | Action catalog, deduplication and execution ownership |
| `previewSlaPolicy` | TBD | Validate policy and return affected-clock impact | Existing/future clock treatment and simulation evidence |
| `saveSlaPolicy` | TBD | Governed revision write | Draft/publish workflow, approval and scheduler activation receipt |

### Automation

| Frontend method | Backend endpoint / DTO | Frontend request/response rule | Missing authoritative fields / decisions |
| --- | --- | --- | --- |
| `listAutomationTemplates` | TBD | Map template metadata/status/version reference | Template schema and supported node catalog |
| `listAutomationRules` | TBD | Map trigger and typed nodes | Expression language, connector references and permission model |
| `listAutomationVersions` | TBD | Map immutable versions for a rule | Publication provenance and rollback compatibility |
| `listAutomationRuns` | TBD | Map state, dry-run flag, attempts, failure and audit correlation | Step trace, side-effect ledger and compensation state |
| `previewAutomationRule` | TBD | Validate rule/dependencies/permissions | Connector capability checks and affected-resource estimate |
| `saveAutomationRule` | TBD | Governed draft write | Revision allocation and validation evidence |
| `publishAutomationRule` | TBD | Send rule/version and map queued receipt | Approval, activation and rollback receipt |
| `dryRunAutomationRule` | TBD | Send synthetic input; preserve `dryRun:true` | Sandbox isolation and non-side-effect guarantee |
| `retryAutomationRun` | TBD | Map retry request to queued receipt | Idempotent step boundary and partial-side-effect policy |
| `cancelAutomationRun` | TBD | Map cancel request to queued receipt | Cancellable states and in-flight side-effect behavior |

### Notifications

| Frontend method | Backend endpoint / DTO | Frontend request/response rule | Missing authoritative fields / decisions |
| --- | --- | --- | --- |
| `listNotificationProviders` | TBD | Map provider kind/config metadata and secret-presence state | Secret reference, TLS/auth policy and sender validation |
| `listNotificationRecipients` | TBD | Map role/group/address references | Directory resolution, consent and suppression policy |
| `listNotificationTemplates` | TBD | Map subject/body/variables/version | Template language, sanitization and locale handling |
| `listNotificationPolicies` | TBD | Map event, conditions, provider/template/recipients | Event catalog, precedence and throttling |
| `listNotificationDeliveries` | TBD | Map queued/accepted/delivered/failed/partial and attempts | Provider IDs, bounce state, retry schedule and receipt authority |
| `saveNotificationProvider` | TBD | Governed metadata write; browser never sends stored secrets unless backend contract explicitly requires a secret reference | Secret-management workflow and validation |
| `testNotificationProvider` | TBD | Return queued test receipt only | Transport execution, target selection and authoritative test result |

### Inbound mail

| Frontend method | Backend endpoint / DTO | Frontend request/response rule | Missing authoritative fields / decisions |
| --- | --- | --- | --- |
| `listInboundMailboxes` | TBD | Map IMAP/Graph metadata, mode and secret/consent presence | Credential reference, subscription expiry and folder semantics |
| `listInboundRoutingRules` | TBD | Map ordered conditions and create/update/ignore/quarantine action | Condition DSL, trust policy and threading precedence |
| `listIngestionEvents` | TBD | Map message ID, sender, subject, rule, ticket and failure | Deduplication key, attachment quarantine and message retention |
| `saveInboundMailbox` | TBD | Governed mailbox metadata write | Secret/consent workflow and activation receipt |
| `testInboundMailbox` | TBD | Return a queued connectivity/permission test receipt; no ingestion | Test scope, Graph consent, IMAP capability and authoritative result |

## 4. DTO transformation rules

Until backend DTOs are verified, integrations must provide explicit `mapRequest[operation]` and `mapResponse[operation]` functions where the backend shape differs from the stable frontend contract.

Required invariants:

- preserve backend IDs, versions and ETags rather than synthesizing them;
- preserve cursor and partial-failure metadata;
- do not collapse queued/accepted into succeeded/completed;
- preserve `dryRun` separately from execution state;
- preserve comment visibility and email `sourceMessageId`;
- preserve attachment placeholder/upload/scan states separately;
- preserve SLA authoritative timestamp and scheduler state;
- preserve automation side-effect and compensation failures;
- preserve delivery and ingestion failure classifications;
- never infer permissions from the presence of a button or resource count.

## 5. Reverification procedure

When backend source becomes accessible:

1. identify the exact repository, branch and source SHA;
2. locate router/controller/handler registration before recording a path;
3. inspect request, response, error and pagination DTOs;
4. map only fields present in source;
5. record source file and SHA in `ItsmEndpointDescriptor.source`;
6. add adapter tests using representative backend DTO fixtures;
7. keep uncovered operations `TBD` and fail closed;
8. rerun lint, typecheck, unit, build and browser gates.
