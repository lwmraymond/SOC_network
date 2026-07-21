# EUI typography system

This prototype follows Elastic UI content and layout conventions: concise sentence-case labels, one primary page title, limited supporting copy, and progressive disclosure for secondary detail.

| Role | EUI primitive | Size / weight | Purpose |
| --- | --- | --- | --- |
| Page title | `EuiPageTemplate.Header` | 28px / 700 | One unique page name |
| Page description | Header `description` | 14px / 400 | One short functional archetype |
| Section title | `EuiTitle size="s"` | 16px / 650 | Starts a decision or workflow region |
| Panel title | `EuiTitle size="xs"` | 14px / 650 | Names one card or inspector |
| Metric value | `EuiStat` | 24px / 650 | Primary quantitative signal |
| Body | `SocText role="body"` | 14px / 400 | Necessary explanation or instruction |
| Supporting | `SocText role="supporting"` | 13px / 400 | One short sentence beneath a title |
| Label | EUI form label / `SocText role="label"` | 12px / 600 | Field, column, or control name |
| Metadata | `EuiBadge` / `SocText role="metadata"` | 12px / 400 | IDs, timestamps, source and scope |
| Eyebrow | `SocText role="eyebrow"` | 11px / 600 | Page category above a compact visual label |
| Status | `EuiHealth` / `EuiBadge` | 12px / 500 | State with semantic color and text |
| Action | `EuiButton` | 14px / 500 | Verb-first task label |

## Density rules

- Do not repeat the page title in breadcrumbs, cards, or empty states.
- Keep page descriptions to one line and supporting copy to one short sentence.
- Show only operational status in the main flow. Put role, timezone, implementation notes, and debug controls under **Page details**.
- Use section spacing and title weight—not extra explanatory paragraphs—to establish hierarchy.
- Keep labels in sentence case and actions in verb + noun form.
- Prefer `EuiToolTip`, `EuiPopover`, or help content for definitions that are not needed during every task.
- Preserve full technical detail inside flyouts, inspectors, receipts, and error recovery states where it affects a decision.
