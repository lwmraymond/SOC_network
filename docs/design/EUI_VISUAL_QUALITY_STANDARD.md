# EUI visual quality standard

This standard defines the measurable visual baseline for P01–P42. It follows the Elastic UI baseline grid, typography, color, panel, and table guidance rather than inventing a separate dashboard style.

Primary references:

- [EUI text](https://eui.elastic.co/docs/components/display/text/)
- [EUI typography utilities](https://eui.elastic.co/docs/getting-started/theming/utilities/typography/)
- [EUI color tokens](https://eui.elastic.co/docs/getting-started/theming/tokens/colors/)
- [EUI color utilities](https://eui.elastic.co/docs/getting-started/theming/utilities/colors)
- [EUI panels](https://eui.elastic.co/docs/components/containers/panel/)
- [EUI table layout guidelines](https://eui.elastic.co/docs/components/tables/layout-guidelines/)

## Baseline grid and typography

All vertical rhythm lands on a 4 px baseline grid.

| Role | Font size | Line height | Weight | Required spacing |
| --- | ---: | ---: | ---: | ---: |
| Page title (`h1`) | 24 px | 32 px | 600 | 4–8 px before description |
| Section title (`h2`) | 16 px | 24 px | 600 | 12 px after title block |
| Panel title (`h3`) | 14 px | 20 px | 600 | 8 px after title block |
| Body | 13 px | 20 px | 400 | 8 px between paragraphs/items |
| Supporting text | 12 px | 16 px | 400 | 4 px from its owning label |
| Metadata | 11 px | 16 px | 400–500 | Must not carry primary meaning alone |
| Table header | 11 px | 16 px | 600 | 8 px horizontal cell padding |
| Table body | 12 px | 16–20 px | 400 | Minimum 40 px row height |

Rules:

- Normal text must have a computed `line-height / font-size` ratio of at least 1.35. Body copy targets 1.5–1.54.
- Do not use a filled rectangle as a substitute for a page, section, or panel title.
- Status badges remain intrinsic-width labels. A badge must not stretch to fill its flex or grid track.
- Adjacent list or queue rows require at least 4 px visible separation; 8 px is the default.
- Paragraphs and descriptions should normally stay below 72 characters per line.

## Color and contrast

- Normal text must meet WCAG 2.x contrast ratio 4.5:1; large text and UI boundaries must meet 3:1.
- Use text-specific semantic colors for text. Do not reuse a bright background token as a text color.
- Text on yellow/warning backgrounds must use dark ink, never white or a pale gray.
- Text on dark semantic backgrounds uses ghost/white text only when the computed contrast passes.
- Selected rows and navigation items use a dark subdued surface in dark mode, not the light-theme fallback `#f5f7fa` or `#fff`.
- Warning and danger meaning must also have copy or an icon; color is not the only signal.

## Surfaces and title regions

- The page title sits directly on the Kibana canvas. It does not get a separate dark card, gradient, or colored stripe.
- Page-header content height target: 80–104 px at desktop. Empty space after the description must not exceed 24 px.
- Default panel padding is 16 px; compact operational panels may use 12 px.
- Panel nesting is limited to two visually identical levels. A third nested level must use a transparent or subdued treatment.
- Panel borders are 1 px and use the shared Borealis border token. Radius is 4 px.

## Tables, queues, and control rows

- Tables own their horizontal overflow. The document must not overflow horizontally.
- Table rows are at least 40 px high. Dense queue rows are at least 36 px high.
- Text columns receive a practical `min-width`; do not compress identifiers, labels, and descriptions into overlapping text.
- Control rows use an 8 px minimum gap and a 32 px minimum control height.
- A visible text node must not overlap another visible text node by more than 1 px.
- Truncated content requires ellipsis or an accessible full-value affordance.

## Automated gates

The visual metrics audit must fail a route for any of these conditions:

- normal-text contrast below 4.5:1;
- large-text or visible control-boundary contrast below 3:1;
- heading, label, or cell text overlap greater than 1 px;
- document-level horizontal overflow greater than 1 px;
- unclamped visible text with `scrollWidth > clientWidth + 1`;
- normal text with line-height ratio below 1.35;
- table row below 36 px, or standard table row below 40 px;
- adjacent repeated rows separated by less than 4 px;
- badge width above 50% of its parent or above 240 px;
- page-header height above 112 px, or more than 24 px blank space below its last visible text line;
- dark-mode selected surface resolving to a light fallback color.

The audit runs at 1231 × 768 and 1440 × 900 in dark mode. Table-focused checks also run at 1200 px. Results are emitted as JSON and Markdown so regressions can be reviewed by page and metric.
