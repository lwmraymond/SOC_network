# CI Baseline Report

Date: 2026-07-18

Status: `PASS`

## Authoritative verification

- Repository: `lwmraymond/SOC_network`
- Pull request: `#1`
- Verified head: `6f8427da2204d07f72aae664b0d28a5807748062`
- GitHub Actions workflow run: `29630430056`
- `quality`: PASS
- `p07-browser-gate`: PASS

## Commands executed

```text
npm install --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install --with-deps chromium
npm run e2e
```

## Failures found during re-verification

1. EUI 106 requested extensionless icon paths while Vite dependency pre-bundling generated `.js` map keys, causing `Module not found in bundle` and an empty/unusable React root.
2. Vite could drift to 7.3.6 while `@vitejs/plugin-react` remained on a Vite-6 peer range; Node 20.16.0 was below Vite 7.3.6's supported minimum.
3. `@testing-library/jest-dom@6.6.0` failed under Node 22 ESM collection through an extensionless `lodash/isEqualWith` import.
4. Vitest's default discovery collected Playwright files under `tests/e2e`.
5. The application shell and EUI PageTemplate produced duplicate `main` landmarks; the top bar lacked a banner landmark.
6. Axe could sample EUI modal fade-in state and report transient contrast failures unless the reduced-motion path was selected.
7. The visual suite used exact viewports but `fullPage: true`, so screenshot file dimensions did not match D1080/D2K/D4K names.
8. The prior D4K max-width claim was false because a selector targeted a non-stable EUI class; content still expanded across the full viewport.

## Corrective changes

- Pre-register `logoElastic`, `search`, `arrowDown`, `cross` and `lock` through the same EUI icon cache used by the runtime bundle.
- Add a plain, accessible root Error Boundary so a synchronous render failure cannot leave a blank root.
- Pin Node 22.16.0, Vite 7.3.6 and `@vitejs/plugin-react` 5.0.4; declare the supported Node engine range.
- Upgrade `@testing-library/jest-dom` to 6.9.1.
- Limit Vitest discovery to `src/**/*.{test,spec}.{ts,tsx}` and run the six unit suites deterministically.
- Use one `main` landmark and a named application `header` landmark.
- Run browser tests with `contextOptions.reducedMotion = "reduce"`.
- Capture viewport screenshots rather than full-page screenshots.
- Use EUI's supported `restrictWidth={1800}` contract for P07.
- Correct macOS/Linux, PowerShell and Command Prompt fixture startup instructions.

## Final results

- Dependency installation: PASS
- ESLint: PASS
- TypeScript project build: PASS
- Vitest: PASS — 6 files, 21 tests
- Vite production build: PASS
- Playwright functional and visual tests: PASS — 9 cases
- Axe checks: PASS for Ready, Filter Builder and Export Modal
- Runtime regression guard: PASS — non-empty `#root`, zero captured `pageerror` and console-error events
- Visual evidence: PASS — 12 screenshots with exact D1080, D2K and D4K dimensions

## Remaining risks

- `[DISCOVER]` The EUI registry is intentionally explicit. Every newly introduced EUI icon must be registered and exercised by a browser path.
- `[DISCOVER]` The repository still has no committed package lockfile; direct dependencies are exact, but transitive resolution is not frozen.
- `[BLOCKED]` Production event API, policy engine, Saved View backend, export worker, audit store and authoritative rehydration service remain unavailable.
- `[USER-CHOICE]` P07 reviewer acceptance is still required before starting P05.
- Route-level code splitting remains a production performance follow-up.
