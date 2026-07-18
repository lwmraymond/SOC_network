# P07 Test Report

Date: 2026-07-18

Status: `PASS FOR PROTOTYPE GATE`

## Automated coverage

### Unit

Six Vitest files and 21 tests cover:

- normalized query parsing, validation and URL serialization;
- nested filters, permission masking and dependencies;
- Saved View conflicts/defaults/URL overrides;
- opaque cursor pagination and classified errors;
- unified permission decisions and hidden-count protection;
- export job, receipt, audit, idempotency and revision conflict;
- P07 reducer behavior;
- explicit EUI icon registration;
- root Error Boundary behavior.

### Browser integration

Playwright covers:

- P07 route load and non-empty application root;
- query input to URL state;
- filter builder interaction;
- event detail flyout;
- async export modal and queued receipt;
- browser history;
- error, denied, stale and partial states;
- zero page errors and zero browser console errors;
- exact D1080, D2K and D4K screenshots;
- no uncontrolled root horizontal overflow.

### Accessibility

Axe passes for:

- Ready state;
- Advanced Filter Builder;
- Export Modal.

The browser context uses reduced motion, and the tests cover keyboard Escape/overlay closure, named landmarks, accessible dialog labels, non-color status text and a table fallback for the histogram.

## Results

- ESLint: PASS
- TypeScript project build: PASS
- Vitest: PASS — 6 files, 21 tests
- Vite production build: PASS
- Playwright: PASS — 9 cases
- Axe: PASS
- Visual evidence generation: PASS — 12 PNGs
- GitHub Actions run: `29630430056`
- Verified head: `6f8427da2204d07f72aae664b0d28a5807748062`

No tests were deleted, skipped, weakened or converted to no-op assertions.

## Scope note

`[BLOCKED]` These tests validate the isolated prototype adapters and contracts. They do not validate a production event API, policy service, Saved View service, export worker or authoritative receipt store because those services were not supplied.
