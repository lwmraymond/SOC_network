# Kibana fidelity design QA

Date: 2026-07-22

## Scope

- Baseline: 42 canonical routes from P01 through P42.
- Reference: authenticated Kibana 9.3.6 screens captured from the development V100 environment.
- Implementation target: Elastic EUI 106 with a Borealis-dark visual language.
- Source captures and comparison composites remain local-only because they contain environment data.

## Reference-to-implementation comparisons

| Kibana reference | Local surface | Result |
| --- | --- | --- |
| Home / global chrome | P01 Security Operations Overview | Two-level chrome, left navigation, canvas, typography and compact controls aligned. |
| Security Alerts | P05 Alert Queue | Query toolbar, metric strip and full-width compact triage table aligned; narrow three-column table compression removed. |
| Discover | P08 Asset Inventory | Dense filter/table workflow retained; document-level overflow removed and the canonical table owns horizontal overflow. |
| Stack Management | P22 ITSM Settings | Local settings navigation plus full-width resource/editor workbench aligned; editor wrapping and clipped copy removed. |
| Stack Management / Users | P37 Users | Search, compact metrics, dense governance table and detail panels aligned. |
| Dev-oriented work surface | P32 Script Workbench | Monaco editor changed to dark mode to match the application canvas. |

## Shared design checks

- Default color mode is dark; `?theme=light` remains available.
- Header is 48 px; context bar is 40 px; primary navigation is 224 px.
- Panels use flat Borealis surfaces, 1 px borders, 4 px radius and no decorative shadows.
- Body copy, labels, metadata and headings use separate density and contrast roles.
- Navigation labels wrap instead of clipping.
- Tables remain dense but keep their overflow inside the owning panel.
- Reduced-motion media handling is preserved.
- No Kibana screenshots, credentials, business data or Elastic trademarks were added to the implementation.

## Severity gate

- P0: none found.
- P1: none found.
- P2: none found in the reviewed P01, P05, P08, P22, P32, P37 and P42 archetypes.
- P3: P32 production chunk remains large because Monaco is bundled as a page-level dependency; this is a performance follow-up, not a visual blocker.

## Validation

- ESLint: pass.
- TypeScript: pass.
- Vitest: 24/24 pass.
- Production build: pass.
- Manual Chrome inspection: P01, P05, P08, P22, P32, P37 and P42 pass at the captured desktop viewport.
- Repository differentiation audit command is currently non-runnable because the package script references a missing `scripts/run-page-differentiation-audit.mjs`; no implementation file was removed by this change.
