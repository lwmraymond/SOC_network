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
let fixtureSequence = 1000;

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
  readonly normalized: NormalizedApiError = {
    kind: 'unavailable',
    message: 'No production ITSM adapter is configured. Development fixtures are never used as a production fallback.',
    retryable: false,
  };

  constructor() {
    super('No production ITSM adapter is configured. Development fixtures require VITE_ENABLE_FIXTURES=true.');
    this.name = 'ItsmAdapterUnavailableError';
  }
}

const unavailable = async (): Promise<never> => { throw new ItsmAdapterUnavailableError(); };
const unavailableAdapter = new Proxy({}, { get: () => unavailable }) as ItsmApiAdapter;

const page = <T>(items: T[]): CursorPage<T> => ({ items, total: items.length, authoritativeAt: NOW });
const nextReceipt = (operation: string): QueuedReceipt => ({
  receiptId: `fixture-receipt-${fixtureSequence++}`,
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
  permissions,
  validation: [],
  warnings: ['Development-only preview. No production write or side effect has occurred.'],
  authoritative: false,
  expiresAt: LATER,
});

const result = <T>(operation: string, resource?: T): AuthoritativeMutationResult<T> => ({
  receipt: nextReceipt(operation),
  resource,
  authoritative: false,
});

const bundleFor = (ticketId: string): TicketBundle => {
  const ticket = fixtureTickets.find((item) => item.id === ticketId || item.key === ticketId) ?? fixtureTickets[1];
  return {
    ticket,
    comments: fixtureComments.filter((item) => item.ticketId === ticket.id),
    attachments: fixtureAttachments.filter((item) => item.ticketId === ticket.id),
    relations: fixtureRelations.filter((item) => item.ticketId === ticket.id),
    approvals: fixtureApprovals.filter((item) => item.ticketId === ticket.id),
    auditEvents: fixtureAuditEvents.filter((item) => item.ticketId === ticket.id),
    slaClocks: fixtureSlaClocks.filter((item) => item.ticketId === ticket.id),
  };
};

