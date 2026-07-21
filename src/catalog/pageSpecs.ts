export type PageId =
  | 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P07' | 'P08' | 'P09' | 'P10' | 'P11'
  | 'P12' | 'P13' | 'P14' | 'P15' | 'P16' | 'P17' | 'P18' | 'P19' | 'P20' | 'P21' | 'P22'
  | 'P23' | 'P24' | 'P25' | 'P26' | 'P27' | 'P28' | 'P29' | 'P30' | 'P31' | 'P32' | 'P33'
  | 'P34' | 'P35';

export type PageGroup =
  | 'Dashboard'
  | 'Analyze'
  | 'Device'
  | 'Ticket System / ITSM'
  | 'AI Copilot'
  | 'SOC Agent'
  | 'Runtime Catalog'
  | 'Knowledge Base';

export type PageSpec = {
  id: PageId;
  title: string;
  route: string;
  group: PageGroup;
  archetype: string;
  primaryRole: string;
  primaryAction: string;
  kpis: string[];
  fields: string[];
  columns: string[];
  filters: string[];
  actions: string[];
};

type PageInput = Omit<PageSpec, 'kpis' | 'fields' | 'columns' | 'filters' | 'actions'> &
  Partial<Pick<PageSpec, 'kpis' | 'fields' | 'columns' | 'filters' | 'actions'>>;

const definePage = (page: PageInput): PageSpec => ({
  kpis: ['Open', 'At risk', 'Coverage', 'Freshness'],
  fields: ['title', 'status', 'severity', 'owner', 'updated_at', 'source'],
  columns: ['title', 'status', 'severity', 'owner', 'updated_at'],
  filters: ['Status', 'Severity', 'Owner', 'Source'],
  actions: [page.primaryAction],
  ...page,
});

