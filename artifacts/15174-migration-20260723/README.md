# 15174 → 5174 migration evidence

## Source inspection

The local `15174` deployment was inspected through its UI and production bundles:

- `TicketSystemApp-DNxTazC2.js`
- `SystemOverview-BnpI9bUl.js`
- `NetworkSocPage-COSnRFx1.js`

The source TicketSystem exposed Ticket Queue, Create Ticket, Ticket Detail, SLA and
Escalation, Evidence Sync, Reports, and Settings. Its create flow established the
useful three-stage contract adopted here: draft, preflight, and governed preview.

## Mapping

- `Network SOC` is a P01 view at `/dashboard/network-soc`; no P43 was added.
- `System Overview` is a P03 view at `/dashboard/system-overview`; no P44 was added.
- The governed Create Ticket workflow is shared by P13, P14, and P16.
- Existing canonical P01–P42 routes remain unchanged.

## EUI and 4K decisions

- The migrated surfaces use EUI panels, stats, badges, health indicators, progress
  bars, form rows, selects, callouts, buttons, and modal primitives.
- Content is capped at 1800px for 1920-class displays, 2240px for 2560-class
  displays, and 3040px at 3840px.
- At 4K, Network SOC adds parallel owner and handoff context instead of scaling
  typography or stretching rows.
- Tables and charts retain bounded row and chart heights; the document has no
  horizontal overflow at 1920, 2560, or 3840 widths.

## Evidence

- `network-soc-4k.png` — 3840×2160 viewport
- `system-overview-4k.png` — 3840×2160 viewport
- Canonical EUI strict audit: P0 0, P1 0, P2 0
- Build, lint, typecheck, and 24 tests passed

ChatGPT Extra High was used for a second-pass information-architecture review.
Its recommendations influenced the P01/P03 mapping, the three-stage ticket flow,
and the responsive maximum-width strategy. Final implementation and visual
acceptance were based on local runtime screenshots.
