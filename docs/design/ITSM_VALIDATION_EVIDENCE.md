# ITSM capability framework validation evidence

Validation date: 2026-07-27  
Repository: `lwmraymond/SOC_network`  
Branch: `agent/itsm-ticket-capability-framework`  
Baseline: `codex/kibana-42page-visual` at `fa466957dbdc997f965e93d1b7ba709b33d5c197`  
Validated implementation snapshot: `abf32a9a8fa2e47f6021d91b74a8307b7348b962`  
GitHub Actions run: `30235450230`

This evidence supplements `ITSM_TARGET_CAPABILITY_GAP_ANALYSIS.md`. A final documentation-only descendant of the validated implementation snapshot must pass the same workflow before delivery.

## 1. Static quality gates

The `quality` job completed successfully with the following locked-repository commands:

```text
npm ci --no-audit --no-fund
npm run lint -- --format json --output-file artifacts/validation/lint.json
npm run typecheck
npm run test
npm run build
```

Results:

| Gate | Result | Evidence |
| --- | --- | --- |
| ESLint | PASS | zero lint errors in `lint.json` |
| TypeScript | PASS | application and `tsconfig.e2e.json` type checks completed |
| Unit / contract tests | PASS | 8 test files, 30 tests |
| Production build | PASS | Vite production bundle completed; fixture-boundary scanner remained enabled |
| Quality status-file gate | PASS | lint, typecheck, test and build exit codes were all zero |

The existing large-chunk warning remains advisory and is not introduced as a hidden success condition.

## 2. Browser and route gates

The `browser` job completed successfully with:

```text
npx playwright install --with-deps chromium
npx playwright test tests/e2e/all-pages.smoke.spec.ts tests/e2e/itsm-capability-routes.spec.ts --workers=1
```

Coverage includes:

- the existing canonical P01–P42 route smoke suite;
- Request, Incident, Problem and Change rendering through one shared Ticket Detail Workspace;
- required type-specific fields and tabs for all four ticket types;
- explicit development-fixture watermark and absence of production fallback messaging while fixture mode is enabled;
- runtime-error collection;
- document-level horizontal-overflow checks;
- capability-context flow, intrinsic-width fixture badge and Conversation panel top-alignment assertions;
- four critical capability pages at every target viewport.

## 3. Screenshot evidence

Deterministic full-page screenshots and `manifest.sha256` are emitted under:

```text
artifacts/itsm-capability-screenshots/1440x900/
artifacts/itsm-capability-screenshots/2560x1440/
artifacts/itsm-capability-screenshots/3840x2160/
```

Each directory contains:

```text
ticket-conversation.png
sla-administration.png
automation-administration.png
notifications-inbound-mail.png
```

All 12 images were individually inspected. Findings:

- no text overlap, clipped labels or document-level horizontal overflow;
- capability context remains in normal flow and no longer covers tabs or editor headings;
- the development-fixture badge retains intrinsic width instead of becoming a saturated full-row strip;
- Conversation thread and composer align at the top at 1440, 2560 and 3840 widths;
- EUI panels, tabs, forms, code blocks, badges and callouts remain readable at all target sizes;
- 4K content remains constrained by the page maximum rather than stretching controls across the full canvas.

## 4. Defects found and corrected by validation

| Defect | Detection | Correction |
| --- | --- | --- |
| Responsive `EuiSideNav` requested an unregistered `apps` icon and entered the application error boundary | Playwright runtime-error gate at a wide viewport | Explicitly import/register `apps`; extend the existing strict EUI icon bootstrap contract |
| Sticky capability context covered tabs/editor headings; sticky composer started below the conversation thread | Individual 1440 screenshot inspection | Remove sticky positioning and keep both panels in document flow |
| Development fixture badge stretched into a high-saturation full-width strip | Individual screenshot inspection | Prevent the first context flex item from growing |
| Initial layout assertion incorrectly rejected EUI's in-flow `position: relative` panel | Playwright geometry gate | Reject only out-of-flow `absolute`, `fixed` and `sticky`; retain bounding-box non-overlap as the semantic check |

## 5. Production boundary and remaining blockers

No Go, Java, Python, database, scheduler, queue, SMTP, IMAP or Microsoft Graph service was added or modified.

The following remain `BLOCKED/TBD` pending authoritative backend contracts:

- canonical endpoint paths and API versioning;
- ticket/custom-field/catalog schemas and authoritative persistence;
- identity/group/capability policy decisions;
- comment persistence, attachment upload and malware scanning;
- SLA scheduling and business-calendar calculation;
- automation execution, connector idempotency and compensation;
- SMTP/Microsoft Graph notification transport;
- IMAP/Microsoft Graph ingestion and thread matching;
- authoritative audit ledger and retention policy.

Development fixtures continue to require `import.meta.env.DEV && VITE_ENABLE_FIXTURES === 'true'`. Preview, queued, accepted, simulated and dry-run results remain explicitly non-authoritative and are never presented as production completion.