export const pageSpecs: PageSpec[] = [
  definePage({
    id: 'P01', title: 'Security Operations Overview', route: '/dashboard/soc', group: 'Dashboard',
    archetype: 'Operational Dashboard + Attention Queue', primaryRole: 'SOC shift lead', primaryAction: 'Create case',
    kpis: ['Confirmed attacks', 'High-risk unassigned', 'SLA at risk', 'High-risk entities', 'Required-source coverage'],
    fields: ['title', 'classification', 'severity', 'owner', 'primary_entity', 'status', 'source'],
    columns: ['title', 'classification', 'severity', 'owner', 'primary_entity', 'status'],
  }),
  definePage({
    id: 'P02', title: 'Executive Wallboard', route: '/dashboard/executive', group: 'Dashboard',
    archetype: 'Executive Wallboard', primaryRole: 'CISO / business risk owner', primaryAction: 'Export management report',
    kpis: ['Business risk', 'Response capability', 'Coverage confidence'],
    fields: ['business_unit', 'business_risk', 'management_action', 'status', 'owner', 'updated_at'],
  }),
  definePage({
    id: 'P03', title: 'Platform Health', route: '/dashboard/platform-health', group: 'Dashboard',
    archetype: 'Operational Health Workbench', primaryRole: 'Platform SRE', primaryAction: 'Create platform incident',
    fields: ['affected_component', 'service', 'status', 'freshness_lag_ms', 'slo_burn_rate', 'owner'],
    columns: ['affected_component', 'service', 'status', 'freshness_lag_ms', 'slo_burn_rate', 'owner'],
    filters: ['Domain', 'Health', 'Source', 'Owner'],
  }),
  definePage({
    id: 'P04', title: 'Incidents & Cases', route: '/analyzer/cases', group: 'Analyze',
    archetype: 'Analyst Queue + Case Investigation', primaryRole: 'SOC analyst / case owner', primaryAction: 'Create case',
    fields: ['case_ref', 'title', 'severity', 'status', 'owner', 'primary_entity', 'last_activity_at'],
    columns: ['case_ref', 'title', 'severity', 'status', 'owner', 'last_activity_at'],
  }),
  definePage({
    id: 'P05', title: 'Alert Queue', route: '/analyzer/alerts', group: 'Analyze',
    archetype: 'Alert-group Queue + Evidence Preview', primaryRole: 'SOC L1/L2 analyst', primaryAction: 'Create case',
    fields: ['rule_ref', 'severity', 'event_count', 'primary_entity', 'status', 'owner', 'last_seen_at'],
    columns: ['rule_ref', 'severity', 'event_count', 'primary_entity', 'status', 'owner'],
    filters: ['Severity', 'Rule', 'Status', 'Owner'],
  }),
  definePage({
    id: 'P06', title: 'Response Actions', route: '/analyzer/response-actions', group: 'Analyze',
    archetype: 'Governed Action Queue', primaryRole: 'Response operator', primaryAction: 'Request action',
    fields: ['action_type', 'target', 'case_ref', 'approval_state', 'authoritative_status', 'risk', 'owner'],
    columns: ['action_type', 'target', 'case_ref', 'approval_state', 'authoritative_status', 'risk'],
    filters: ['Approval', 'Execution', 'Risk', 'Adapter'],
  }),
  definePage({
    id: 'P07', title: 'Event Search & Hunt', route: '/analyzer/search', group: 'Analyze',
    archetype: 'Query Workbench + Event Grid', primaryRole: 'Threat hunter', primaryAction: 'Queue export',
    fields: ['event_time', 'severity', 'source', 'host', 'user', 'action'],
    columns: ['event_time', 'severity', 'source', 'host', 'user', 'action'],
    filters: ['Time', 'Severity', 'Source', 'Host'],
  }),
  definePage({
    id: 'P08', title: 'Asset Inventory', route: '/devices/inventory', group: 'Device',
    archetype: 'Asset Queue', primaryRole: 'Asset / security operator', primaryAction: 'Add/register asset',
    kpis: ['Active assets', 'Unreconciled', 'Stale', 'Unowned critical', 'High exposure'],
    fields: ['display_name', 'asset_id', 'type', 'status', 'owner', 'source', 'last_seen_at', 'risk_score'],
    columns: ['display_name', 'asset_id', 'type', 'status', 'owner', 'last_seen_at', 'risk_score'],
    filters: ['Type', 'Lifecycle', 'Health', 'Owner', 'Source'],
  }),
  definePage({
    id: 'P09', title: 'Vulnerability Exposure', route: '/devices/vulnerabilities', group: 'Device',
    archetype: 'Exposure Analytics + Queue', primaryRole: 'Vulnerability manager', primaryAction: 'Create remediation item',
    kpis: ['Critical exploitable assets', 'Overdue exposures', 'Unverified matches', 'Mean high-risk age', 'Accepted risk'],
    fields: ['exposure_id', 'vulnerability_ref', 'asset_ref', 'cvss', 'exploitability', 'due_at', 'remediation', 'owner'],
    columns: ['vulnerability_ref', 'asset_ref', 'cvss', 'exploitability', 'due_at', 'remediation', 'owner'],
  }),
  definePage({
    id: 'P10', title: 'Vulnerability Matches', route: '/devices/vulnerability-matches', group: 'Device',
    archetype: 'Match Evidence Adjudication', primaryRole: 'Vulnerability analyst', primaryAction: 'Review selected matches',
    fields: ['match_id', 'advisory_ref', 'component_ref', 'match_confidence', 'match_method', 'version_range_result', 'status'],
    columns: ['advisory_ref', 'component_ref', 'match_confidence', 'match_method', 'version_range_result', 'status'],
    filters: ['Confidence', 'State', 'Method', 'Source'],
  }),
  definePage({
    id: 'P11', title: 'Remediation Queue', route: '/devices/remediation', group: 'Device',
    archetype: 'Remediation Portfolio + Execution Queue', primaryRole: 'Remediation owner', primaryAction: 'Plan remediation',
    fields: ['remediation_id', 'strategy', 'scope', 'stage', 'target_date', 'risk_reduction', 'change_ref', 'validation_state'],
    columns: ['strategy', 'scope', 'stage', 'target_date', 'risk_reduction', 'change_ref', 'owner'],
    filters: ['Stage', 'Due state', 'Owner', 'Strategy'],
  }),
  definePage({
    id: 'P12', title: 'Asset 360', route: '/devices/assets/:assetId', group: 'Device',
    archetype: 'Entity 360 Detail', primaryRole: 'SOC / asset investigator', primaryAction: 'Request response action',
    fields: ['display_name', 'asset_id', 'status', 'owner', 'risk_score', 'network_tuple', 'source', 'last_seen_at'],
    columns: ['display_name', 'status', 'owner', 'risk_score', 'source', 'last_seen_at'],
  }),
  definePage({
    id: 'P13', title: 'ITSM Overview', route: '/itsm/overview', group: 'Ticket System / ITSM',
    archetype: 'Service Operations Command + Attention Queue', primaryRole: 'Service operations lead', primaryAction: 'Create work item',
    fields: ['work_item_id', 'work_item_type', 'service', 'priority', 'sla_state', 'status', 'owner', 'sync_health'],
    columns: ['work_item_id', 'work_item_type', 'service', 'priority', 'sla_state', 'status', 'owner'],
  }),
  definePage({
    id: 'P14', title: 'Work Queues', route: '/itsm/queues', group: 'Ticket System / ITSM',
    archetype: 'Saved-view Queue + Preview Drawer', primaryRole: 'ITSM analyst', primaryAction: 'Save view',
    fields: ['work_item_id', 'work_item_type', 'summary', 'priority', 'sla_state', 'assignment_group', 'status'],
    columns: ['work_item_id', 'work_item_type', 'summary', 'priority', 'sla_state', 'assignment_group', 'status'],
    filters: ['Saved view', 'Type', 'SLA', 'Service', 'Owner'],
  }),
  definePage({
    id: 'P15', title: 'Requests & Service Catalog', route: '/itsm/requests', group: 'Ticket System / ITSM',
    archetype: 'Catalog Discovery + Fulfilment Workspace', primaryRole: 'Requester / fulfilment analyst', primaryAction: 'Submit request',
    fields: ['request_id', 'catalog_item', 'requester', 'beneficiary', 'request_status', 'approvals', 'fulfilment_owner', 'eta'],
    columns: ['request_id', 'catalog_item', 'requester', 'request_status', 'approvals', 'fulfilment_owner', 'eta'],
    filters: ['Catalog', 'Request state', 'Approval', 'Owner'],
  }),
  definePage({
    id: 'P16', title: 'Incident Management', route: '/itsm/incidents', group: 'Ticket System / ITSM',
    archetype: 'Incident Queue + Command Workspace', primaryRole: 'Incident commander', primaryAction: 'Create incident',
    fields: ['incident_id', 'title', 'service', 'priority', 'impact', 'sla_state', 'communication_state', 'owner'],
    columns: ['incident_id', 'title', 'service', 'priority', 'sla_state', 'communication_state', 'owner'],
  }),
  definePage({
    id: 'P17', title: 'Problem Management', route: '/itsm/problems', group: 'Ticket System / ITSM',
    archetype: 'Problem / Known Error Workbench', primaryRole: 'Problem manager', primaryAction: 'Create problem',
    fields: ['problem_id', 'title', 'service', 'recurrence_count', 'root_cause', 'workaround', 'known_error', 'phase', 'owner'],
    columns: ['problem_id', 'title', 'service', 'recurrence_count', 'phase', 'known_error', 'owner'],
  }),
  definePage({
    id: 'P18', title: 'Change Management', route: '/itsm/changes', group: 'Ticket System / ITSM',
    archetype: 'Change Queue + Calendar + CAB', primaryRole: 'Change manager', primaryAction: 'Create change',
    fields: ['change_id', 'title', 'service', 'change_window', 'collision', 'approval_state', 'rollback_readiness', 'owner'],
    columns: ['change_id', 'title', 'service', 'change_window', 'collision', 'approval_state', 'owner'],
  }),
  definePage({
    id: 'P19', title: 'Approvals & Tasks', route: '/itsm/approvals', group: 'Ticket System / ITSM',
    archetype: 'Governed Approval / Task Queue', primaryRole: 'Approver / task owner', primaryAction: 'Process selected decision',
    fields: ['approval_id', 'decision_type', 'target', 'requester', 'approver', 'policy_ref', 'sod_state', 'due_at', 'status'],
    columns: ['approval_id', 'decision_type', 'target', 'requester', 'sod_state', 'due_at', 'status'],
  }),
  definePage({
    id: 'P20', title: 'ITSM Analytics', route: '/itsm/analytics', group: 'Ticket System / ITSM',
    archetype: 'Analytics + Exact Data', primaryRole: 'Service analyst', primaryAction: 'Save analysis',
    kpis: ['Demand', 'SLA attainment', 'Resolution time', 'Backlog age', 'Reopen rate'],
    fields: ['service', 'type', 'status', 'duration', 'sla', 'owner', 'updated_at'],
    columns: ['service', 'type', 'status', 'duration', 'sla', 'owner'],
  }),
  definePage({
    id: 'P21', title: 'Reports & Exports', route: '/itsm/reports', group: 'Ticket System / ITSM',
    archetype: 'Report Jobs + Wizard', primaryRole: 'Report owner', primaryAction: 'Create report',
    fields: ['report_job_id', 'template', 'scope', 'status', 'progress', 'artifact_uri', 'checksum', 'delivery', 'expiry'],
    columns: ['report_job_id', 'template', 'scope', 'status', 'progress', 'delivery', 'expiry'],
  }),
  definePage({
    id: 'P22', title: 'ITSM Settings', route: '/itsm/settings', group: 'Ticket System / ITSM',
    archetype: 'Domain Settings', primaryRole: 'ITSM administrator', primaryAction: 'Create resource',
    fields: ['name', 'type', 'section', 'status', 'revision', 'updated_at', 'owner'],
    columns: ['name', 'type', 'section', 'status', 'revision', 'updated_at', 'owner'],
    filters: ['Section', 'Resource type', 'Status', 'Owner'],
  }),
  definePage({
    id: 'P23', title: 'Copilot Workspace', route: '/copilot', group: 'AI Copilot',
    archetype: 'Conversation + Evidence Workbench', primaryRole: 'SOC analyst', primaryAction: 'Send with evidence',
    fields: ['session', 'prompt', 'citation', 'tool', 'approval_state', 'freshness'],
    columns: ['session', 'status', 'owner', 'updated_at'],
  }),
  definePage({
    id: 'P24', title: 'Agent Fleet', route: '/agents', group: 'SOC Agent',
    archetype: 'Fleet Readiness + Rollout', primaryRole: 'Agent platform operator', primaryAction: 'Request rollout',
    fields: ['agent_id', 'status', 'version', 'capacity', 'pool', 'last_seen_at'],
    columns: ['agent_id', 'status', 'version', 'capacity', 'pool', 'last_seen_at'],
  }),
  definePage({
    id: 'P25', title: 'Task Dispatch', route: '/agents/tasks', group: 'SOC Agent',
    archetype: 'Scheduler + Attempt + Receipt', primaryRole: 'Automation operator', primaryAction: 'Dispatch task',
    fields: ['task_id', 'target', 'state', 'attempt', 'receipt', 'updated_at'],
    columns: ['task_id', 'target', 'state', 'attempt', 'updated_at'],
  }),
  definePage({
    id: 'P26', title: 'Agent Runtime Access', route: '/agents/runtime-access', group: 'SOC Agent',
    archetype: 'Effective Access Policy Workbench', primaryRole: 'Runtime security administrator', primaryAction: 'Publish policy',
    fields: ['policy', 'agent', 'capability', 'decision', 'revision', 'updated_at'],
    columns: ['policy', 'agent', 'capability', 'decision', 'revision'],
  }),
  definePage({
    id: 'P27', title: 'Runtime Catalog Overview', route: '/runtime', group: 'Runtime Catalog',
    archetype: 'Runtime Catalog Readiness + Dependency', primaryRole: 'Runtime platform owner', primaryAction: 'Create resource',
    fields: ['resource', 'type', 'readiness', 'dependency', 'consumer', 'owner'],
    columns: ['resource', 'type', 'readiness', 'dependency', 'owner'],
  }),
  definePage({
    id: 'P28', title: 'Data Sources & Integrations', route: '/runtime/data-sources', group: 'Runtime Catalog',
    archetype: 'Source Ingest + Mapping Recovery', primaryRole: 'Integration operator', primaryAction: 'Add data source',
    fields: ['source', 'health', 'ingest_rate', 'lag', 'rejections', 'mapping'],
    columns: ['source', 'health', 'ingest_rate', 'lag', 'rejections'],
  }),
  definePage({
    id: 'P29', title: 'Detection Rules', route: '/runtime/rules', group: 'Runtime Catalog',
    archetype: 'Detection Rule Authoring + Replay', primaryRole: 'Detection engineer', primaryAction: 'Create rule',
    fields: ['rule', 'language', 'status', 'revision', 'coverage', 'last_run_at'],
    columns: ['rule', 'language', 'status', 'revision', 'coverage'],
  }),
  definePage({
    id: 'P30', title: 'Event Schemas & Contracts', route: '/runtime/events', group: 'Runtime Catalog',
    archetype: 'Schema Tree + Compatibility Workbench', primaryRole: 'Data contract owner', primaryAction: 'Publish schema',
    fields: ['schema', 'field', 'type', 'required', 'compatibility', 'revision'],
    columns: ['schema', 'field', 'type', 'required', 'compatibility'],
  }),
  definePage({
    id: 'P31', title: 'Runtime Objects', route: '/runtime/objects', group: 'Runtime Catalog',
    archetype: 'Object Registry + Relationship Explorer', primaryRole: 'Runtime object owner', primaryAction: 'Create object',
    fields: ['object', 'schema', 'status', 'relation', 'binding', 'revision'],
    columns: ['object', 'schema', 'status', 'relation', 'revision'],
  }),
  definePage({
    id: 'P32', title: 'Script Workbench', route: '/runtime/script-workbench', group: 'Runtime Catalog',
    archetype: 'Executable Code + Runner Receipt', primaryRole: 'Automation developer', primaryAction: 'Run script',
    fields: ['script', 'language', 'runtime', 'status', 'receipt', 'updated_at'],
    columns: ['script', 'language', 'runtime', 'status', 'updated_at'],
  }),
  definePage({
    id: 'P33', title: 'Knowledge Sources', route: '/knowledge/sources', group: 'Knowledge Base',
    archetype: 'Source Sync + ACL + Citation', primaryRole: 'Knowledge administrator', primaryAction: 'Add source',
    fields: ['source', 'sync_status', 'acl', 'citation', 'freshness', 'owner'],
    columns: ['source', 'sync_status', 'acl', 'freshness', 'owner'],
  }),
  definePage({
    id: 'P34', title: 'Playbooks & Automation Templates', route: '/knowledge/playbooks', group: 'Knowledge Base',
    archetype: 'Visual Trigger + Condition + Action Graph', primaryRole: 'Automation designer', primaryAction: 'Create playbook',
    fields: ['playbook', 'trigger', 'condition', 'action', 'status', 'revision'],
    columns: ['playbook', 'trigger', 'status', 'revision', 'updated_at'],
  }),
  definePage({
    id: 'P35', title: 'Detection Notes', route: '/knowledge/detection-notes', group: 'Knowledge Base',
    archetype: 'Detection Knowledge Search + Authoring', primaryRole: 'Detection engineer', primaryAction: 'Create note',
    fields: ['note', 'technique', 'evidence', 'status', 'owner', 'updated_at'],
    columns: ['note', 'technique', 'status', 'owner', 'updated_at'],
  }),
];

export const pageGroups: PageGroup[] = [
  'Dashboard',
  'Analyze',
  'Device',
  'Ticket System / ITSM',
  'AI Copilot',
  'SOC Agent',
  'Runtime Catalog',
  'Knowledge Base',
];

export const pageSpecById = Object.fromEntries(pageSpecs.map((page) => [page.id, page])) as Record<string, PageSpec> & Record<PageId, PageSpec>;

export const routeForNavigation = (route: string) => route.replace(':assetId', 'asset-demo');
