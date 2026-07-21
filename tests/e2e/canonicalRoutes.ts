export type CanonicalRoute = {
  id: string;
  path: string;
  title: string;
};

export const canonicalRoutes: CanonicalRoute[] = [
  { id: 'P01', path: '/dashboard/soc', title: 'Security Operations Overview' },
  { id: 'P02', path: '/dashboard/executive', title: 'Executive Wallboard' },
  { id: 'P03', path: '/dashboard/platform-health', title: 'Platform Health' },
  { id: 'P04', path: '/analyzer/cases', title: 'Incidents & Cases' },
  { id: 'P05', path: '/analyzer/alerts', title: 'Alert Queue' },
  { id: 'P06', path: '/analyzer/response-actions', title: 'Response Actions' },
  { id: 'P07', path: '/analyzer/search', title: 'Event Search & Hunt' },
  { id: 'P08', path: '/devices/inventory', title: 'Asset Inventory' },
  { id: 'P09', path: '/devices/vulnerabilities', title: 'Vulnerability Exposure' },
  { id: 'P10', path: '/devices/vulnerability-matches', title: 'Vulnerability Matches' },
  { id: 'P11', path: '/devices/remediation', title: 'Remediation Queue' },
  { id: 'P12', path: '/devices/assets/asset-demo', title: 'Asset 360' },
  { id: 'P13', path: '/itsm/overview', title: 'ITSM Overview' },
  { id: 'P14', path: '/itsm/queues', title: 'Work Queues' },
  { id: 'P15', path: '/itsm/requests', title: 'Requests & Service Catalog' },
  { id: 'P16', path: '/itsm/incidents', title: 'Incident Management' },
  { id: 'P17', path: '/itsm/problems', title: 'Problem Management' },
  { id: 'P18', path: '/itsm/changes', title: 'Change Management' },
  { id: 'P19', path: '/itsm/approvals', title: 'Approvals & Tasks' },
  { id: 'P20', path: '/itsm/analytics', title: 'ITSM Analytics' },
  { id: 'P21', path: '/itsm/reports', title: 'Reports & Exports' },
  { id: 'P22', path: '/itsm/settings', title: 'ITSM Settings' },
  { id: 'P23', path: '/copilot', title: 'Copilot Workspace' },
  { id: 'P24', path: '/agents', title: 'Agent Fleet' },
  { id: 'P25', path: '/agents/tasks', title: 'Task Dispatch' },
  { id: 'P26', path: '/agents/runtime-access', title: 'Agent Runtime Access' },
  { id: 'P27', path: '/runtime', title: 'Runtime Catalog Overview' },
  { id: 'P28', path: '/runtime/data-sources', title: 'Data Sources & Integrations' },
  { id: 'P29', path: '/runtime/rules', title: 'Detection Rules' },
  { id: 'P30', path: '/runtime/events', title: 'Event Schemas & Contracts' },
  { id: 'P31', path: '/runtime/objects', title: 'Runtime Objects' },
  { id: 'P32', path: '/runtime/script-workbench', title: 'Script Workbench' },
  { id: 'P33', path: '/knowledge/sources', title: 'Knowledge Sources' },
  { id: 'P34', path: '/knowledge/playbooks', title: 'Playbooks & Automation Templates' },
  { id: 'P35', path: '/knowledge/detection-notes', title: 'Detection Notes' },
  { id: 'P36', path: '/projects/responses', title: 'Response Projects' },
  { id: 'P37', path: '/admin/users', title: 'Users' },
  { id: 'P38', path: '/admin/roles', title: 'Roles' },
  { id: 'P39', path: '/admin/permissions', title: 'Permissions' },
  { id: 'P40', path: '/settings', title: 'Platform Settings Directory' },
  { id: 'P41', path: '/settings/authentication', title: 'Authentication / LDAP / SSO' },
  { id: 'P42', path: '/settings/theme', title: 'Theme & Accessibility' },
];

export const p0Routes = canonicalRoutes.filter(({ id }) => ['P36', 'P38', 'P39', 'P42'].includes(id));