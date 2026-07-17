# Open Decisions

Date: 2026-07-18

Only decisions that cannot be verified from the current repository are listed here.

| ID | Status | Decision | Recommendation | Impact |
|---|---|---|---|---|
| D01 | `[USER-CHOICE]` | Final product name and tenant branding | Keep neutral `SOC Operations` until brand tokens are supplied | Shell, title, visual regression |
| D02 | `[USER-CHOICE]` | Default landing route | Use `/dashboard/soc`; keep `/dashboard/platform-health` as operator-specific landing | Router and role defaults |
| D03 | `[USER-CHOICE]` | Sidebar label `AnalyzerView` | Display `Analyze` while preserving package group identity in docs | Navigation comprehension |
| D04 | `[USER-CHOICE]` | Default density | Use compact for queues/workbenches and comfortable for settings | Grid and page composition |
| D05 | `[USER-CHOICE]` | Production query language | Keep adapter-neutral normalized AST; do not freeze DSL syntax | P07 API and validation |
| D06 | `[BLOCKED]` | Authentication and policy provider | Supply identity/policy integration contract | Route, row, field, action and export decisions |
| D07 | `[BLOCKED]` | Event search endpoint/schema/cursor | Supply API/OpenAPI/GraphQL/BFF and masked sample payload | P07 real read and G2 |
| D08 | `[BLOCKED]` | Export job and receipt service | Supply async job lifecycle and artifact policy | P07 governed export |
| D09 | `[BLOCKED]` | ITSM connector ownership/mapping | Supply source-of-truth and field mapping owners | Cross-system write/sync gates |

Unblocked work continues with development-only fixtures and explicit prototype labeling. Production builds must not fall back to fixtures.
