# CI Baseline Report

Date: 2026-07-18

## Commands executed

`npm install`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run e2e`.

## Initial failures

1. `npm install`: React 19 type peers conflicted with EUI 106, and the declared Elastic Charts version did not exist.
2. `lint`: no lint script/config existed; initial ESLint config and P07 hook/expression issues were corrected.
3. `build`: EUI API typings, filter recursion typing, Vite test config typing, ImportMeta types, table row interaction and obsolete CSS import failed.
4. `e2e`: local Chromium is installed, but sandbox policy blocks all HTTP navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`.

## Fixes

- Aligned React/React DOM and types to 18.3 for EUI peer compatibility.
- Removed unused/unresolvable Elastic Charts dependency; chart fallback remains semantic HTML.
- Added strict ESLint 9 flat configuration and lint command.
- Corrected all TypeScript and production build errors without disabling checks.
- Added GitHub Actions quality and browser-gate jobs.
- Isolated fixtures behind `import.meta.env.DEV && VITE_ENABLE_FIXTURES === 'true'`.

## Final local result

- Install: PASS
- Lint: PASS
- Typecheck: PASS
- Unit tests: PASS — 18 tests
- Production build: PASS
- Playwright/axe/visual execution: `[BLOCKED]` only in this sandbox by browser administrator policy; suite is committed for GitHub Actions execution.

## Remaining risk

- Four moderate npm audit findings require dependency-owner review; no forced breaking upgrade was applied.
- Initial bundle is 1.23 MB uncompressed; route-level code splitting is required before production gate.
- CI is not marked PASS until the GitHub workflow completes successfully.
