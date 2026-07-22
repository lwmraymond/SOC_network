# SOC Network — Kibana Fidelity Design System

This file overrides the generic generated recommendation. The source of truth is the locally captured Kibana 9.3.6 UI plus the installed EUI Borealis dark tokens in `@elastic/eui` 106.0.0.

## Product direction

- Enterprise SOC/ITSM operations tool; dark mode is the default.
- Dense and calm, with one blue interaction accent and semantic status colors.
- Match Kibana's hierarchy, density, borders, tables, filter bars and flyouts without copying Elastic business data or trademark illustrations.
- Use EUI components and the repository's registered EUI icon set. Do not add emoji or handcrafted SVG icons.

## Core tokens

| Role | Value |
|---|---|
| Chrome / panel | `#0B1628` |
| Page background | `#07101F` |
| Raised / selected | `#172336` |
| Border | `#2B394F` |
| Form border | `#485975` |
| Heading | `#E3E8F2` |
| Body | `#CAD3E2` |
| Muted | `#8E9FBC` |
| Primary | `#61A2FF` |
| Primary background | `#0A2342` |
| Success | `#24C292` |
| Warning | `#FACB3D` |
| Risk | `#FF995E` |
| Danger | `#F6726A` |

## Typography

- Font: `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif`.
- Body: 14px/1.5; compact data and metadata: 12px; labels: 12–13px.
- Page title: 24px/32px, weight 600. Section title: 16–20px, weight 600.
- Use tabular figures for timestamps, counts, scores, durations and percentages.
- Avoid all-caps table headings and long dense paragraphs.

## Spacing and geometry

- 4px base radius. Do not introduce pill-shaped cards or large decorative radii.
- 4/8/12/16/24/32px spacing scale.
- 48px global header, 40px context/breadcrumb bar, 224px desktop sidebar. The extra width prevents the longer SOC/ITSM labels from clipping.
- Page gutter: 20px desktop, 12px mobile. Section gap: 16px; panel grid gap: 12px.
- Panels are flat with a 1px border and no decorative shadow.

## Components

- Header: global search centered, utility actions right, no oversized branding.
- Context bar: navigation toggle, current area, page title and canonical page ID.
- Sidebar: compact 32px rows, clear selected state, consistent placement on every page.
- Filters: compressed controls in a single command row; overflow goes into menus instead of wrapping into visual noise.
- Tables: 36px header, approximately 40px row, subtle separators, 12px data text, hover surface `rgba(255,255,255,.06)`.
- KPI panels: numeric value first, short label second, no decorative gradients or glow.
- Flyouts: right-side, bordered, same surface as panels, clear close action, overview/table/raw tabs where appropriate.
- Empty states: centered explanation plus one recovery action. Loading longer than 300ms uses reserved skeleton space.

## Interaction and accessibility

- Visible 2px primary focus ring; full keyboard operation.
- Interactive targets remain at least 32px on dense desktop surfaces and 44px on touch layouts.
- Color is never the only status signal; include text and/or icon.
- Motion is 90–250ms and must respect `prefers-reduced-motion`.
- No horizontal page overflow. Wide data grids may have an explicitly labelled internal scroller.

## Responsive behavior

- `>= 992px`: persistent 224px sidebar.
- `768–991px`: 190px sidebar and compressed header search.
- `< 768px`: sidebar becomes an overlay controlled by the context-bar button; global search is hidden; page gutters become 12px.

## Forbidden patterns

- Decorative neon/cyberpunk effects, gradients, glass blur or oversized shadows.
- Lora/Raleway or other marketing typography.
- Random per-page hex colors, radii or spacing.
- Dead icon buttons, hover-only actions, hidden focus rings, fake controls, or clipped text without a disclosure path.
