import type {
  AuthoritativeMutationResult,
  AutomationRule,
  AutomationRun,
  AutomationTemplate,
  AutomationVersion,
  BusinessCalendar,
  CapabilitySnapshot,
  CommentCreateInput,
  CursorPage,
  EscalationRule,
  ImpactPreview,
  InboundMailbox,
  InboundRoutingRule,
  IngestionEvent,
  ItsmApiAdapter,
  NormalizedApiError,
  NotificationDelivery,
  NotificationPolicy,
  NotificationProvider,
  NotificationRecipient,
  NotificationTemplate,
  QueuedReceipt,
  SlaClock,
  SlaPolicy,
  Ticket,
  TicketApproval,
  TicketAttachment,
  TicketAuditEvent,
  TicketBundle,
  TicketComment,
  TicketCreateInput,
  TicketPatch,
  TicketRelation,
  VersionedResource,
} from './contracts';

const NOW = '2026-07-27T08:00:00.000Z';
const LATER = '2026-07-27T10:00:00.000Z';
const versioned = (id: string, version = '1'): VersionedResource => ({
  id,
  version,
  etag: `W/"${id}-${version}"`,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: NOW,
});

const permissions = [
  { capability: 'ticket.read', decision: 'allow' as const },
  { capability: 'ticket.comment.public', decision: 'allow' as const },
  { capability: 'ticket.comment.internal', decision: 'conditional' as const, obligations: ['member_of_assignment_group'] },
  { capability: 'ticket.update', decision: 'conditional' as const, obligations: ['impact_preview', 'if_match'] },
];

const ticketBase = {
  description: 'Fixture-backed record used to exercise the shared ITSM workspace without implying production persistence.',
  status: 'in_progress' as const,
  priority: 'P2' as const,
  serviceId: 'svc-identity',
  serviceName: 'Identity service',
  requesterId: 'user-requester-01',
  assigneeId: 'user-analyst-01',
  assignmentGroup: 'Identity operations',
  tags: ['customer-impacting', 'reviewed'],
  permissions,
  source: 'portal' as const,
  slaClockIds: ['clock-response', 'clock-resolution'],
};

export const fixtureTickets: Ticket[] = [
  {
    ...versioned('req-6201', '7'), ...ticketBase,
    kind: 'request', key: 'REQ-6201', title: 'Privileged access for investigation',
    requestTypeId: 'catalog-privileged-access', requestTypeName: 'Privileged access', beneficiaryId: 'user-analyst-01',
    dynamicFields: { duration: '8 hours', targetRole: 'SOC responder', justification: 'Investigate identity compromise' },
    fulfilmentStage: 'approval',
  },
  {
    ...versioned('inc-7001', '12'), ...ticketBase,
    kind: 'incident', key: 'INC-7001', title: 'Identity login outage', source: 'email', sourceReference: '<msg-7001@example.invalid>',
    impact: 'enterprise', urgency: 'critical', affectedObjectIds: ['ci-idp-prod', 'svc-identity'], majorIncident: true, lifecycleStage: 'restore',
  },
  {
    ...versioned('prb-3104', '5'), ...ticketBase,
    kind: 'problem', key: 'PRB-3104', title: 'Recurring identity provider token failures', priority: 'P3',
    knownError: true, rcaStatus: 'review', rootCause: 'Token cache invalidation race under regional failover.',
    workaround: 'Drain the affected region and recycle token cache workers.', linkedIncidentIds: ['inc-7001', 'inc-6992'], permanentFixChangeId: 'chg-4208',
  },
  {
    ...versioned('chg-4208', '9'), ...ticketBase,
    kind: 'change', key: 'CHG-4208', title: 'Deploy identity token cache fix', priority: 'P3', status: 'pending',
    changeType: 'normal', riskLevel: 'high', implementationWindow: { startsAt: '2026-07-29T02:00:00.000Z', endsAt: '2026-07-29T04:00:00.000Z', timezone: 'Asia/Taipei' },
    cabRequired: true, validationPlan: 'Run synthetic login and token refresh tests in every region.',
    implementationPlan: 'Deploy canary, validate, then roll through remaining regions.', rollbackPlan: 'Restore previous image and invalidate the new cache schema.',
  },
];

