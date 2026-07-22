# Kibana fidelity design QA

Date: 2026-07-22

## Source truth and implementation evidence

- Source truth: authenticated Kibana 9.3.6 screenshots in the local-only evidence root `../../references/kibana-2026-07-22`.
- Implementation captures: `../../references/kibana-2026-07-22/implementation-audit-round3`.
- Source references used side by side: `01-home`, `04-security-alerts`, `08-discover`, `11-stack-management`, and `12-users`.
- Comparison composites: `comparison-home-p01.png`, `comparison-alerts-p05.png`, `comparison-discover-p08.png`, `comparison-stack-p22.png`, and `comparison-users-p37.png`.
- Implementation scope: all 42 canonical routes, P01 through P42.
- Viewport: 1231 × 768 CSS pixels in desktop Chrome.
- Theme and density: dark mode, compact enterprise density, 100% browser zoom.
- State: fixture-backed prototype data; no live production data or credentials were added to the repository.

The local reference folder is intentionally not committed because the Kibana captures contain environment data.

## Full and focused evidence

- Full-mode implementation captures exist for every page not already covered by the earlier archetype review: `P02.jpeg` through `P41.jpeg` in `implementation-audit-round3`, with P01, P05, P08, P22, P32, P37, and P42 retained in the parent evidence folder.
- Final P23 full-mode evidence: `P23-fixed-final.jpeg`.
- Final P41 full-mode evidence: `P41-fixed.jpeg`.
- Focused-mode evidence: `P23-focused.jpeg` and `P41-focused.jpeg`.
- Focused/full toggle state was verified through the visible EUI switch on both P23 and P41.
- P41 `Mappings` tab interaction was verified after the layout correction; the selected state and mapping content rendered without clipping.

## Reference-to-implementation assessment

| Kibana reference | Local surface | Assessment |
| --- | --- | --- |
| Home / global chrome | P01 Security Operations Overview | Two-level chrome, compact header, left navigation, canvas hierarchy, and typography align with Borealis dark. |
| Security Alerts | P05 Alert Queue | Query toolbar, metric strip, and full-width compact triage table align; narrow three-column compression is removed. |
| Discover | P08 Asset Inventory | Dense filter/table workflow is retained; document-level overflow is removed and the table owns horizontal overflow. |
| Stack Management | P22 ITSM Settings | Local settings navigation and stacked editor workbench align; editor wrapping and clipped copy are removed. |
| Users | P37 Users | Search, compact metrics, governance table, and detail panels align with the management archetype. |
| Dev-oriented work surface | P32 Script Workbench | Monaco uses a dark editor surface consistent with the application canvas. |
| Assistant workbench | P23 Copilot Workspace | Transcript roles, times, message bodies, citations, and evidence rows now have explicit hierarchy and spacing. |
| Authentication management | P41 Authentication / LDAP / SSO | Both four-provider sequences remain fully visible at 1231 × 768 with no page-level horizontal clipping. |

## Comparison history

1. Initial implementation review found inconsistent generic-dashboard styling, excessive rounded cards, weak type hierarchy, and several dense or clipped work areas.
2. Borealis shell pass established the 48 px header, 40 px context bar, 224 px navigation, flat panels, compact controls, dark canvas, and differentiated text roles.
3. Archetype review corrected P05, P08, P22, P32, P37, and P42 against side-by-side Kibana evidence.
4. Full P01–P42 screenshot review found two remaining P2 defects: P23 transcript content visually concatenated, and P41 clipped the fourth Kibana login-provider card.
5. Final pass added structured P23 transcript/evidence rows and converted P41 provider chains to responsive ordered grids. New full and focused captures confirm both defects are resolved.

## Severity gate

- P0: none.
- P1: none.
- P2: none after the P23 and P41 corrections.
- P3: P32's Monaco page bundle remains approximately 2.57 MB after minification; this is a non-blocking performance follow-up.

## Validation

- Manual Chrome screenshot review: all 42 canonical routes reviewed at 1231 × 768.
- Manual interaction review: full/focused state on P23 and P41; P41 management tab switching.
- ESLint: passed.
- TypeScript project and E2E typecheck: passed.
- Vitest: 7 files and 24/24 tests passed.
- Production build: passed; only the existing P32 chunk-size warning remains.
- Differentiation audit: not runnable because `package.json` references a missing `scripts/run-page-differentiation-audit.mjs`; this baseline repository issue was not introduced or weakened by the visual work.

Final result: passed
