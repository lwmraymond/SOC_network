# ITSM capability framework v2 validation evidence

Validation date: 2026-07-27  
Repository: `lwmraymond/SOC_network`  
Branch: `agent/itsm-ticket-capability-framework-v2`  
Base: `codex/p01-p42-density-fixes-20260723` at `99593521404fea5299659e4617c096c58aa60075`  
Draft PR: `#12`

This file is updated from the final successor-branch CI run. A run is not recorded as passing until both the quality and browser jobs complete successfully on the final documented HEAD.

## Validation commands

```text
npm ci --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright test tests/e2e/all-pages.smoke.spec.ts tests/e2e/itsm-capability-v2.spec.ts --workers=1
```

## Required evidence inventory

The browser suite must emit 48 PNG files:

```text
2 themes × 3 viewports × 4 work surfaces × 2 capture modes = 48
```

Expected root:

```text
artifacts/itsm-capability-screenshots/
  light/
    1440x900/{first-viewport,full-page}/
    2560x1440/{first-viewport,full-page}/
    3840x2160/{first-viewport,full-page}/
  dark/
    1440x900/{first-viewport,full-page}/
    2560x1440/{first-viewport,full-page}/
    3840x2160/{first-viewport,full-page}/
```

Each capture mode contains:

```text
ticket-conversation.png
sla-administration.png
automation-administration.png
notifications-inbound-mail.png
```

A root `manifest.sha256`, per-theme manifests and `manifest.summary` are generated in CI.

## Final result

Final HEAD, GitHub Actions run ID, command results, screenshot inspection findings and residual blockers are populated after the final run. Until then, this document intentionally makes no PASS claim.