export const fixtureComments: TicketComment[] = [
  { ...versioned('comment-01'), ticketId: 'inc-7001', visibility: 'public', body: 'We are investigating elevated login failures. The next update is due in 30 minutes.', authorId: 'user-analyst-01', authorDisplayName: 'A. Chen', mentions: [], attachmentIds: [], source: 'web' },
  { ...versioned('comment-02'), ticketId: 'inc-7001', visibility: 'internal', body: '@identity-oncall confirms the regional token cache is unhealthy. Preparing failover.', authorId: 'user-commander-01', authorDisplayName: 'M. Lin', mentions: ['identity-oncall'], attachmentIds: ['attachment-01'], source: 'web' },
  { ...versioned('comment-03'), ticketId: 'inc-7001', visibility: 'public', body: 'Inbound email received from the service desk and associated by message thread.', authorId: 'mailbox-01', authorDisplayName: 'Service desk mailbox', mentions: [], attachmentIds: [], source: 'email', sourceMessageId: '<msg-7001@example.invalid>' },
];

export const fixtureAttachments: TicketAttachment[] = [
  { ...versioned('attachment-01'), ticketId: 'inc-7001', filename: 'identity-failover-plan.txt', contentType: 'text/plain', sizeBytes: 2048, uploadState: 'placeholder' },
];

export const fixtureRelations: TicketRelation[] = [
  { ...versioned('relation-01'), ticketId: 'inc-7001', relationType: 'caused_by', target: { id: 'prb-3104', kind: 'problem', title: 'Recurring identity provider token failures' } },
  { ...versioned('relation-02'), ticketId: 'prb-3104', relationType: 'fixed_by', target: { id: 'chg-4208', kind: 'change', title: 'Deploy identity token cache fix' } },
];

export const fixtureApprovals: TicketApproval[] = [
  { ...versioned('approval-01'), ticketId: 'chg-4208', stage: 'CAB review', approverId: 'group-cab', decision: 'pending', dueAt: '2026-07-28T08:00:00.000Z' },
  { ...versioned('approval-02'), ticketId: 'req-6201', stage: 'Role owner', approverId: 'user-role-owner', decision: 'approved', decidedAt: '2026-07-27T06:30:00.000Z', rationale: 'Time-bound access approved.' },
];

export const fixtureAuditEvents: TicketAuditEvent[] = [
  { ...versioned('audit-01'), ticketId: 'inc-7001', eventType: 'ticket.created', actorId: 'mailbox-01', actorType: 'mailbox', summary: 'Incident created from inbound email.', metadata: { source: 'email', mailbox: 'service-desk@example.invalid' }, correlationId: 'corr-7001' },
  { ...versioned('audit-02'), ticketId: 'inc-7001', eventType: 'assignment.changed', actorId: 'rule-major-incident', actorType: 'automation', summary: 'Assignment group proposed by automation.', metadata: { from: 'Service desk', to: 'Identity operations', authoritative: false }, correlationId: 'corr-7001' },
];

export const fixtureCalendars: BusinessCalendar[] = [
  { ...versioned('calendar-24x7', '4'), name: 'Global 24×7', timezone: 'UTC', businessHours: [0,1,2,3,4,5,6].map((day) => ({ day, start: '00:00', end: '23:59' })), holidays: [], status: 'published' },
  { ...versioned('calendar-tw-business', '8'), name: 'Taipei business hours', timezone: 'Asia/Taipei', businessHours: [1,2,3,4,5].map((day) => ({ day, start: '09:00', end: '18:00' })), holidays: [{ date: '2026-09-25', name: 'Public holiday' }], status: 'published' },
];

export const fixtureSlaPolicies: SlaPolicy[] = [
  { ...versioned('sla-p1-response', '9'), name: 'P1 first response', appliesTo: ['incident'], priority: ['P1'], calendarId: 'calendar-24x7', targetMinutes: 15, start: [{ event: 'ticket.created' }], pause: [], resume: [], stop: [{ event: 'first.public.reply' }], status: 'published' },
  { ...versioned('sla-p2-resolution', '6'), name: 'P2 resolution', appliesTo: ['incident','problem'], priority: ['P2'], calendarId: 'calendar-24x7', targetMinutes: 240, start: [{ event: 'ticket.opened' }], pause: [{ event: 'ticket.pending', expression: 'pending_reason = requester' }], resume: [{ event: 'ticket.in_progress' }], stop: [{ event: 'ticket.resolved' }], status: 'published' },
  { ...versioned('sla-request-fulfilment', '3'), name: 'Standard request fulfilment', appliesTo: ['request'], priority: ['P3','P4'], calendarId: 'calendar-tw-business', targetMinutes: 960, start: [{ event: 'request.approved' }], pause: [{ event: 'request.waiting_requester' }], resume: [{ event: 'request.fulfilment_resumed' }], stop: [{ event: 'request.fulfilled' }], status: 'draft' },
];

