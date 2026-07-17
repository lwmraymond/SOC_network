# SOC Network

React/EUI implementation workspace for the SOC / ITSM redesign.

## Current gate

`G0 DISCOVERY COMPLETE / G1 FOUNDATION IN PROGRESS / PROTOTYPE ONLY`

The repository was empty at project discovery. The current shell and P07 Event Search & Hunt surface are proposed design foundations, not production API or schema claims.

## Run the interactive prototype

```bash
npm install
VITE_ENABLE_FIXTURES=true npm run dev
```

Open `/analyzer/search`.

Without `VITE_ENABLE_FIXTURES=true`, the page intentionally shows that the production event-search adapter is unavailable. Production builds do not fall back to fixture arrays.

## Validation

```bash
npm run typecheck
npm run test
npm run build
```

GitHub Actions runs typecheck, test and build on pushes and pull requests.

## Documentation

- `docs/soc-itsm-implementation/00_DISCOVERY_REPORT.md`
- `docs/soc-itsm-implementation/02_OPEN_DECISIONS.md`
- `docs/soc-itsm-implementation/03_ROUTE_AND_IA_CATALOG.md`

## Safety constraints

- Fixture data is isolated under `src/prototype/` and requires explicit development enablement.
- Mutation controls are disabled until real capability, validation, approval, receipt, audit and authoritative rehydration services exist.
- Parent-owned workflows do not become duplicate sidebar entries.
