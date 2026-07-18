# SOC Network

React/EUI implementation workspace for the SOC / ITSM redesign.

## Current gate

`G0 DISCOVERY COMPLETE / G1 FOUNDATION IN PROGRESS / P07 PROTOTYPE ONLY`

The repository was empty at project discovery. The current shell and P07 Event Search & Hunt surface are proposed design foundations, not production API or schema claims.

## Runtime prerequisites

Use Node `22.16.0` from `.nvmrc`, or another version accepted by the package engine:

```text
^20.19.0 || >=22.12.0
```

Node `20.16.0` is not supported by the pinned Vite 7 toolchain. Vite and `@vitejs/plugin-react` are pinned to compatible versions to prevent dependency drift.

## Install

```bash
npm install
```

## Run the interactive prototype

### macOS / Linux / Git Bash

```bash
VITE_ENABLE_FIXTURES=true npm run dev
```

### Windows PowerShell

```powershell
$env:VITE_ENABLE_FIXTURES='true'
npm run dev
```

### Windows Command Prompt

```cmd
set VITE_ENABLE_FIXTURES=true
npm run dev
```

Open `http://localhost:5173/analyzer/search`.

Without `VITE_ENABLE_FIXTURES=true`, the page intentionally shows that the production event-search adapter is unavailable. Production builds do not fall back to fixture arrays.

## Validation

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

GitHub Actions runs quality checks and the P07 browser gate on pull requests. Local Chromium execution may be restricted in managed sandbox environments.

## EUI icon bootstrap

EUI 106 uses dynamic icon imports that are incompatible with Vite dependency pre-bundling for the paths required by this prototype. `src/euiIcons.ts` explicitly registers the shell and P07 icons before React renders. New EUI icons introduced by later pages must be added to that registry and covered by tests.

## Documentation

- `docs/soc-itsm-implementation/00_DISCOVERY_REPORT.md`
- `docs/soc-itsm-implementation/02_OPEN_DECISIONS.md`
- `docs/soc-itsm-implementation/03_ROUTE_AND_IA_CATALOG.md`
- `docs/soc-itsm-implementation/validation/EUI_ICON_VITE_BLACK_SCREEN_REPORT.md`

## Safety constraints

- Fixture data is isolated under `src/prototype/` and requires explicit development enablement.
- Mutation controls remain governed by capability, validation, receipt, audit and authoritative rehydration contracts.
- Parent-owned workflows do not become duplicate sidebar entries.
