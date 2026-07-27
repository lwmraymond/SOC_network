export type TicketKind = 'request' | 'incident' | 'problem' | 'change';
export type TicketStatus = 'draft' | 'new' | 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type CapabilityDecision = 'allow' | 'deny' | 'conditional' | 'unknown';
export type DeliveryState = 'queued' | 'accepted' | 'delivered' | 'failed' | 'partial' | 'unknown';
export type ViewState = 'loading' | 'ready' | 'empty' | 'filtered-empty' | 'error' | 'denied' | 'offline' | 'stale' | 'partial';

export type SortDirection = 'asc' | 'desc';
export type SortSpec = { field: string; direction: SortDirection };
export type CursorPage<T> = {
  items: T[];
  nextCursor?: string;
  previousCursor?: string;
  total?: number;
  partialFailures?: PartialFailure[];
  authoritativeAt: string;
};

export type ListQuery = {
  cursor?: string;
  limit?: number;
  filters?: Record<string, string | number | boolean | string[]>;
  sort?: SortSpec[];
  include?: string[];
};

export type VersionedResource = {
  id: string;
  version: string;
  etag?: string;
  createdAt: string;
  updatedAt: string;
};

export type PermissionCapability = {
  capability: string;
  decision: CapabilityDecision;
  reason?: string;
  obligations?: string[];
};

export type CapabilitySnapshot = {
  subjectId: string;
  permissions: PermissionCapability[];
  adapter: 'production' | 'development-fixture' | 'unavailable';
  authoritative: boolean;
  checkedAt: string;
};

