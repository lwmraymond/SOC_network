# Demo Build Validation Report

Date: 2026-07-20  
Status: `LOCAL PASS`

## Runtime

- Node: `v22.16.0`
- npm: `10.9.2`
- Package manager: npm with `package-lock.json`
- Production fixture boundary: enforced by `scripts/check-production-boundary.mjs`

## Commands

| Command | Exit code | Result | Duration |
|---|---:|---|---:|
| `npm ci --no-audit --no-fund` | 0 | PASS — 483 packages installed | 12s |
| `npm run lint` | 0 | PASS | 3.50s |
| `npm run typecheck` | 0 | PASS | 9.56s |
| `npm run test` | 0 | PASS — 9 files / 32 tests | 16.49s |
| `NODE_OPTIONS=--max-old-space-size=4096 npm run build` | 0 | PASS — 2,929 modules | 23.88s |

## Build findings

- Vite production build completed successfully.
- Production fixture boundary check passed.
- P32 Monaco is route-lazy but its minified chunk remains approximately 2.56 MB. This is a performance follow-up, not a hidden failure.
- No tests were deleted, skipped, or weakened.
- TypeScript strict checking and ESLint warning-as-error behavior remain enabled.

## Lockfile portability

The committed lockfile preserves exact installed package versions in a portable compact form without private registry hostnames. `npm install` may enrich resolution metadata on a developer machine; direct dependency versions remain pinned in `package.json`.

## Browser boundary

Browser E2E is not claimed in this report. The current execution environment may restrict Chromium navigation; E2E status is tracked separately in N16.

## Commit

The Git commit is populated in the node-delivery progress record after GitHub verification.