export const fixtureSlaClocks: SlaClock[] = [
  { ...versioned('clock-response', '22'), ticketId: 'inc-7001', policyId: 'sla-p1-response', state: 'breached', startedAt: '2026-07-27T06:00:00.000Z', dueAt: '2026-07-27T06:15:00.000Z', elapsedSeconds: 1500, breachAt: '2026-07-27T06:15:00.000Z', authoritativeAt: NOW },
  { ...versioned('clock-resolution', '18'), ticketId: 'inc-7001', policyId: 'sla-p2-resolution', state: 'running', startedAt: '2026-07-27T06:00:00.000Z', dueAt: LATER, remainingSeconds: 7200, elapsedSeconds: 7200, authoritativeAt: NOW },
];

export const fixtureEscalations: EscalationRule[] = [
  { ...versioned('escalation-80', '2'), policyId: 'sla-p2-resolution', name: 'Escalate at 80%', thresholdPercent: 80, actions: [{ type: 'notify', target: 'assignment_group' }, { type: 'create_task', target: 'incident_commander' }], status: 'published' },
];

export const fixtureAutomationTemplates: AutomationTemplate[] = [
  { ...versioned('template-major-incident', '6'), name: 'Major incident coordination', category: 'Incident', description: 'Route, notify and create coordination tasks after a major incident declaration.', latestVersionId: 'version-major-06', status: 'published' },
  { ...versioned('template-email-triage', '3'), name: 'Inbound email triage', category: 'Messaging', description: 'Classify a message and route it to create or update a ticket.', latestVersionId: 'version-email-03', status: 'draft' },
];

export const fixtureAutomationRules: AutomationRule[] = [
  { ...versioned('rule-major-incident', '6'), name: 'P1 major incident orchestration', templateId: 'template-major-incident', trigger: { id: 'trigger-01', type: 'trigger', name: 'Incident becomes major', config: { event: 'incident.major_declared' } }, nodes: [
    { id: 'condition-01', type: 'condition', name: 'Priority is P1 or P2', config: { expression: 'priority in [P1,P2]' } },
    { id: 'action-01', type: 'action', name: 'Notify stakeholder policy', config: { policyId: 'notification-major' } },
    { id: 'approval-01', type: 'approval', name: 'External communication gate', config: { capability: 'incident.communicate.external' } },
  ], status: 'published', publishedVersionId: 'version-major-06' },
];

export const fixtureAutomationVersions: AutomationVersion[] = [
  { ...versioned('version-major-06', '1'), ruleId: 'rule-major-incident', number: 6, definition: fixtureAutomationRules[0], releaseNotes: 'Add external communication approval gate.', publishedAt: '2026-07-20T03:00:00.000Z' },
];

export const fixtureAutomationRuns: AutomationRun[] = [
  { ...versioned('run-9001', '4'), ruleId: 'rule-major-incident', versionId: 'version-major-06', ticketId: 'inc-7001', state: 'partial', dryRun: false, startedAt: '2026-07-27T06:02:00.000Z', completedAt: '2026-07-27T06:03:10.000Z', attempts: 2, auditCorrelationId: 'corr-run-9001', failure: { kind: 'partial', message: 'Notification accepted; task creation unavailable.', retryable: true, partialFailures: [{ operation: 'create_task', code: 'ADAPTER_UNAVAILABLE', message: 'Task adapter is not configured.', retryable: true }] } },
  { ...versioned('run-9002', '1'), ruleId: 'rule-major-incident', versionId: 'version-major-06', ticketId: 'inc-7001', state: 'succeeded', dryRun: true, startedAt: '2026-07-27T07:30:00.000Z', completedAt: '2026-07-27T07:30:02.000Z', attempts: 1, auditCorrelationId: 'corr-run-9002' },
];