export type ValidationIssue = {
  field?: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export type PartialFailure = {
  operation: string;
  resourceId?: string;
  code: string;
  message: string;
  retryable: boolean;
};

export type NormalizedApiError = {
  kind: 'unavailable' | 'permission' | 'validation' | 'conflict' | 'offline' | 'timeout' | 'partial' | 'unknown';
  message: string;
  status?: number;
  requestId?: string;
  retryable: boolean;
  validation?: ValidationIssue[];
  partialFailures?: PartialFailure[];
  currentVersion?: string;
};

export type MutationContext = {
  idempotencyKey: string;
  ifMatch?: string;
  expectedVersion?: string;
  reason?: string;
  clientRequestId?: string;
};

export type ImpactPreview = {
  operation: string;
  summary: string;
  affectedResources: { type: string; id: string; effect: string }[];
  permissions: PermissionCapability[];
  validation: ValidationIssue[];
  warnings: string[];
  authoritative: false;
  expiresAt: string;
};

export type QueuedReceipt = {
  receiptId: string;
  operation: string;
  state: 'queued' | 'accepted';
  submittedAt: string;
  requestId?: string;
  authoritative: false;
  refreshAfterMs?: number;
  partialFailures?: PartialFailure[];
};

export type AuthoritativeMutationResult<T> = {
  receipt: QueuedReceipt;
  resource?: T;
  authoritative: boolean;
  rehydratedAt?: string;
};

export type TicketReference = {
  id: string;
  kind: TicketKind;
  title: string;
};

export type TicketBase = VersionedResource & {
  kind: TicketKind;
  key: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  serviceId: string;
  serviceName: string;
  requesterId: string;
  assigneeId?: string;
  assignmentGroup?: string;
  tags: string[];
  permissions: PermissionCapability[];
  source: 'portal' | 'email' | 'api' | 'automation' | 'agent';
  sourceReference?: string;
  slaClockIds: string[];
};

export type ServiceRequestTicket = TicketBase & {
  kind: 'request';
  requestTypeId: string;
  requestTypeName: string;
  beneficiaryId?: string;
  dynamicFields: Record<string, string | number | boolean | string[]>;
  fulfilmentStage: 'intake' | 'approval' | 'fulfilment' | 'verification' | 'complete';
};

export type IncidentTicket = TicketBase & {
  kind: 'incident';
  impact: 'enterprise' | 'multiple_teams' | 'single_team' | 'individual';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  affectedObjectIds: string[];
  majorIncident: boolean;
  lifecycleStage: 'detect' | 'triage' | 'investigate' | 'restore' | 'monitor' | 'resolve';
};

export type ProblemTicket = TicketBase & {
  kind: 'problem';
  knownError: boolean;
  rcaStatus: 'not_started' | 'in_progress' | 'review' | 'approved';
  rootCause?: string;
  workaround?: string;
  linkedIncidentIds: string[];
  permanentFixChangeId?: string;
};

export type ChangeTicket = TicketBase & {
  kind: 'change';
  changeType: 'standard' | 'normal' | 'emergency';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  implementationWindow: { startsAt: string; endsAt: string; timezone: string };
  cabRequired: boolean;
  validationPlan: string;
  implementationPlan: string;
  rollbackPlan: string;
};

export type Ticket = ServiceRequestTicket | IncidentTicket | ProblemTicket | ChangeTicket;

export type TicketComment = VersionedResource & {
  ticketId: string;
  visibility: 'public' | 'internal';
  body: string;
  authorId: string;
  authorDisplayName: string;
  mentions: string[];
  attachmentIds: string[];
  source: 'web' | 'email' | 'api' | 'automation';
  sourceMessageId?: string;
  editedAt?: string;
};

export type TicketAttachment = VersionedResource & {
  ticketId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadState: 'placeholder' | 'uploading' | 'available' | 'failed' | 'quarantined';
  checksum?: string;
};

export type TicketRelation = VersionedResource & {
  ticketId: string;
  relationType: 'caused_by' | 'blocks' | 'blocked_by' | 'duplicates' | 'related_to' | 'implements' | 'fixed_by';
  target: TicketReference;
};

export type TicketApproval = VersionedResource & {
  ticketId: string;
  stage: string;
  approverId: string;
  decision: 'pending' | 'approved' | 'rejected' | 'cancelled';
  dueAt?: string;
  decidedAt?: string;
  rationale?: string;
};

export type TicketAuditEvent = VersionedResource & {
  ticketId: string;
  eventType: string;
  actorId: string;
  actorType: 'user' | 'service' | 'automation' | 'mailbox';
  summary: string;
  metadata: Record<string, string | number | boolean | null>;
  correlationId?: string;
};

export type BusinessCalendar = VersionedResource & {
  name: string;
  timezone: string;
  businessHours: { day: number; start: string; end: string }[];
  holidays: { date: string; name: string }[];
  status: 'draft' | 'published' | 'disabled';
};

export type SlaCondition = {
  event: string;
  expression?: string;
};

export type SlaPolicy = VersionedResource & {
  name: string;
  appliesTo: TicketKind[];
  priority: Priority[];
  calendarId: string;
  targetMinutes: number;
  start: SlaCondition[];
  pause: SlaCondition[];
  resume: SlaCondition[];
  stop: SlaCondition[];
  status: 'draft' | 'published' | 'disabled';
};

export type SlaClock = VersionedResource & {
  ticketId: string;
  policyId: string;
  state: 'not_started' | 'running' | 'paused' | 'met' | 'breached' | 'stopped';
  startedAt?: string;
  dueAt?: string;
  remainingSeconds?: number;
  elapsedSeconds: number;
  breachAt?: string;
  authoritativeAt: string;
};

export type EscalationRule = VersionedResource & {
  policyId: string;
  name: string;
  thresholdPercent: number;
  actions: { type: 'notify' | 'reassign' | 'create_task' | 'invoke_rule'; target: string }[];
  status: 'draft' | 'published' | 'disabled';
};

export type AutomationTemplate = VersionedResource & {
  name: string;
  category: string;
  description: string;
  latestVersionId: string;
  status: 'draft' | 'published' | 'deprecated';
};

export type AutomationNode = {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'approval' | 'delay';
  name: string;
  config: Record<string, unknown>;
};

export type AutomationRule = VersionedResource & {
  name: string;
  templateId?: string;
  trigger: AutomationNode;
  nodes: AutomationNode[];
  status: 'draft' | 'published' | 'paused' | 'disabled';
  publishedVersionId?: string;
};

export type AutomationVersion = VersionedResource & {
  ruleId: string;
  number: number;
  definition: AutomationRule;
  releaseNotes?: string;
  publishedAt?: string;
};

export type AutomationRun = VersionedResource & {
  ruleId: string;
  versionId: string;
  ticketId?: string;
  state: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'partial';
  dryRun: boolean;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  failure?: NormalizedApiError;
  auditCorrelationId: string;
};

export type NotificationProvider = VersionedResource & {
  name: string;
  kind: 'smtp' | 'webhook' | 'microsoft_graph';
  status: 'draft' | 'enabled' | 'disabled' | 'error';
  config: Record<string, string | number | boolean | undefined>;
  secretConfigured: boolean;
  lastTestAt?: string;
  lastTestState?: 'passed' | 'failed' | 'unknown';
};

export type NotificationRecipient = VersionedResource & {
  name: string;
  type: 'user' | 'group' | 'role' | 'address';
  address?: string;
  referenceId?: string;
  status: 'active' | 'disabled';
};

export type NotificationTemplate = VersionedResource & {
  name: string;
  channel: 'email' | 'webhook';
  subject: string;
  body: string;
  variables: string[];
  status: 'draft' | 'published' | 'disabled';
};

export type NotificationPolicy = VersionedResource & {
  name: string;
  event: string;
  templateId: string;
  providerId: string;
  recipientIds: string[];
  conditions: string[];
  status: 'draft' | 'published' | 'disabled';
};

export type NotificationDelivery = VersionedResource & {
  policyId: string;
  providerId: string;
  ticketId?: string;
  recipient: string;
  state: DeliveryState;
  providerMessageId?: string;
  attempts: number;
  lastError?: NormalizedApiError;
};

export type InboundMailbox = VersionedResource & {
  name: string;
  kind: 'imap' | 'microsoft_graph';
  address: string;
  status: 'draft' | 'enabled' | 'disabled' | 'error';
  folder?: string;
  secretConfigured: boolean;
  pollingMode: 'poll' | 'subscription';
  lastTestAt?: string;
  lastTestState?: 'passed' | 'failed' | 'unknown';
};

export type InboundRoutingRule = VersionedResource & {
  mailboxId: string;
  name: string;
  order: number;
  conditions: string[];
  action: 'create_ticket' | 'update_ticket' | 'ignore' | 'quarantine';
  ticketKind?: TicketKind;
  requestTypeId?: string;
  status: 'draft' | 'published' | 'disabled';
};

export type IngestionEvent = VersionedResource & {
  mailboxId: string;
  messageId: string;
  sender: string;
  subject: string;
  state: 'received' | 'matched' | 'created' | 'updated' | 'ignored' | 'quarantined' | 'failed';
  routingRuleId?: string;
  ticketId?: string;
  failure?: NormalizedApiError;
};

export type TicketBundle = {
  ticket: Ticket;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  relations: TicketRelation[];
  approvals: TicketApproval[];
  auditEvents: TicketAuditEvent[];
  slaClocks: SlaClock[];
};

export type TicketCreateInput = {
  kind: TicketKind;
  title: string;
  description: string;
  priority: Priority;
  serviceId: string;
  requesterId: string;
  assigneeId?: string;
  assignmentGroup?: string;
  fields: Record<string, unknown>;
};

export type TicketPatch = Partial<Omit<TicketBase, keyof VersionedResource | 'kind' | 'key' | 'permissions'>> & Record<string, unknown>;
export type CommentCreateInput = Pick<TicketComment, 'visibility' | 'body' | 'mentions' | 'attachmentIds'>;

export const ITSM_ENDPOINTS = {
  tickets: 'TBD /api/itsm/tickets',
  requests: 'TBD /api/itsm/requests',
  incidents: 'TBD /api/itsm/incidents',
  problems: 'TBD /api/itsm/problems',
  changes: 'TBD /api/itsm/changes',
  comments: 'TBD /api/itsm/tickets/{ticketId}/comments',
  attachments: 'TBD /api/itsm/tickets/{ticketId}/attachments',
  relations: 'TBD /api/itsm/tickets/{ticketId}/relations',
  approvals: 'TBD /api/itsm/tickets/{ticketId}/approvals',
  audit: 'TBD /api/itsm/tickets/{ticketId}/audit-events',
  slaPolicies: 'TBD /api/itsm/sla/policies',
  slaCalendars: 'TBD /api/itsm/sla/calendars',
  slaClocks: 'TBD /api/itsm/sla/clocks',
  slaEscalations: 'TBD /api/itsm/sla/escalations',
  automationTemplates: 'TBD /api/itsm/automation/templates',
  automationRules: 'TBD /api/itsm/automation/rules',
  automationVersions: 'TBD /api/itsm/automation/versions',
  automationRuns: 'TBD /api/itsm/automation/runs',
  notificationProviders: 'TBD /api/itsm/notifications/providers',
  notificationRecipients: 'TBD /api/itsm/notifications/recipients',
  notificationTemplates: 'TBD /api/itsm/notifications/templates',
  notificationPolicies: 'TBD /api/itsm/notifications/policies',
  notificationDeliveries: 'TBD /api/itsm/notifications/deliveries',
  inboundMailboxes: 'TBD /api/itsm/inbound/mailboxes',
  inboundRoutingRules: 'TBD /api/itsm/inbound/routing-rules',
  ingestionEvents: 'TBD /api/itsm/inbound/ingestion-events',
} as const;

export interface ItsmApiAdapter {
  getCapabilities(signal?: AbortSignal): Promise<CapabilitySnapshot>;

  listTickets(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<Ticket>>;
  getTicket(ticketId: string, signal?: AbortSignal): Promise<TicketBundle>;
  previewCreateTicket(input: TicketCreateInput, signal?: AbortSignal): Promise<ImpactPreview>;
  createTicket(input: TicketCreateInput, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<Ticket>>;
  previewUpdateTicket(ticketId: string, patch: TicketPatch, signal?: AbortSignal): Promise<ImpactPreview>;
  updateTicket(ticketId: string, patch: TicketPatch, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<Ticket>>;
  refreshTicket(ticketId: string, receiptId?: string, signal?: AbortSignal): Promise<TicketBundle>;

  listComments(ticketId: string, query: ListQuery, signal?: AbortSignal): Promise<CursorPage<TicketComment>>;
  previewCreateComment(ticketId: string, input: CommentCreateInput, signal?: AbortSignal): Promise<ImpactPreview>;
  createComment(ticketId: string, input: CommentCreateInput, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<TicketComment>>;
  createAttachmentPlaceholder(ticketId: string, filename: string, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<TicketAttachment>>;
  listRelations(ticketId: string, query: ListQuery, signal?: AbortSignal): Promise<CursorPage<TicketRelation>>;
  createRelation(ticketId: string, relation: Omit<TicketRelation, keyof VersionedResource | 'ticketId'>, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<TicketRelation>>;
  listApprovals(ticketId: string, query: ListQuery, signal?: AbortSignal): Promise<CursorPage<TicketApproval>>;
  decideApproval(ticketId: string, approvalId: string, decision: 'approved' | 'rejected', rationale: string, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<TicketApproval>>;
  listAuditEvents(ticketId: string, query: ListQuery, signal?: AbortSignal): Promise<CursorPage<TicketAuditEvent>>;

  listSlaPolicies(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<SlaPolicy>>;
  listBusinessCalendars(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<BusinessCalendar>>;
  listSlaClocks(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<SlaClock>>;
  listEscalationRules(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<EscalationRule>>;
  previewSlaPolicy(policy: SlaPolicy, signal?: AbortSignal): Promise<ImpactPreview>;
  saveSlaPolicy(policy: SlaPolicy, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<SlaPolicy>>;

  listAutomationTemplates(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<AutomationTemplate>>;
  listAutomationRules(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<AutomationRule>>;
  listAutomationVersions(ruleId: string, query: ListQuery, signal?: AbortSignal): Promise<CursorPage<AutomationVersion>>;
  listAutomationRuns(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<AutomationRun>>;
  previewAutomationRule(rule: AutomationRule, signal?: AbortSignal): Promise<ImpactPreview>;
  saveAutomationRule(rule: AutomationRule, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<AutomationRule>>;
  publishAutomationRule(ruleId: string, versionId: string, context: MutationContext, signal?: AbortSignal): Promise<QueuedReceipt>;
  dryRunAutomationRule(ruleId: string, input: Record<string, unknown>, context: MutationContext, signal?: AbortSignal): Promise<AutomationRun>;
  retryAutomationRun(runId: string, context: MutationContext, signal?: AbortSignal): Promise<QueuedReceipt>;
  cancelAutomationRun(runId: string, context: MutationContext, signal?: AbortSignal): Promise<QueuedReceipt>;

  listNotificationProviders(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<NotificationProvider>>;
  listNotificationRecipients(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<NotificationRecipient>>;
  listNotificationTemplates(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<NotificationTemplate>>;
  listNotificationPolicies(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<NotificationPolicy>>;
  listNotificationDeliveries(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<NotificationDelivery>>;
  saveNotificationProvider(provider: NotificationProvider, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<NotificationProvider>>;
  testNotificationProvider(providerId: string, context: MutationContext, signal?: AbortSignal): Promise<QueuedReceipt>;

  listInboundMailboxes(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<InboundMailbox>>;
  listInboundRoutingRules(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<InboundRoutingRule>>;
  listIngestionEvents(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<IngestionEvent>>;
  saveInboundMailbox(mailbox: InboundMailbox, context: MutationContext, signal?: AbortSignal): Promise<AuthoritativeMutationResult<InboundMailbox>>;
  testInboundMailbox(mailboxId: string, context: MutationContext, signal?: AbortSignal): Promise<QueuedReceipt>;
}
