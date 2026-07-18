# CI Baseline Report

Date: 2026-07-18

Status: `LOCAL CONTRACT CHECKS PASS / GITHUB ACTIONS PENDING`

## Commands executed during the original P07 baseline

```text
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

## Original failures

1. React 19 type peers conflicted with EUI 106, and the declared Elastic Charts version did not exist.
2. No lint script/config existed; initial ESLint and P07 hook/expression errors required correction.
3. EUI API typings, recursive filter typing, Vite test config typing, ImportMeta types and table interaction failed the first build.
4. Local Chromium navigation is blocked by managed sandbox policy with `ERR_BLOCKED_BY_ADMINISTRATOR`.

## Re-verification findings

The baseline was not complete. Two additional dependency/runtime defects were confirmed:

1. EUI 106 extensionless dynamic icon requests do not match Vite's pre-bundled `.js` map keys, producing `Module not found in bundle` and a black/unusable application surface.
2. `@vitejs/plugin-react@^4.5.0` does not declare Vite 7 peer compatibility, while `vite@^7.0.0` could resolve to Vite 7.3.6. Node 20.16.0 is also below Vite 7.3.6's supported minimum.

## Corrective changes

- Explicitly pre-register `logoElastic`, `search`, `arrowDown`, `cross` and `lock` through the EUI icon component cache before React renders.
- Add a plain accessible root error boundary as defense in depth.
- Pin Vite 7.3.6 and `@vitejs/plugin-react` 5.0.4.
- Pin the project runtime to Node 22.16.0 through `.nvmrc`; package engines permit `^20.19.0 || >=22.12.0`.
- Remove npm cache setup that depended on a missing lockfile.
- Add unit tests for icon bootstrap and root fallback.
- Make P07 Playwright fail on empty `#root`, page errors or console errors.
- Correct PowerShell and Command Prompt fixture startup instructions.

## Verification completed in the agent environment

- Exact dependency resolution: PASS.
- Vite/plugin peer compatibility: PASS.
- EUI icon pre-bundle key mismatch: reproduced and documented.
- Explicit icon registry TypeScript check: PASS.
- Minimal Vite production build with the registry: PASS.
- Inline Chromium runtime smoke with the registry: PASS, five SVG icons rendered, zero runtime errors.
- Direct HTTP/file browser navigation: `[BLOCKED]` by environment administrator policy.

## GitHub Actions

The pull-request quality and P07 browser jobs are the authoritative repository-level verification. Results remain pending until the branch PR runs.

## Remaining risks

- No package lockfile existed in the repository. Direct toolchain versions are now exact, but transitive dependency locking remains a follow-up hardening item.
- The EUI icon registry is intentionally explicit; future pages must register newly introduced icon types and test their overlay paths.
- Route-level code splitting remains required before the production performance gate.
