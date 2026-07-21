# Existing Framework Baseline

Recorded: `2026-07-20T19:48:34+08:00`

## Existing project

- Repository root: `lwmraymond/SOC_network`
- Branch: `agent/page-differentiation-audit`
- Starting commit: `6d5d08851ce6d3dcfdd2fac678b7b854affdd61e`
- Package manager: `npm@10.9.2`
- Node requirement: `^20.19.0 || >=22.12.0`
- Existing start command: `VITE_ENABLE_FIXTURES=true npm run dev`
- Existing build command: `npm run build`

## Existing framework locations

- Application entry: `src/main.tsx`
- Existing App Shell, Top Bar, Sidebar and Router: `src/App.tsx`
- Existing page directory: `src/pages/`
- Existing workflow directory: `src/workflows/`
- Existing component directory: `src/components/`
- Existing fixture/prototype directory: `src/prototype/`
- Existing page registry and navigation metadata: `src/catalog/pageSpecs.ts`
- Existing workflow registry: `src/catalog/workflowSpecs.ts`
- Existing EUI Theme entry: `src/theme.tsx` (`PlatformThemeProvider` + `EuiProvider`)
- Existing page switching: React Router `Routes`, `pageSpecs`, `workflowSpecs`, and existing Sidebar `NavLink` entries

## Scope conclusions

- New React application required: **NO**
- New App Shell required: **NO**
- New Router required: **NO**
- New Sidebar required: **NO**
- New Theme required: **NO**
- Backend implementation required: **NO**

This baseline only records the existing framework. It does not authorize framework replacement or infrastructure expansion.
