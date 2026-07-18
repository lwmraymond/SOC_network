# EUI Icon / Vite Black-Screen Investigation

Date: 2026-07-18

Status: `ROOT CAUSE VERIFIED / FIX IMPLEMENTED / CI VERIFICATION PENDING`

## Symptom

- Vite development server starts normally and returns HTTP 200.
- CSS and EUI styles load.
- React starts, but required EUI icons reject during dynamic loading.
- The affected browser session can end with an empty or unusable `#root`, observed as a black screen.

Observed errors:

```text
Module not found in bundle: ./assets/logo_elastic
Module not found in bundle: ./assets/search
Module not found in bundle: ./assets/arrow_down
```

## Verified root cause

EUI 106 loads named icons from `EuiIconClass` with an extensionless expression equivalent to:

```text
./assets/ + typeToPathMap[iconType]
```

For example, the runtime requests `./assets/logo_elastic`.

Vite dependency pre-bundling transforms the EUI icon directory into a dynamic-import map whose keys include the JavaScript extension, for example:

```text
./assets/logo_elastic.js
./assets/search.js
./assets/arrow_down.js
```

The extensionless runtime lookup therefore does not match the generated map key, and Vite's generated helper throws `Module not found in bundle`.

The three initial failures originate indirectly from:

- `EuiHeaderLogo` → `logoElastic`
- `EuiFieldSearch` → `search`
- `EuiSelect` → `arrowDown`

P07 overlays additionally require `cross` and `lock`, so registering only the first three icons would leave later flyout/modal paths exposed to the same defect.

## Reproduction evidence

A minimal EUI 106 + Vite 7.3.6 application was built with the same shell controls.

Without explicit icon registration, runtime evaluation produced failures for:

```text
./assets/logo_elastic
./assets/search
./assets/arrow_down
```

With the explicit cache bootstrap, the same application rendered five required SVG icons synchronously and produced no runtime errors in the available inline-browser check.

Managed browser policy blocks direct HTTP and file navigation in the agent sandbox (`ERR_BLOCKED_BY_ADMINISTRATOR`), so repository-level navigation, Playwright and visual evidence remain delegated to GitHub Actions.

## Implemented fix

`src/euiIcons.ts` imports the actual EUI ES icon modules and calls `appendIconComponentCache` before React renders. The initial registry contains:

```text
logoElastic
search
arrowDown
cross
lock
```

The cache function is imported from the exact EUI ES icon module used by the root EUI bundle. Importing it from `@elastic/eui` is not valid at runtime in EUI 106 because the root ES index does not export `appendIconComponentCache`, even though the aggregate declaration file exposes the symbol.

`src/types/eui-icon-assets.d.ts` supplies narrow declarations for these deep EUI module imports.

## Defensive fallback

`AppErrorBoundary` now prevents synchronous render failures from leaving an empty root and displays a plain, non-EUI, accessible recovery surface. It is defense in depth; it does not replace the icon-cache fix.

## Toolchain correction

The previous ranges could resolve Vite 7 while retaining `@vitejs/plugin-react` 4.5, whose peer range ends at Vite 6. The corrected direct versions are:

```text
vite 7.3.6
@vitejs/plugin-react 5.0.4
Node ^20.19.0 or >=22.12.0
```

`.nvmrc` pins Node 22.16.0 for development and CI. Direct package versions are exact to prevent the prior `^7.0.0` drift.

## Regression controls

- Unit test verifies the exact P07 icon registry and synchronous SVG rendering.
- Root error-boundary test verifies that a render failure does not leave an empty application.
- P07 Playwright now records `pageerror` and browser console errors, asserts `#root` is non-empty, and exercises filter, flyout and export overlays.
- CI uses the pinned Node runtime for quality and browser-gate jobs.

## Remaining items

- `[BLOCKED]` GitHub Actions must complete successfully before this fix is marked CI-verified.
- `[BLOCKED]` D1080/D2K/D4K screenshot artifacts remain dependent on the browser-gate run.
- `[DISCOVER]` Every future EUI icon introduced by P05 or later pages must be explicitly added to the registry or replaced by an application-level icon loading strategy verified against Vite.
