# Foundation Contracts Report

Status: `IMPLEMENTED / PROTOTYPE ADAPTERS / PRODUCTION SERVICES BLOCKED`

Implemented reusable contracts:

- `query.ts`: tokenization, typed AST, nested Boolean groups, NOT, typed comparisons, structured validation, time/sort/cursor/projection/aggregation envelope and URL serialization.
- `filters.ts`: nested groups, include/exclude, same-field OR normalization, cross-field AND, permission migration, dependencies, URL/Saved View serialization and facet status contract.
- `savedViews.ts`: production-neutral repository interface plus explicitly in-memory prototype adapter, revisions, conflicts, sharing, defaults, duplication and URL override precedence.
- `cursor.ts`: server cursor request/response, opaque cursors, cancellation, retry, approximate/total counts, coverage, stale, partial and classified errors.
- `permissions.ts`: unified route/row/field/action/export/workflow decision shape, reason codes, masking and hidden-count protection.
- `actions.ts`: action, async export job, receipt and audit contracts with distinct submitted/accepted/queued/approved/executing/partial/completed states.

`[BLOCKED]` Production endpoint, event schema, policy engine, Saved View service, export worker, audit store and authoritative rehydration API were not supplied.
