# P02 / P19 / P20 targeted design audit

Date: 2026-07-23
Viewport: 1280px wide
Mode: combined UX and visible accessibility review

## 1. P02 Executive Wallboard — information hierarchy

Health before: needs correction.

Evidence:
- `02-p02-executive-before.png`

Findings:
- The headline, contextual sentence, three KPIs, decision callout, data-confidence label, progress bar, and fixture disclaimer all competed within one hero.
- Critical-source confidence and data confidence repeated the same concept.
- The long headline consumed too much horizontal and vertical attention for an executive scan.

Correction:
- Shortened the headline and scope sentence.
- Kept the three decision-grade KPIs.
- Removed the duplicate confidence block and fixture disclaimer from the hero.
- Reduced hero padding and title scale while preserving the management decision.

Accepted result:
- `05-p02-executive-after.png`

## 2. P19 Approvals & Tasks — due-state background semantics

Health before: needs correction.

Evidence:
- `03-p19-approvals-before-viewport.png`

Findings:
- A timestamp was rendered inside an EUI status badge.
- The outlined badge background made metadata look like a state and obscured the actual urgency semantics.
- The fixture `due_at` value displaced the intended `Overdue / Due soon / On track` status.

Correction:
- Split due timestamp and due state into separate fields.
- Rendered the timestamp as quiet tabular metadata.
- Restored a semantic color badge for urgency.
- Added local horizontal ownership for the queue table.

Accepted result:
- `06-p19-approvals-after.png`

## 3. P20 ITSM Analytics — chart label occlusion

Health before: incorrect.

Evidence:
- `01-p20-analytics-before.png`

Findings:
- Repeated `Prior / Current` labels occupied the plotting area.
- Tall bars visually covered those labels.
- Alternating one label per time bucket incorrectly implied that each bucket represented only one series.

Correction:
- Replaced repeated plot labels with one two-series legend.
- Kept time labels below the plot.
- Added an automated `chart-label-mark-overlap` audit rule.

Accepted result:
- `04-p20-analytics-after.png`

## Evidence limits

Screenshots confirm hierarchy, clipping, contrast, and overlap at the tested viewport. Full keyboard, screen-reader, and zoom behavior still require dedicated interaction tests.
