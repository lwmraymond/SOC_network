# Route and IA Catalog

Status: `[DESIGN]` provisional because no pre-existing router was found.

## Sidebar order and primary routes

1. Dashboard — P01 `/dashboard/soc`; P02 `/dashboard/executive`; P03 `/dashboard/platform-health`
2. Analyze — P04 `/analyzer/cases`; P05 `/analyzer/alerts`; P06 `/analyzer/response-actions`; P07 `/analyzer/search`
3. Device — P08 `/devices/inventory`; P09 `/devices/vulnerabilities`; P10 `/devices/vulnerability-matches`; P11 `/devices/remediation`; P12 `/devices/assets/:assetId`
4. Ticket System / ITSM — P13 `/itsm/overview`; P14 `/itsm/queues`; P15 `/itsm/requests`; P16 `/itsm/incidents`; P17 `/itsm/problems`; P18 `/itsm/changes`; P19 `/itsm/approvals`; P20 `/itsm/analytics`; P21 `/itsm/reports`; P22 `/itsm/settings`
5. AI Copilot — P23 `/copilot`
6. SOC Agent — P24 `/agents`; P25 `/agents/tasks`; P26 `/agents/runtime-access`
7. Runtime Catalog — P27 `/runtime`; P28 `/runtime/data-sources`; P29 `/runtime/rules`; P30 `/runtime/events`; P31 `/runtime/objects`; P32 `/runtime/script-workbench`
8. Knowledge Base — P33 `/knowledge/sources`; P34 `/knowledge/playbooks`; P35 `/knowledge/detection-notes`
9. Project Management — P36 `/projects/responses`
10. User Management — P37 `/admin/users`; P38 `/admin/roles`; P39 `/admin/permissions`
11. Setting — P40 `/settings`; P41 `/settings/authentication`; P42 `/settings/theme`

## Parent-owned workflows (no sidebar entry)

- H01 Asset Detail — `/devices/assets/:assetId` (shared with P12)
- H02 Work Item Detail — `/itsm/work-items/:type/:id`
- H03 Create Request — `/itsm/requests/new?catalogItemId=:id`
- H04 Major Incident Command — `/itsm/incidents/:id/command`
- H05 Problem / Known Error Detail — `/itsm/problems/:id`
- H06 Change / CAB Detail — `/itsm/changes/:id`
- H07 Approval Detail — `/itsm/approvals/:id`
- H08 Catalog Item Detail — `/itsm/catalog/:id`
- H09 Project Detail — `/projects/responses/:id`
- H10 User Detail — `/admin/users/:id`
- H11 Platform Health Service Logs — `/dashboard/platform-health/services/:id/logs`
- H12 Platform Health Queues — `/dashboard/platform-health/queues`
- H13 Platform Health Connectors — `/dashboard/platform-health/connectors`
- H14 My Settings — `/me/settings` via user menu
- H15 Device Status View — `/devices/inventory?view=status`
- H16 Copilot Evidence Context — `/copilot?panel=evidence`
- H17 Copilot Tool Approval — `/copilot?panel=approval`
- H18 Runtime Events View — `/analyzer/search?view=runtime-events`
- H19 Project Milestones View — `/projects/responses?view=milestones`

## Navigation contract

Canonical path identifies the work surface. Query state carries normalized query, filters, time, sort, columns, density, page/cursor, selected row and overlay identity where safe. Secrets, credentials, raw sensitive evidence and tokens must never enter the URL. Parent state is restored on browser back/forward; full-page workflows use canonical URLs; flyouts restore focus to their trigger.