export const fixtureNotificationProviders: NotificationProvider[] = [
  { ...versioned('provider-smtp-primary', '8'), name: 'Primary SMTP relay', kind: 'smtp', status: 'draft', config: { host: 'smtp.example.invalid', port: 587, security: 'starttls', username: 'soc-notify' }, secretConfigured: false, lastTestState: 'unknown' },
  { ...versioned('provider-graph', '2'), name: 'Microsoft Graph notifications', kind: 'microsoft_graph', status: 'disabled', config: { tenantId: 'TBD', sender: 'soc@example.invalid' }, secretConfigured: false, lastTestState: 'unknown' },
];

export const fixtureNotificationRecipients: NotificationRecipient[] = [
  { ...versioned('recipient-oncall'), name: 'Identity on-call', type: 'group', referenceId: 'group-identity-oncall', status: 'active' },
  { ...versioned('recipient-requester'), name: 'Ticket requester', type: 'role', referenceId: 'requester', status: 'active' },
];

export const fixtureNotificationTemplates: NotificationTemplate[] = [
  { ...versioned('template-major-update', '5'), name: 'Major incident update', channel: 'email', subject: '[{{ticket.key}}] {{ticket.title}} update', body: 'Status: {{ticket.status}}\nNext update: {{next_update_at}}', variables: ['ticket.key','ticket.title','ticket.status','next_update_at'], status: 'published' },
];

export const fixtureNotificationPolicies: NotificationPolicy[] = [
  { ...versioned('notification-major', '4'), name: 'Major incident stakeholder update', event: 'incident.communication_due', templateId: 'template-major-update', providerId: 'provider-smtp-primary', recipientIds: ['recipient-oncall','recipient-requester'], conditions: ['ticket.majorIncident = true'], status: 'draft' },
];

export const fixtureDeliveries: NotificationDelivery[] = [
  { ...versioned('delivery-8001', '3'), policyId: 'notification-major', providerId: 'provider-smtp-primary', ticketId: 'inc-7001', recipient: 'requester@example.invalid', state: 'queued', attempts: 1 },
  { ...versioned('delivery-8002', '4'), policyId: 'notification-major', providerId: 'provider-smtp-primary', ticketId: 'inc-7001', recipient: 'identity-oncall@example.invalid', state: 'failed', attempts: 2, lastError: { kind: 'unavailable', message: 'SMTP transport is not connected in this frontend-only implementation.', retryable: true } },
];

export const fixtureMailboxes: InboundMailbox[] = [
  { ...versioned('mailbox-service-desk', '5'), name: 'Service desk inbound', kind: 'imap', address: 'service-desk@example.invalid', status: 'draft', folder: 'INBOX', secretConfigured: false, pollingMode: 'poll', lastTestState: 'unknown' },
  { ...versioned('mailbox-msgraph', '2'), name: 'Security operations shared mailbox', kind: 'microsoft_graph', address: 'soc@example.invalid', status: 'disabled', folder: 'Inbox', secretConfigured: false, pollingMode: 'subscription', lastTestState: 'unknown' },
];

export const fixtureRoutingRules: InboundRoutingRule[] = [
  { ...versioned('route-reply', '6'), mailboxId: 'mailbox-service-desk', name: 'Update matching ticket thread', order: 10, conditions: ['in_reply_to matches ticket sourceMessageId'], action: 'update_ticket', status: 'published' },
  { ...versioned('route-incident', '3'), mailboxId: 'mailbox-service-desk', name: 'Create incident for outage subjects', order: 20, conditions: ['subject contains outage OR unavailable'], action: 'create_ticket', ticketKind: 'incident', status: 'draft' },
];

export const fixtureIngestionEvents: IngestionEvent[] = [
  { ...versioned('ingestion-7001', '2'), mailboxId: 'mailbox-service-desk', messageId: '<msg-7001@example.invalid>', sender: 'service-desk@example.invalid', subject: 'Identity login outage', state: 'created', routingRuleId: 'route-incident', ticketId: 'inc-7001' },
  { ...versioned('ingestion-7002', '2'), mailboxId: 'mailbox-service-desk', messageId: '<msg-7002@example.invalid>', sender: 'unknown@example.invalid', subject: 'RE: Identity login outage', state: 'quarantined', failure: { kind: 'validation', message: 'Sender trust policy could not be evaluated.', retryable: false } },
];

export class ItsmAdapterUnavailableError extends Error {
  readonly normalized: NormalizedApiError;

