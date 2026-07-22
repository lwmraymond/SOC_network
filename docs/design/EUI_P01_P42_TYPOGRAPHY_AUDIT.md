# P01–P42 typography and density audit

Audit date: 2026-07-22  
Viewport: 1231 × 768, Chrome, dark mode  
Evidence: local-only `../../references/kibana-2026-07-22/title-audit-2026-07-22/before`

Shared failures visible across the catalog:

1. `EuiBadge` elements placed directly inside growing flex items stretch into title-like color bars.
2. Several page-specific styles fall back to light-theme values such as `#f5f7fa` and `#fff`; P40 visibly renders white selected rows with white text.
3. Warning actions use yellow fill with pale text, producing weak contrast and confusing warning state with primary action hierarchy.
4. Page-header title regions are taller than Kibana's title treatment and leave unnecessary empty canvas under descriptions.
5. Many custom queues and inspectors do not apply the 4 px baseline grid, explicit line heights, or minimum row spacing.

## Page-by-page result

| Page | Status | Main visible issue | Required correction |
| --- | --- | --- | --- |
| P01 | Needs spacing | Shift-decision rows and coverage blocks are tightly packed. | Apply 20 px body line height and 8 px repeated-row gap. |
| P02 | Needs title fix | Warning badge stretches into a full-width bar above the decision title. | Keep status intrinsic-width; leave title on panel canvas. |
| P03 | Needs title fix | Danger status stretches across the dependency title; telemetry nodes are cramped. | Compact badge; add 8 px node rhythm. |
| P04 | Needs title fix | Risk badge becomes a red title strip; analyst queue is dense. | Compact badge; 8 px queue gaps and 16/20 text roles. |
| P05 | Needs density fix | Alert grid headers and rows are compressed at desktop width. | Preserve 40 px rows and practical text-column minimums. |
| P06 | Needs contrast/title fix | Destructive badge forms a title strip; yellow action has pale text. | Compact badge; use blue primary action or dark warning text. |
| P07 | Minor | Event rows are readable but metadata sits close to identifiers. | Enforce 4 px label-to-metadata separation. |
| P08 | Needs density fix | Filter controls and asset rows compress descriptive copy. | 8 px control gap; 40 px rows; owned horizontal overflow. |
| P09 | Needs density fix | Risk drivers and business-service status cells are too small. | Minimum 16 px metadata line height and 4 px row gap. |
| P10 | Needs density fix | Match queue, detail, and conflict ledger compete in narrow columns. | Increase repeated-row spacing and allow owned panel scrolling. |
| P11 | Needs density fix | Remediation table and change-window labels are crowded. | 40 px table rows and 8 px label/value gap. |
| P12 | Minor | Asset tabs and small definition blocks are close together. | 8 px tab/content separation and 20 px body line height. |
| P13 | Needs density fix | Service health rows and typed-object summaries are compressed. | 8 px repeated-row gap and 36 px minimum row height. |
| P14 | Needs density fix | Queue table uses narrow rows and small metadata. | 40 px table rows; 11/16 metadata minimum. |
| P15 | Needs density fix | Catalog-card descriptions and taxonomy counts sit tightly. | 20 px body line height and 12 px card content rhythm. |
| P16 | Needs title fix | Selected incident status stretches into a red title strip. | Compact badge; preserve plain section title. |
| P17 | Needs title/density fix | Warning status stretches above the review title; evidence rows are tight. | Compact badge and 8 px evidence-row gap. |
| P18 | Needs density fix | Calendar labels and conflict inspector entries are compressed. | 16 px metadata line height and 4–8 px item separation. |
| P19 | Needs contrast fix | Approval detail uses warning actions and dense policy rows. | Blue primary action; dark warning text; 8 px policy rows. |
| P20 | Needs title fix | Metric revision badge stretches into a blue title bar. | Intrinsic-width revision badge; title remains plain text. |
| P21 | Needs density fix | Report catalog and job table descriptions are tightly stacked. | 20 px body line height and 40 px table rows. |
| P22 | Needs spacing | Editor labels, dependency rows, and publish bar are crowded. | 8 px form rhythm and distinct 12 px workbench sections. |
| P23 | Needs density fix | Session rail remains dense and citation/tool sections compete vertically. | 8 px session gaps; 16 px metadata line height; 12 px section rhythm. |
| P24 | Needs density fix | Fleet grid and capability inspector pack labels and values. | 36 px minimum rows and 4 px label/value separation. |
| P25 | Needs title/density fix | Error badge stretches over the selected task; ID lists are tightly wrapped. | Compact badge and explicit list line-height/gaps. |
| P26 | Needs density fix | Policy grid contains closely packed subjects, capabilities, and badges. | 40 px rows and 8 px inline item gap. |
| P27 | Critical density | Readiness rail and detail inspector visibly concatenate labels and values. | Convert raw inline text to structured rows with 4/8 px gaps. |
| P28 | Needs density fix | Source-health rows and firewall lists are too compact. | 36–40 px rows and 16 px metadata line height. |
| P29 | Needs title/density fix | Status badge becomes a red bar; authoring/replay columns are cramped. | Compact badge and 12 px workbench column rhythm. |
| P30 | Needs density fix | Schema tree, diff table, and impact entries are compressed. | 8 px tree rows and practical table-column minimums. |
| P31 | Needs density fix | Registry rows and object inspector labels are closely stacked. | 40 px registry rows and 4 px definition separation. |
| P32 | Needs density fix | Script rail labels and editor inspector metadata are tight. | 8 px script-item gap and 16 px metadata line height. |
| P33 | Needs density fix | Source library and detection-change rows are compressed. | 36 px rows and 8 px content group separation. |
| P34 | Needs density fix | Automation nodes and inspector fields use very small spacing. | 8 px node padding rhythm and 16 px supporting line height. |
| P35 | Needs density fix | Notebook rows, research content, and technique ledger are crowded. | 8 px list gaps and 20 px body line height. |
| P36 | Needs density fix | Project rail metadata and milestone tags are packed together. | 8 px project-card rhythm and wrapped tags with 6 px gap. |
| P37 | Needs density/contrast fix | Governance rows contain several adjacent badges and narrow text columns. | 40 px rows; 6 px badge gap; semantic text contrast. |
| P38 | Needs contrast fix | Selected role treatment can resolve through light fallbacks. | Map all EUI fallback aliases to dark Borealis tokens. |
| P39 | Needs contrast/density fix | Selected surfaces use light fallbacks and grant rows are compressed. | Dark selected surface; 40 px rows and 8 px control gaps. |
| P40 | Critical contrast | Selected category is white with white text; inspector text is densely wrapped. | Replace light fallbacks; enforce 4.5:1 contrast and 20 px body line height. |
| P41 | Needs density fix | Provider metadata, health cells, and table rows remain compact. | 40 px rows; 8 px health-cell gap; 16 px metadata line height. |
| P42 | Needs contrast/spacing fix | Theme selection can use light fallback surfaces; preview controls are close. | Dark selected surfaces and 8–12 px control rhythm. |

## Priority order

- P0/P1: P40 selected-surface contrast; any yellow/pale text combination; document overflow or text overlap found by the metrics script.
- P2: stretched status bars used as titles; P27 concatenated inspector text; rows below the density minimum.
- P3: remaining page-header height and minor metadata rhythm differences.