const fixtureAdapterPartial: Partial<ItsmApiAdapter> = {
  async getCapabilities(): Promise<CapabilitySnapshot> {
    return { subjectId: 'development-reviewer', permissions, adapter: 'development-fixture', authoritative: false, checkedAt: NOW };
  },
  async listTickets() { return page(fixtureTickets); },
  async getTicket(ticketId: string) { return bundleFor(ticketId); },
  async previewCreateTicket(input: TicketCreateInput) { return preview('ticket.create', `Create ${input.kind} titled ${input.title}`, [{ type: input.kind, id: 'new', effect: 'create' }]); },
  async createTicket(input: TicketCreateInput) {
    const created = { ...fixtureTickets.find((item) => item.kind === input.kind), id: `fixture-${fixtureSequence++}`, key: `FIX-${fixtureSequence}`, title: input.title, description: input.description, priority: input.priority } as Ticket;
    return result('ticket.create', created);
  },
  async previewUpdateTicket(ticketId: string) { return preview('ticket.update', `Update ${ticketId}`, [{ type: 'ticket', id: ticketId, effect: 'update' }]); },
  async updateTicket(ticketId: string, patch: TicketPatch) { return result('ticket.update', { ...bundleFor(ticketId).ticket, ...patch } as Ticket); },
  async refreshTicket(ticketId: string) { return bundleFor(ticketId); },

  async listComments(ticketId: string) { return page(fixtureComments.filter((item) => item.ticketId === bundleFor(ticketId).ticket.id)); },
  async previewCreateComment(ticketId: string, input: CommentCreateInput) { return preview('ticket.comment.create', `Add ${input.visibility} comment to ${ticketId}`, [{ type: 'ticket-comment', id: 'new', effect: input.visibility }]); },
  async createComment(ticketId: string, input: CommentCreateInput) {
    const comment: TicketComment = { ...versioned(`fixture-comment-${fixtureSequence++}`), ticketId: bundleFor(ticketId).ticket.id, ...input, authorId: 'development-reviewer', authorDisplayName: 'Development reviewer', source: 'web' };
    return result('ticket.comment.create', comment);
  },
  async createAttachmentPlaceholder(ticketId: string, filename: string) {
    return result('ticket.attachment.placeholder', { ...versioned(`fixture-attachment-${fixtureSequence++}`), ticketId: bundleFor(ticketId).ticket.id, filename, contentType: 'application/octet-stream', sizeBytes: 0, uploadState: 'placeholder' });
  },
  async listRelations(ticketId: string) { return page(fixtureRelations.filter((item) => item.ticketId === bundleFor(ticketId).ticket.id)); },
  async createRelation(ticketId: string, relation) { return result('ticket.relation.create', { ...versioned(`fixture-relation-${fixtureSequence++}`), ticketId: bundleFor(ticketId).ticket.id, ...relation }); },
  async listApprovals(ticketId: string) { return page(fixtureApprovals.filter((item) => item.ticketId === bundleFor(ticketId).ticket.id)); },
  async decideApproval(ticketId: string, approvalId: string, decision: 'approved' | 'rejected', rationale: string) {
    const current = fixtureApprovals.find((item) => item.id === approvalId) ?? fixtureApprovals[0];
    return result('ticket.approval.decide', { ...current, ticketId: bundleFor(ticketId).ticket.id, decision, rationale, decidedAt: NOW });
  },
  async listAuditEvents(ticketId: string) { return page(fixtureAuditEvents.filter((item) => item.ticketId === bundleFor(ticketId).ticket.id)); },

  async listSlaPolicies() { return page(fixtureSlaPolicies); },
  async listBusinessCalendars() { return page(fixtureCalendars); },
  async listSlaClocks() { return page(fixtureSlaClocks); },
  async listEscalationRules() { return page(fixtureEscalations); },
  async previewSlaPolicy(policy: SlaPolicy) { return preview('sla.policy.save', `Validate ${policy.name}`, [{ type: 'sla-policy', id: policy.id, effect: 'new clocks only' }]); },
  async saveSlaPolicy(policy: SlaPolicy) { return result('sla.policy.save', policy); },

  async listAutomationTemplates() { return page(fixtureAutomationTemplates); },
  async listAutomationRules() { return page(fixtureAutomationRules); },
  async listAutomationVersions() { return page(fixtureAutomationVersions); },
  async listAutomationRuns() { return page(fixtureAutomationRuns); },
  async previewAutomationRule(rule: AutomationRule) { return preview('automation.rule.save', `Validate ${rule.name}`, [{ type: 'automation-rule', id: rule.id, effect: 'draft revision' }]); },
  async saveAutomationRule(rule: AutomationRule) { return result('automation.rule.save', rule); },
  async publishAutomationRule(ruleId: string, versionId: string) { return nextReceipt(`automation.rule.publish:${ruleId}:${versionId}`); },
  async dryRunAutomationRule(ruleId: string) { return { ...fixtureAutomationRuns[1], id: `fixture-run-${fixtureSequence++}`, ruleId, dryRun: true, state: 'succeeded', authoritative: false } as AutomationRun; },
  async retryAutomationRun(runId: string) { return nextReceipt(`automation.run.retry:${runId}`); },
  async cancelAutomationRun(runId: string) { return nextReceipt(`automation.run.cancel:${runId}`); },

  async listNotificationProviders() { return page(fixtureNotificationProviders); },
  async listNotificationRecipients() { return page(fixtureNotificationRecipients); },
  async listNotificationTemplates() { return page(fixtureNotificationTemplates); },
  async listNotificationPolicies() { return page(fixtureNotificationPolicies); },
  async listNotificationDeliveries() { return page(fixtureDeliveries); },
  async saveNotificationProvider(provider: NotificationProvider) { return result('notification.provider.save', provider); },
  async testNotificationProvider(providerId: string) { return nextReceipt(`notification.provider.test:${providerId}`); },

  async listInboundMailboxes() { return page(fixtureMailboxes); },
  async listInboundRoutingRules() { return page(fixtureRoutingRules); },
  async listIngestionEvents() { return page(fixtureIngestionEvents); },
  async saveInboundMailbox(mailbox: InboundMailbox) { return result('inbound.mailbox.save', mailbox); },
  async testInboundMailbox(mailboxId: string) { return nextReceipt(`inbound.mailbox.test:${mailboxId}`); },
};

const fixtureAdapter = new Proxy(fixtureAdapterPartial, {
  get(target, property) {
    const value = Reflect.get(target, property);
    return value ?? unavailable;
  },
}) as ItsmApiAdapter;

export const isItsmFixtureMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_FIXTURES === 'true';
export const itsmApi: ItsmApiAdapter = isItsmFixtureMode ? fixtureAdapter : unavailableAdapter;

export function normalizeItsmError(error: unknown): NormalizedApiError {
  if (error instanceof ItsmAdapterUnavailableError) return error.normalized;
  if (typeof error === 'object' && error !== null && 'normalized' in error) return (error as { normalized: NormalizedApiError }).normalized;
  if (error instanceof Error) return { kind: 'unknown', message: error.message, retryable: false };
  return { kind: 'unknown', message: String(error), retryable: false };
}
