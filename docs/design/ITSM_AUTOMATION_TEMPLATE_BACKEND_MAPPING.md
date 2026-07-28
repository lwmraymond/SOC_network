# ITSM Automation Template backend contract mapping

No authoritative Automation Template or execution-engine endpoint was available in the provided local source snapshot. Therefore no URL is recorded as discovered or connected.

The HTTP adapter accepts an explicit `HttpAutomationTemplateEndpointMap`. Every field is optional so the default production behavior remains fail-closed.

| Endpoint-map key | Frontend method | Request semantics | Required response semantics | Status |
| --- | --- | --- | --- | --- |
| `templates` | `listTemplates` | cursor, limit, `filter[...]`, repeated sort/include | page items, cursors, total, partial failures, authoritative timestamp | TBD |
| `templateDetail(id)` | `getTemplate`, `refreshTemplate` | `AbortSignal`; optional receipt correlation on refresh | ETag/version, permissions, schemas, workflow, dependency health | TBD |
| `templateVersions(id)` | `listTemplateVersions` | cursor/filter/sort | immutable versions, release notes, creator/time, validation findings | TBD |
| `templateActionPreview` | `previewTemplateAction` | action union only; no mutation | permissions, validation, affected resources, warnings, expiry | TBD |
| `templateActionExecute` | `executeTemplateAction` | `If-Match`, expected version, `Idempotency-Key` | queued/accepted non-authoritative receipt | TBD |
| `templateSimulation` | `simulateTemplate` | sample JSON input and version | textual step trace, condition result, approval gate, expected receipts; `connectorExecuted:false` | TBD |
| `runtimeSettings` | `getRuntimeSettings`, `refreshRuntimeSettings` | read with abort/correlation | source, effective/configured values, validation, permission, restart/redeploy requirement | TBD |
| `runtimeSettingsPreview` | `previewRuntimeSettings` | partial settings patch; no mutation | impact and validation preview | TBD |
| `runtimeSettingsSave` | `saveRuntimeSettings` | optimistic concurrency and idempotency | queued/accepted receipt; no restart-success claim | TBD |
| `runs` | `listRuns` | cursor/filter/sort | template/version, trigger, mode, state, attempt, duration, failure, audit correlation | TBD |
| `runDetail(id)` | `getRun` | read | ordered step trace and issued/expected receipt metadata | TBD |
| `runRetry(id)` | `retryRun` | idempotency and side-effect acknowledgement | queued/accepted receipt | TBD |
| `runCancel(id)` | `cancelRun` | concurrency and cancellation reason | queued/accepted receipt | TBD |

Error normalization must preserve permission, validation, conflict, timeout, unavailable, partial failure and current-version information. No missing endpoint may return a synthetic success.
