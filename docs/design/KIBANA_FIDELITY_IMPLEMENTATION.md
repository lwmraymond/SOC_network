# Kibana Fidelity Implementation Map

## Reference archetypes

The local visual baseline contains 12 authenticated Kibana 9.3.6 states: home, Security onboarding, Security dashboards, Alerts, alert flyout, Cases, Rules, Discover, Fleet, Integrations, Stack Management and Users. Screenshots remain local and are not committed because they contain environment-specific operational content.

## Page mapping

| Kibana pattern | SOC Network pages | Shared treatment |
|---|---|---|
| Security dashboard | P01–P03, P13, P20, P36 | compact title/actions, KPI strip, bordered visualization grid, attention table |
| Alerts / rules queue | P04–P06, P08–P11, P14, P16–P19, P21, P24–P25, P29, P33, P35, P37–P39 | command/filter row, dense sortable table, semantic status, row actions |
| Discover workbench | P07, P30–P32 | data-view selector, query bar, resizable/structured side region, result grid |
| Entity / alert flyout | P12 and detail states across queue pages | right flyout, summary cards, overview/table/raw tabs, progressive sections |
| Integrations / catalog | P15, P27–P28, P34, P40 | search-first catalog, restrained cards, local filters, installed/readiness state |
| Fleet | P24–P26 | title/description, horizontal tabs, status banner, operational table |
| Stack Management | P22, P37–P42 | persistent management navigation, compact resource lists, workbench detail panel |
| AI workbench | P23 | evidence-first conversation, source/citation rail, governed action footer |

## Delivery order

1. Shared dark EUI shell and authentic Borealis token layer.
2. Page frame, metadata strip, panels, filters, tables and flyouts.
3. Dashboard and Analyze pages P01–P07.
4. Device and ITSM pages P08–P22.
5. Agent, Runtime, Knowledge, Projects and Administration P23–P42.
6. Browser screenshot comparison at the same viewport, then lint, typecheck, unit tests, build and route smoke tests.

## Acceptance rules

- No P0/P1/P2 visual issue: no overlap, clipping, unreadable contrast, broken focus, dead control or page-level overflow.
- The same component role has the same typography, spacing, border and interaction state across all 42 routes.
- Visual similarity is judged from side-by-side screenshots, not from component names or CSS alone.
