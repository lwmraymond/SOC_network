# EUI Icon / Vite Black-Screen Investigation

Date: 2026-07-18

Status: `ROOT CAUSE VERIFIED / FIX IMPLEMENTED / CI PASS`

## Symptom

The Vite development server returned HTTP 200 and styles loaded, but React became empty or unusable after these runtime failures:

```text
Module not found in bundle: ./assets/logo_elastic
Module not found in bundle: ./assets/search
Module not found in bundle: ./assets/arrow_down
```

The initial paths were requested indirectly by:

- `EuiHeaderLogo` → `logoElastic`
- `EuiFieldSearch` → `search`
- `EuiSelect` → `arrowDown`

## Verified root cause

EUI 106 resolves named icons with an extensionless expression equivalent to:

```text
./assets/ + typeToPathMap[iconType]
```

Vite 7.3.6 dependency pre-bundling creates a dynamic-import map with keys containing `.js`:

```text
./assets/logo_elastic.js
./assets/search.js
./assets/arrow_down.js
```

The extensionless EUI lookup does not match those generated keys. Vite's generated helper therefore throws `Module not found in bundle` before the required icon can render.

A minimal EUI/Vite reproduction produced the same three errors. After explicit cache registration, the same runtime rendered all required SVG components without a page error.

## Implemented fix

`src/euiIcons.ts` imports the EUI ES icon modules and invokes `appendIconComponentCache` before React renders. The initial registry contains:

```text
logoElastic
search
arrowDown
cross
lock
```

`cross` and `lock` are included because P07 flyouts/modals use them after initial shell render. Registering only the three startup icons would have moved the same failure into overlay interaction.

The cache function is imported from `@elastic/eui/es/components/icon/icon.js`, the module used by the runtime EUI bundle. The aggregate root declaration advertises the function, but the EUI 106 root ES runtime does not export it. Narrow declarations for the deep imports live in `src/types/eui-icon-assets.d.ts`.

## Defensive recovery

`AppErrorBoundary` now wraps the application root and renders a non-EUI, accessible recovery surface on synchronous render failure. This is defense in depth; the icon-cache bootstrap is the actual root-cause fix.

## Toolchain corrections

```text
Node: 22.16.0 via .nvmrc
Supported engine: ^20.19.0 || >=22.12.0
Vite: 7.3.6
@vitejs/plugin-react: 5.0.4
```

Direct versions are exact, eliminating the previous Vite/plugin peer mismatch and Vite range drift. Windows fixture commands are documented separately for PowerShell and Command Prompt.

## Regression controls

- Unit test verifies the exact icon registry and synchronous SVG rendering.
- Root Error Boundary test verifies that a render exception does not leave an empty root.
- Playwright asserts a non-empty `#root`, records `pageerror` and browser console errors, and exercises query, filter, flyout, export and receipt paths.
- Axe passes after correcting landmarks and stabilizing the reduced-motion path.
- Production build, browser gate and exact-dimension visual evidence pass in GitHub Actions.

## Verification evidence

- Head: `6f8427da2204d07f72aae664b0d28a5807748062`
- Workflow run: `29630430056`
- `quality`: PASS
- `p07-browser-gate`: PASS
- Visual artifact: `8425293385`
- Artifact digest: `sha256:af2cf9d93fc2afb9dc62e583c7aeeb29635faa649433a204c0608c2e8286faba`

## Future rule

`[DISCOVER]` Every EUI icon introduced by P05 or later work must either be added to the explicit registry and exercised in Playwright, or the application must adopt a different icon-loading strategy proven compatible with the active Vite build.