  constructor(operation = 'unknown', message?: string) {
    super(message ?? `No production ITSM adapter mapping is configured for ${operation}. Development fixtures require VITE_ENABLE_FIXTURES=true.`);
    this.name = 'ItsmAdapterUnavailableError';
    this.normalized = {
      kind: 'unavailable',
      message: message ?? `ITSM operation ${operation} is unavailable because no verified production endpoint is configured.`,
      retryable: false,
    };
  }
}

export type FixtureItsmStore = {
  tickets: Ticket[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
  relations: TicketRelation[];
  approvals: TicketApproval[];
  auditEvents: TicketAuditEvent[];
  calendars: BusinessCalendar[];
  slaPolicies: SlaPolicy[];
  slaClocks: SlaClock[];
  escalations: EscalationRule[];
  automationTemplates: AutomationTemplate[];
  automationRules: AutomationRule[];
  automationVersions: AutomationVersion[];
  automationRuns: AutomationRun[];
  notificationProviders: NotificationProvider[];
  notificationRecipients: NotificationRecipient[];
  notificationTemplates: NotificationTemplate[];
  notificationPolicies: NotificationPolicy[];
  deliveries: NotificationDelivery[];
  mailboxes: InboundMailbox[];
  routingRules: InboundRoutingRule[];
  ingestionEvents: IngestionEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);

export function createFixtureItsmStore(): FixtureItsmStore {
  return clone({
    tickets: fixtureTickets,
    comments: fixtureComments,
    attachments: fixtureAttachments,
    relations: fixtureRelations,
    approvals: fixtureApprovals,
    auditEvents: fixtureAuditEvents,
    calendars: fixtureCalendars,
    slaPolicies: fixtureSlaPolicies,
    slaClocks: fixtureSlaClocks,
    escalations: fixtureEscalations,
    automationTemplates: fixtureAutomationTemplates,
    automationRules: fixtureAutomationRules,
    automationVersions: fixtureAutomationVersions,
    automationRuns: fixtureAutomationRuns,
    notificationProviders: fixtureNotificationProviders,
    notificationRecipients: fixtureNotificationRecipients,
    notificationTemplates: fixtureNotificationTemplates,
    notificationPolicies: fixtureNotificationPolicies,
    deliveries: fixtureDeliveries,
    mailboxes: fixtureMailboxes,
    routingRules: fixtureRoutingRules,
    ingestionEvents: fixtureIngestionEvents,
  });
}

function valueAtPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (typeof current !== 'object' || current === null) return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function pageFrom<T>(items: T[], query: { cursor?: string; limit?: number; filters?: Record<string, string | number | boolean | string[]>; sort?: { field: string; direction: 'asc' | 'desc' }[] } = {}): CursorPage<T> {
  let selected = [...items];
  if (query.filters) {
    selected = selected.filter((item) => Object.entries(query.filters ?? {}).every(([field, expected]) => {
      const actual = valueAtPath(item, field);
      if (Array.isArray(expected)) return expected.map(String).includes(String(actual));
      return String(actual) === String(expected);
    }));
  }
  if (query.sort?.length) {
    selected.sort((left, right) => {
      for (const sort of query.sort ?? []) {
        const leftValue = valueAtPath(left, sort.field);
        const rightValue = valueAtPath(right, sort.field);
        const comparison = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { numeric: true });
        if (comparison !== 0) return sort.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }
  const offset = Math.max(0, Number(query.cursor ?? 0) || 0);
  const limit = Math.max(1, Math.min(query.limit ?? (selected.length || 1), 200));
  const sliced = selected.slice(offset, offset + limit);
  return {
    items: clone(sliced),
    total: selected.length,
    previousCursor: offset > 0 ? String(Math.max(0, offset - limit)) : undefined,
    nextCursor: offset + limit < selected.length ? String(offset + limit) : undefined,
    authoritativeAt: NOW,
  };
}

function upsertVersioned<T extends VersionedResource>(items: T[], resource: T): T {
  const index = items.findIndex((item) => item.id === resource.id);
  if (index >= 0) items[index] = clone(resource); else items.push(clone(resource));
  return clone(resource);
}

export function createFixtureItsmAdapter(store = createFixtureItsmStore()): ItsmApiAdapter {
  let sequence = 1000;
  const nextVersioned = (prefix: string): VersionedResource => versioned(`${prefix}-${sequence++}`, String(sequence));
  const nextReceipt = (operation: string): QueuedReceipt => ({
    receiptId: `fixture-receipt-${sequence++}`,
    operation,
    state: 'queued',
    submittedAt: NOW,
    authoritative: false,
    refreshAfterMs: 0,
  });
  const preview = (operation: string, summary: string, affectedResources: ImpactPreview['affectedResources']): ImpactPreview => ({
    operation,
    summary,
    affectedResources,
    permissions: clone(permissions),
    validation: [],
    warnings: ['Development-only preview. No production write or side effect has occurred.'],
    authoritative: false,
    expiresAt: LATER,
  });
  const result = <T>(operation: string, resource?: T): AuthoritativeMutationResult<T> => ({
    receipt: nextReceipt(operation),
    resource: resource === undefined ? undefined : clone(resource),
    authoritative: false,
    rehydratedAt: NOW,
  });
  const resolveTicket = (ticketId: string): Ticket => {
    const normalized = ticketId.trim();
    const existing = store.tickets.find((item) => item.id.toLowerCase() === normalized.toLowerCase() || item.key.toLowerCase() === normalized.toLowerCase());
    if (existing) return existing;
    const prefix = normalized.split('-')[0]?.toUpperCase();
    const kind = prefix === 'REQ' ? 'request' : prefix === 'PRB' ? 'problem' : prefix === 'CHG' ? 'change' : prefix === 'INC' ? 'incident' : undefined;
    const template = kind ? store.tickets.find((item) => item.kind === kind) : undefined;
    if (!template) throw new ItsmAdapterUnavailableError('getTicket', `Development fixture ticket ${ticketId} is not available.`);
    const key = normalized.toUpperCase();
    const created = {
      ...clone(template),
      id: key.toLowerCase(),
      key,
      title: `${template.title} · ${key}`,
      createdAt: NOW,
      updatedAt: NOW,
      version: '1',
      etag: `W/"${key.toLowerCase()}-1"`,
    } as Ticket;
    store.tickets.push(created);
    return created;
  };
  const bundleFor = (ticketId: string): TicketBundle => {
    const ticket = resolveTicket(ticketId);
    return clone({
      ticket,
      comments: store.comments.filter((item) => item.ticketId === ticket.id),
      attachments: store.attachments.filter((item) => item.ticketId === ticket.id),
      relations: store.relations.filter((item) => item.ticketId === ticket.id),
      approvals: store.approvals.filter((item) => item.ticketId === ticket.id),
      auditEvents: store.auditEvents.filter((item) => item.ticketId === ticket.id),
      slaClocks: store.slaClocks.filter((item) => item.ticketId === ticket.id),
    });
  };

  return {
    async getCapabilities() {
      return { subjectId: 'development-reviewer', permissions: clone(permissions), adapter: 'development-fixture', authoritative: false, checkedAt: NOW };
    },
    async listTickets(query) { return pageFrom(store.tickets, query); },
    async getTicket(ticketId) { return bundleFor(ticketId); },
    async previewCreateTicket(input) { return preview('ticket.create', `Create ${input.kind} titled ${input.title}`, [{ type: input.kind, id: 'new', effect: 'create' }]); },
    async createTicket(input) {
      const template = store.tickets.find((item) => item.kind === input.kind);
      if (!template) throw new ItsmAdapterUnavailableError('createTicket', `No development fixture template exists for ${input.kind}.`);
      const created = {
        ...clone(template),
        ...nextVersioned(`fixture-${input.kind}`),
        key: `FIX-${sequence}`,
        title: input.title,
        description: input.description,
        priority: input.priority,
        serviceId: input.serviceId,
        requesterId: input.requesterId,
        assigneeId: input.assigneeId,
        assignmentGroup: input.assignmentGroup,
      } as Ticket;
      store.tickets.push(created);
      return result('ticket.create', created);
    },
    async previewUpdateTicket(ticketId) { return preview('ticket.update', `Update ${ticketId}`, [{ type: 'ticket', id: ticketId, effect: 'update' }]); },
    async updateTicket(ticketId, patch) {
      const current = resolveTicket(ticketId);
      const updated = { ...current, ...patch, updatedAt: NOW, version: String(Number(current.version) + 1) } as Ticket;
      const index = store.tickets.findIndex((item) => item.id === current.id);
      store.tickets[index] = updated;
      return result('ticket.update', updated);
    },
    async refreshTicket(ticketId) { return bundleFor(ticketId); },

    async listComments(ticketId, query) { return pageFrom(store.comments.filter((item) => item.ticketId === resolveTicket(ticketId).id), query); },
    async previewCreateComment(ticketId, input) {
      return preview('ticket.comment.create', `Add ${input.visibility} comment to ${ticketId}`, [{ type: 'ticket-comment', id: 'new', effect: input.visibility }]);
    },
    async createComment(ticketId, input) {
      const ticket = resolveTicket(ticketId);
      const comment: TicketComment = {
        ...nextVersioned('fixture-comment'),
        ticketId: ticket.id,
        ...clone(input),
        authorId: 'development-reviewer',
        authorDisplayName: 'Development reviewer',
        source: 'web',
      };
      store.comments.push(comment);
      store.auditEvents.push({
        ...nextVersioned('fixture-audit'),
        ticketId: ticket.id,
        eventType: input.visibility === 'internal' ? 'comment.internal.created' : 'comment.public.created',
        actorId: 'development-reviewer',
        actorType: 'user',
        summary: `${input.visibility} comment added to ephemeral development review state.`,
        metadata: { authoritative: false, mentions: input.mentions.join(','), attachmentCount: input.attachmentIds.length },
        correlationId: `fixture-comment-${comment.id}`,
      });
      return result('ticket.comment.create', comment);
    },
    async createAttachmentPlaceholder(ticketId, filename) {
      const ticket = resolveTicket(ticketId);
      const attachment: TicketAttachment = {
        ...nextVersioned('fixture-attachment'),
        ticketId: ticket.id,
        filename,
        contentType: 'application/octet-stream',
        sizeBytes: 0,
        uploadState: 'placeholder',
      };
      store.attachments.push(attachment);
      return result('ticket.attachment.placeholder', attachment);
    },
    async listRelations(ticketId, query) { return pageFrom(store.relations.filter((item) => item.ticketId === resolveTicket(ticketId).id), query); },
    async createRelation(ticketId, relation) {
      const created: TicketRelation = { ...nextVersioned('fixture-relation'), ticketId: resolveTicket(ticketId).id, ...clone(relation) };
      store.relations.push(created);
      return result('ticket.relation.create', created);
    },
    async listApprovals(ticketId, query) { return pageFrom(store.approvals.filter((item) => item.ticketId === resolveTicket(ticketId).id), query); },
    async decideApproval(ticketId, approvalId, decision, rationale) {
      const ticket = resolveTicket(ticketId);
      const index = store.approvals.findIndex((item) => item.id === approvalId && item.ticketId === ticket.id);
      if (index < 0) throw new ItsmAdapterUnavailableError('decideApproval', `Development fixture approval ${approvalId} is not available.`);
      const updated = { ...store.approvals[index], decision, rationale, decidedAt: NOW, updatedAt: NOW } as TicketApproval;
      store.approvals[index] = updated;
      return result('ticket.approval.decide', updated);
    },
    async listAuditEvents(ticketId, query) { return pageFrom(store.auditEvents.filter((item) => item.ticketId === resolveTicket(ticketId).id), query); },

    async listSlaPolicies(query) { return pageFrom(store.slaPolicies, query); },
    async listBusinessCalendars(query) { return pageFrom(store.calendars, query); },
    async listSlaClocks(query) { return pageFrom(store.slaClocks, query); },
    async listEscalationRules(query) { return pageFrom(store.escalations, query); },
    async previewSlaPolicy(policy) { return preview('sla.policy.save', `Validate ${policy.name}`, [{ type: 'sla-policy', id: policy.id, effect: 'new clocks only' }]); },
    async saveSlaPolicy(policy) { return result('sla.policy.save', upsertVersioned(store.slaPolicies, policy)); },

    async listAutomationTemplates(query) { return pageFrom(store.automationTemplates, query); },
    async listAutomationRules(query) { return pageFrom(store.automationRules, query); },
    async listAutomationVersions(ruleId, query) { return pageFrom(store.automationVersions.filter((item) => item.ruleId === ruleId), query); },
    async listAutomationRuns(query) { return pageFrom(store.automationRuns, query); },
    async previewAutomationRule(rule) { return preview('automation.rule.save', `Validate ${rule.name}`, [{ type: 'automation-rule', id: rule.id, effect: 'draft revision' }]); },
    async saveAutomationRule(rule) { return result('automation.rule.save', upsertVersioned(store.automationRules, rule)); },
    async publishAutomationRule(ruleId, versionId) { return nextReceipt(`automation.rule.publish:${ruleId}:${versionId}`); },
    async dryRunAutomationRule(ruleId) {
      const template = store.automationRuns.find((item) => item.dryRun) ?? store.automationRuns[0];
      const run: AutomationRun = { ...clone(template), ...nextVersioned('fixture-run'), ruleId, dryRun: true, state: 'succeeded', attempts: 1, startedAt: NOW, completedAt: NOW };
      store.automationRuns.unshift(run);
      return clone(run);
    },
    async retryAutomationRun(runId) { return nextReceipt(`automation.run.retry:${runId}`); },
    async cancelAutomationRun(runId) { return nextReceipt(`automation.run.cancel:${runId}`); },

    async listNotificationProviders(query) { return pageFrom(store.notificationProviders, query); },
    async listNotificationRecipients(query) { return pageFrom(store.notificationRecipients, query); },
    async listNotificationTemplates(query) { return pageFrom(store.notificationTemplates, query); },
    async listNotificationPolicies(query) { return pageFrom(store.notificationPolicies, query); },
    async listNotificationDeliveries(query) { return pageFrom(store.deliveries, query); },
    async saveNotificationProvider(provider) { return result('notification.provider.save', upsertVersioned(store.notificationProviders, provider)); },
    async testNotificationProvider(providerId) { return nextReceipt(`notification.provider.test:${providerId}`); },

    async listInboundMailboxes(query) { return pageFrom(store.mailboxes, query); },
    async listInboundRoutingRules(query) { return pageFrom(store.routingRules, query); },
    async listIngestionEvents(query) { return pageFrom(store.ingestionEvents, query); },
    async saveInboundMailbox(mailbox) { return result('inbound.mailbox.save', upsertVersioned(store.mailboxes, mailbox)); },
    async testInboundMailbox(mailboxId) { return nextReceipt(`inbound.mailbox.test:${mailboxId}`); },
  };
}

export function createUnavailableItsmAdapter(): ItsmApiAdapter {
  return new Proxy({}, {
    get: (_target, property) => async () => { throw new ItsmAdapterUnavailableError(String(property)); },
  }) as ItsmApiAdapter;
}

export const isItsmFixtureMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_FIXTURES === 'true';
let activeAdapter: ItsmApiAdapter = isItsmFixtureMode ? createFixtureItsmAdapter() : createUnavailableItsmAdapter();
let activeAdapterMode: CapabilitySnapshot['adapter'] = isItsmFixtureMode ? 'development-fixture' : 'unavailable';

export function configureItsmApiAdapter(adapter: ItsmApiAdapter, mode: CapabilitySnapshot['adapter'] = 'production') {
  activeAdapter = adapter;
  activeAdapterMode = mode;
}

export function resetItsmApiAdapter() {
  activeAdapter = isItsmFixtureMode ? createFixtureItsmAdapter() : createUnavailableItsmAdapter();
  activeAdapterMode = isItsmFixtureMode ? 'development-fixture' : 'unavailable';
}

export function getItsmAdapterMode() {
  return activeAdapterMode;
}

export const itsmApi = new Proxy({}, {
  get: (_target, property) => (...args: unknown[]) => {
    const method = (activeAdapter as unknown as Record<PropertyKey, (...methodArgs: unknown[]) => unknown>)[property];
    if (typeof method !== 'function') throw new ItsmAdapterUnavailableError(String(property));
    return method(...args);
  },
}) as ItsmApiAdapter;

export function normalizeItsmError(error: unknown): NormalizedApiError {
  if (error instanceof ItsmAdapterUnavailableError) return error.normalized;
  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') return { kind: 'timeout', message: 'The request was aborted.', retryable: true };
  if (typeof error === 'object' && error !== null && 'normalized' in error) return (error as { normalized: NormalizedApiError }).normalized;
  if (error instanceof TypeError) return { kind: 'offline', message: error.message, retryable: true };
  if (error instanceof Error) return { kind: 'unknown', message: error.message, retryable: false };
  return { kind: 'unknown', message: String(error), retryable: false };
}
