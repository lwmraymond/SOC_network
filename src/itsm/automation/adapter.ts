import type {
  AutomationRun,
  AutomationTemplate,
  CursorPage,
  ItsmApiAdapter,
  ListQuery,
  MutationContext,
  NormalizedApiError,
  QueuedReceipt,
  VersionedResource,
} from '../contracts';
import type {
  AutomationRuntimeSetting,
  AutomationRuntimeSettingKey,
  AutomationRuntimeSettingsSnapshot,
  AutomationSchema,
  AutomationSimulationRequest,
  AutomationTemplateManagementAdapter,
  AutomationTemplateVersion,
  ManagedAutomationNode,
  ManagedAutomationRun,
  ManagedAutomationTemplate,
} from './contracts';

const FIXTURE_NOW = '2026-07-27T08:00:00.000Z';
let sequence = 4000;

export class AutomationTemplateAdapterUnavailableError extends Error {
  readonly normalized: NormalizedApiError;

  constructor(message = 'Automation Template management endpoint is not mapped. The frontend remains fail-closed.') {
    super(message);
    this.name = 'AutomationTemplateAdapterUnavailableError';
    this.normalized = { kind: 'unavailable', message, retryable: false };
  }
}

class AutomationTemplateConflictError extends Error {
  readonly normalized: NormalizedApiError;

  constructor(message: string, currentVersion?: string) {
    super(message);
    this.name = 'AutomationTemplateConflictError';
    this.normalized = { kind: 'conflict', message, retryable: false, currentVersion };
  }
}

class AutomationTemplateValidationError extends Error {
  readonly normalized: NormalizedApiError;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'AutomationTemplateValidationError';
    this.normalized = {
      kind: 'validation', message, retryable: false,
      validation: [{ field, code: 'AUTOMATION_TEMPLATE_VALIDATION', message, severity: 'error' }],
    };
  }
}

const abortIfNeeded = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
};

const versioned = (id: string, version = '1'): VersionedResource => ({
  id,
  version,
  etag: `W/"${id}-${version}"`,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: FIXTURE_NOW,
});

const permissions = [
  { capability: 'automation.template.read', decision: 'allow' as const },
  { capability: 'automation.template.edit', decision: 'conditional' as const, obligations: ['if_match', 'impact_preview'] },
  { capability: 'automation.template.publish', decision: 'conditional' as const, obligations: ['release_notes', 'approval'] },
];

const stringField = (id: string, name: string, label: string, required = true) => ({
  id,
  name,
  label,
  type: 'string' as const,
  required,
  secret: false,
  reference: false,
});

const defaultInputSchema: AutomationSchema = {
  additionalProperties: false,
  fields: [
    stringField('field-ticket-id', 'ticketId', 'Ticket ID'),
    { ...stringField('field-service-id', 'serviceId', 'Service reference'), type: 'reference', reference: true, referenceType: 'service' },
    { ...stringField('field-message', 'message', 'Message', false), validation: 'maxLength: 4000' },
  ],
};

const defaultOutputSchema: AutomationSchema = {
  additionalProperties: false,
  fields: [
    stringField('field-run-id', 'runId', 'Run ID'),
    stringField('field-receipt-id', 'receiptId', 'Receipt ID', false),
    { ...stringField('field-state', 'state', 'State'), validation: 'enum: queued,running,succeeded,partial,failed' },
  ],
};

const workflow: ManagedAutomationNode[] = [
  {
    id: 'node-trigger', type: 'trigger', name: 'Incident becomes major', configuration: { event: 'incident.major_declared' },
    capability: 'ticket.read', timeoutMs: 5000,
    retry: { maxAttempts: 1, backoff: 'none' },
    idempotency: { required: true, keyExpression: 'event.id', windowSeconds: 86400 },
    sideEffectClass: 'none', compensationPolicy: 'none',
  },
  {
    id: 'node-condition', type: 'condition', name: 'Priority is P1 or P2', configuration: { expression: 'ticket.priority in [P1,P2]' },
    capability: 'automation.condition.evaluate', timeoutMs: 3000,
    retry: { maxAttempts: 1, backoff: 'none' },
    idempotency: { required: false },
    sideEffectClass: 'read', compensationPolicy: 'none',
  },
  {
    id: 'node-action', type: 'action', name: 'Create coordination task', configuration: { taskType: 'major_incident_coordination' },
    capability: 'ticket.task.create', timeoutMs: 30_000,
    retry: { maxAttempts: 2, backoff: 'fixed', initialDelayMs: 1000, maxDelayMs: 5000 },
    idempotency: { required: true, keyExpression: 'run.id + node.id', windowSeconds: 86400 },
    sideEffectClass: 'reversible_write', compensationPolicy: 'best_effort',
  },
  {
    id: 'node-approval', type: 'approval', name: 'External communication gate', configuration: { approverRole: 'incident_commander' },
    capability: 'incident.communicate.external', timeoutMs: 3_600_000, approvalTimeoutSeconds: 3600,
    retry: { maxAttempts: 1, backoff: 'none' },
    idempotency: { required: true, keyExpression: 'run.id + node.id', windowSeconds: 86400 },
    sideEffectClass: 'none', compensationPolicy: 'manual',
  },
  {
    id: 'node-notify', type: 'notification', name: 'Notify stakeholder policy', configuration: { policyId: 'notification-major' },
    capability: 'notification.policy.invoke', timeoutMs: 30_000,
    retry: { maxAttempts: 3, backoff: 'exponential', initialDelayMs: 1000, maxDelayMs: 30_000 },
    idempotency: { required: true, keyExpression: 'run.id + node.id + recipient.id', windowSeconds: 86400 },
    sideEffectClass: 'external_notification', compensationPolicy: 'manual',
  },
  {
    id: 'node-wait', type: 'wait', name: 'Wait for delivery receipt', configuration: { event: 'notification.delivery.updated', timeout: '15m' },
    capability: 'notification.delivery.read', timeoutMs: 900_000,
    retry: { maxAttempts: 1, backoff: 'none' },
    idempotency: { required: true, keyExpression: 'run.id + node.id', windowSeconds: 3600 },
    sideEffectClass: 'read', compensationPolicy: 'none',
  },
];

const seedTemplates = (): ManagedAutomationTemplate[] => [
  {
    ...versioned('template-major-incident', '6'),
    name: 'Major incident coordination',
    description: 'Route, approve and notify stakeholders after a major incident declaration.',
    category: 'Incident', owner: 'ITSM automation', tags: ['major-incident', 'communications'], permissions,
    dependencyHealth: 'degraded', dependencySummary: 'SMTP provider is draft; task adapter is unavailable.',
    status: 'published', latestVersionId: 'template-major-incident-v6', publishedVersionId: 'template-major-incident-v6',
    inputSchema: defaultInputSchema, outputSchema: defaultOutputSchema, workflow,
    authoritative: false,
  },
  {
    ...versioned('template-inbound-triage', '3'),
    name: 'Inbound email triage',
    description: 'Classify an inbound message and route it to create or update a Ticket.',
    category: 'Messaging', owner: 'Service desk automation', tags: ['email', 'triage'], permissions,
    dependencyHealth: 'blocked', dependencySummary: 'Inbound mailbox ingestion endpoint is TBD.',
    status: 'validating', latestVersionId: 'template-inbound-triage-v3',
    inputSchema: { additionalProperties: false, fields: [
      stringField('field-message-id', 'messageId', 'Message ID'),
      stringField('field-subject', 'subject', 'Subject'),
      { ...stringField('field-sender', 'sender', 'Sender'), validation: 'email' },
    ] },
    outputSchema: defaultOutputSchema,
    workflow: workflow.map((node, index) => index === 0 ? { ...node, id: 'mail-trigger', name: 'Inbound message received', configuration: { event: 'mail.received' } } : node),
    authoritative: false,
  },
  {
    ...versioned('template-request-fulfilment', '2'),
    name: 'Standard request fulfilment',
    description: 'Create approval and fulfilment tasks for a catalog request.',
    category: 'Request', owner: 'Service fulfilment', tags: ['request', 'approval'], permissions,
    dependencyHealth: 'healthy', status: 'draft', latestVersionId: 'template-request-fulfilment-v2',
    inputSchema: defaultInputSchema, outputSchema: defaultOutputSchema, workflow,
    authoritative: false,
  },
  {
    ...versioned('template-archived-audit-pack', '5'),
    name: 'Archived audit evidence pack',
    description: 'Archived template retained for historical run and audit correlation review.',
    category: 'Governance', owner: 'ITSM governance', tags: ['audit', 'archived'], permissions,
    dependencyHealth: 'unknown', dependencySummary: 'Runtime implementation is retired; history remains readable.',
    status: 'archived', latestVersionId: 'template-archived-audit-pack-v5', publishedVersionId: 'template-archived-audit-pack-v4',
    inputSchema: defaultInputSchema, outputSchema: defaultOutputSchema, workflow,
    authoritative: false,
  },
  {
    ...versioned('template-legacy-escalation', '11'),
    name: 'Legacy escalation bridge',
    description: 'Deprecated compatibility flow retained for existing rules.',
    category: 'Compatibility', owner: 'Platform operations', tags: ['legacy'], permissions,
    dependencyHealth: 'unknown', status: 'deprecated', latestVersionId: 'template-legacy-escalation-v11', publishedVersionId: 'template-legacy-escalation-v10',
    inputSchema: defaultInputSchema, outputSchema: defaultOutputSchema, workflow,
    authoritative: false,
  },
];

const seedVersions = (templates: ManagedAutomationTemplate[]): AutomationTemplateVersion[] => templates.flatMap((template) => {
  const current = Number(template.version) || 1;
  const publishedFromPointer = Number(template.publishedVersionId?.match(/-v(\d+)$/)?.[1]);
  const published = Number.isFinite(publishedFromPointer) ? publishedFromPointer : Math.max(1, current - (template.status === 'draft' || template.status === 'validating' ? 1 : 0));
  const items: AutomationTemplateVersion[] = [{
    ...versioned(`${template.id}-v${current}`, '1'), templateId: template.id, number: current,
    status: template.status === 'published' ? 'published' : template.status === 'validating' ? 'validating' : template.status === 'deprecated' ? 'deprecated' : template.status === 'archived' ? 'archived' : 'draft',
    releaseNotes: current === 1 ? 'Initial template.' : 'Update schema, retry and governance metadata.', createdBy: 'development-reviewer',
    publishedAt: template.status === 'published' ? FIXTURE_NOW : undefined,
    validationFindings: template.dependencyHealth === 'blocked' ? [{ code: 'DEPENDENCY_BLOCKED', message: template.dependencySummary ?? 'Dependency unavailable.', severity: 'error' }] : [],
    definition: template, authoritative: false,
  }];
  if (published < current) items.push({
    ...versioned(`${template.id}-v${published}`, '1'), templateId: template.id, number: published, status: 'published',
    releaseNotes: 'Last published version.', createdBy: 'automation-owner', publishedAt: '2026-07-20T03:00:00.000Z',
    validationFindings: [], definition: { ...template, version: String(published), status: 'published' }, authoritative: false,
  });
  return items;
});

const runtimeSettings = (): AutomationRuntimeSettingsSnapshot => ({
  ...versioned('automation-runtime-settings', '4'), adapter: 'development-fixture', authoritative: false,
  settings: [
    setting('queue.maxConcurrency', 'Maximum concurrency', 'Global concurrent run limit.', 'tenant', 24, 'restart'),
    setting('queue.partitionStrategy', 'Queue partition strategy', 'Partition work by tenant and template.', 'default', 'tenant-template', 'TBD'),
    setting('execution.defaultTimeoutMs', 'Default execution timeout', 'Default maximum live execution duration.', 'environment', 900000, 'redeploy'),
    setting('retry.maxAttempts', 'Default retry attempts', 'Default retry count when a node does not override it.', 'tenant', 3, 'none'),
    setting('retry.backoff', 'Default retry backoff', 'Backoff policy used by retryable nodes.', 'tenant', 'exponential', 'none'),
    setting('deadLetter.enabled', 'Dead-letter handling', 'Route exhausted runs to a dead-letter store.', 'TBD', false, 'executor_upgrade', false),
    setting('deadLetter.retentionDays', 'Dead-letter retention', 'Retention for failed run payload references.', 'TBD', 14, 'TBD', false),
    setting('idempotency.windowSeconds', 'Idempotency window', 'Window used to reject duplicate execution requests.', 'environment', 86400, 'redeploy'),
    setting('approval.timeoutSeconds', 'Approval timeout', 'Default approval gate timeout.', 'tenant', 3600, 'none'),
    setting('compensation.defaultPolicy', 'Default compensation policy', 'Fallback compensation behavior for reversible writes.', 'default', 'best_effort', 'none'),
    setting('history.retentionDays', 'Run history retention', 'Retention for execution metadata and step traces.', 'TBD', 30, 'TBD', false),
    setting('audit.correlationRequired', 'Audit correlation required', 'Require every run to carry an audit correlation ID.', 'tenant', true, 'none'),
  ],
});

function setting(
  key: AutomationRuntimeSettingKey,
  label: string,
  description: string,
  source: AutomationRuntimeSetting['source'],
  value: AutomationRuntimeSetting['effectiveValue'],
  requirement: AutomationRuntimeSetting['requirement'],
  available = true,
): AutomationRuntimeSetting {
  return {
    key, label, description, source, effectiveValue: value, configuredValue: source === 'tenant' ? value : undefined,
    validation: available ? [] : [{ code: 'BACKEND_MAPPING_TBD', message: 'No authoritative runtime endpoint or field mapping is configured.', severity: 'warning' }],
    permission: { capability: 'automation.runtime.configure', decision: available ? 'conditional' : 'unknown', obligations: available ? ['impact_preview', 'if_match'] : ['backend_mapping_required'] },
    requirement, available,
  };
}

const makeReceipt = (operation: string, requestId?: string): QueuedReceipt => ({
  receiptId: `fixture-automation-receipt-${sequence++}`,
  operation,
  requestId,
  state: 'queued',
  submittedAt: FIXTURE_NOW,
  authoritative: false,
  refreshAfterMs: 0,
});

const unavailable = async (): Promise<never> => { throw new AutomationTemplateAdapterUnavailableError(); };

const toManagedTemplate = (template: AutomationTemplate): ManagedAutomationTemplate => ({
  ...template,
  owner: 'TBD', tags: [], permissions: [{ capability: 'automation.template.read', decision: 'unknown' }],
  dependencyHealth: 'unknown', status: template.status === 'published' ? 'published' : template.status === 'deprecated' ? 'deprecated' : 'draft',
  publishedVersionId: template.status === 'published' ? template.latestVersionId : undefined,
  inputSchema: { fields: [], additionalProperties: false }, outputSchema: { fields: [], additionalProperties: false }, workflow: [], authoritative: true,
});

const normalizeRun = (run: AutomationRun, template?: ManagedAutomationTemplate): ManagedAutomationRun => ({
  ...run,
  templateId: template?.id,
  templateVersionId: run.versionId,
  templateName: template?.name,
  triggerSource: run.ticketId ? `ticket:${run.ticketId}` : 'manual',
  contractMode: run.dryRun ? 'dry_run' : 'live',
  durationMs: run.startedAt && run.completedAt ? Math.max(0, Date.parse(run.completedAt) - Date.parse(run.startedAt)) : undefined,
  steps: (template?.workflow ?? workflow).map((node, index) => ({
    sequence: index + 1, nodeId: node.id, nodeType: node.type, name: node.name,
    state: run.state === 'failed' && index === 3 ? 'failed' : run.state === 'partial' && index >= 3 ? 'partial' : run.state === 'running' && index > 1 ? 'queued' : 'succeeded',
    attempt: Math.max(1, run.attempts),
    durationMs: 25 + index * 15,
    expectedReceipt: node.sideEffectClass === 'none' || node.sideEffectClass === 'read' ? undefined : `${node.type}.receipt`,
    failure: run.state === 'failed' && index === 3 ? run.failure : undefined,
  })),
});

function applyQuery<T extends { id: string }>(items: T[], query: ListQuery, searchable: (item: T) => string): CursorPage<T> {
  const filters = query.filters ?? {};
  let result = items.filter((item) => {
    const search = String(filters.search ?? '').trim().toLowerCase();
    if (search && !searchable(item).toLowerCase().includes(search)) return false;
    return Object.entries(filters).every(([key, value]) => {
      if (key === 'search' || value === '' || value === undefined) return true;
      const candidate = (item as Record<string, unknown>)[key];
      return Array.isArray(value) ? value.map(String).includes(String(candidate)) : String(candidate) === String(value);
    });
  });
  for (const sort of [...(query.sort ?? [])].reverse()) {
    result = [...result].sort((a, b) => {
      const left = String((a as Record<string, unknown>)[sort.field] ?? '');
      const right = String((b as Record<string, unknown>)[sort.field] ?? '');
      return left.localeCompare(right) * (sort.direction === 'asc' ? 1 : -1);
    });
  }
  const offset = Math.max(0, Number(query.cursor ?? 0) || 0);
  const limit = Math.max(1, query.limit ?? 50);
  const pageItems = result.slice(offset, offset + limit);
  return {
    items: structuredClone(pageItems), total: result.length, previousCursor: offset > 0 ? String(Math.max(0, offset - limit)) : undefined,
    nextCursor: offset + limit < result.length ? String(offset + limit) : undefined, authoritativeAt: FIXTURE_NOW,
  };
}

export type AutomationTemplateAdapterOptions = {
  fixtureMode?: boolean;
  productionExtension?: Partial<AutomationTemplateManagementAdapter>;
};

export function createAutomationTemplateManagementAdapter(base: ItsmApiAdapter, options: AutomationTemplateAdapterOptions = {}): AutomationTemplateManagementAdapter {
  if (!options.fixtureMode) {
    const extension = options.productionExtension ?? {};
    return {
      listTemplates: extension.listTemplates ?? (async (query, signal) => {
        abortIfNeeded(signal);
        const response = await base.listAutomationTemplates(query, signal);
        return { ...response, items: response.items.map(toManagedTemplate) };
      }),
      getTemplate: extension.getTemplate ?? (async (templateId, signal) => {
        const response = await base.listAutomationTemplates({ filters: { id: templateId }, limit: 1 }, signal);
        const template = response.items.find((item) => item.id === templateId);
        if (!template) throw new AutomationTemplateAdapterUnavailableError(`Template ${templateId} detail endpoint is not mapped.`);
        return toManagedTemplate(template);
      }),
      listTemplateVersions: extension.listTemplateVersions ?? unavailable,
      previewTemplateAction: extension.previewTemplateAction ?? unavailable,
      executeTemplateAction: extension.executeTemplateAction ?? unavailable,
      refreshTemplate: extension.refreshTemplate ?? unavailable,
      simulateTemplate: extension.simulateTemplate ?? unavailable,
      getRuntimeSettings: extension.getRuntimeSettings ?? unavailable,
      previewRuntimeSettings: extension.previewRuntimeSettings ?? unavailable,
      saveRuntimeSettings: extension.saveRuntimeSettings ?? unavailable,
      refreshRuntimeSettings: extension.refreshRuntimeSettings ?? unavailable,
      listRuns: extension.listRuns ?? (async (query, signal) => {
        const response = await base.listAutomationRuns(query, signal);
        return { ...response, items: response.items.map((run) => normalizeRun(run)) };
      }),
      getRun: extension.getRun ?? (async (runId, signal) => {
        const response = await base.listAutomationRuns({ filters: { id: runId }, limit: 1 }, signal);
        const run = response.items.find((item) => item.id === runId);
        if (!run) throw new AutomationTemplateAdapterUnavailableError(`Run ${runId} detail endpoint is not mapped.`);
        return normalizeRun(run);
      }),
      retryRun: extension.retryRun ?? ((runId, context, signal) => base.retryAutomationRun(runId, context, signal)),
      cancelRun: extension.cancelRun ?? ((runId, context, signal) => base.cancelAutomationRun(runId, context, signal)),
    };
  }

  let templates = seedTemplates();
  let versions = seedVersions(templates);
  let runtime = runtimeSettings();

  const findTemplate = (id: string) => {
    const template = templates.find((item) => item.id === id);
    if (!template) throw new Error(`Automation template ${id} was not found in the ephemeral fixture store.`);
    return template;
  };

  const updateTemplate = (id: string, update: (template: ManagedAutomationTemplate) => ManagedAutomationTemplate) => {
    templates = templates.map((template) => template.id === id ? update(template) : template);
    return findTemplate(id);
  };


  const assertTemplateConcurrency = (template: ManagedAutomationTemplate, context: MutationContext) => {
    if (context.ifMatch && template.etag && context.ifMatch !== template.etag) {
      throw new AutomationTemplateConflictError(`Template ${template.id} ETag does not match the current review state.`, template.etag);
    }
    if (context.expectedVersion && context.expectedVersion !== template.version) {
      throw new AutomationTemplateConflictError(`Template ${template.id} version ${context.expectedVersion} is stale.`, template.version);
    }
  };

  const bumpTemplate = (template: ManagedAutomationTemplate, patch: Partial<ManagedAutomationTemplate>) => {
    const revision = Math.max(1, Number(template.version) || 1) + 1;
    return { ...template, ...patch, version: String(revision), etag: `W/"${template.id}-${revision}"`, updatedAt: FIXTURE_NOW, authoritative: false };
  };

  const syncLatestDefinition = (template: ManagedAutomationTemplate) => {
    versions = versions.map((item) => item.id === template.latestVersionId ? { ...item, definition: structuredClone(template), updatedAt: FIXTURE_NOW, authoritative: false } : item);
  };

  return {
    async listTemplates(query, signal) {
      abortIfNeeded(signal);
      return applyQuery(structuredClone(templates), query, (item) => `${item.id} ${item.name} ${item.description} ${item.category} ${item.owner} ${item.tags.join(' ')} ${item.dependencyHealth} ${item.status}`);
    },
    async getTemplate(templateId, signal) { abortIfNeeded(signal); return structuredClone(findTemplate(templateId)); },
    async listTemplateVersions(templateId, query, signal) {
      abortIfNeeded(signal);
      return applyQuery(versions.filter((item) => item.templateId === templateId), query, (item) => `${item.id} ${item.number} ${item.status} ${item.releaseNotes} ${item.createdBy}`);
    },
    async previewTemplateAction(input, signal) {
      abortIfNeeded(signal);
      const templateId = 'templateId' in input ? input.templateId : input.sourceTemplateId;
      const template = findTemplate(templateId);
      const targetVersion = 'versionId' in input ? versions.find((item) => item.id === input.versionId && item.templateId === template.id) : undefined;
      const validation = [
        ...(input.action === 'publish_version' && template.dependencyHealth === 'blocked'
          ? [{ field: 'dependencies', code: 'DEPENDENCY_BLOCKED', message: template.dependencySummary ?? 'A required dependency is blocked.', severity: 'error' as const }]
          : []),
        ...(['save_metadata', 'save_schema', 'save_workflow'].includes(input.action) && !['draft', 'validating'].includes(template.status)
          ? [{ field: 'status', code: 'DRAFT_REQUIRED', message: 'Create a draft version before editing template metadata, schema or workflow.', severity: 'error' as const }]
          : []),
        ...(input.action === 'publish_version' && targetVersion?.status !== 'validated'
          ? [{ field: 'version', code: 'VALIDATION_REQUIRED', message: 'A version must complete validation before publish preview can be confirmed.', severity: 'error' as const }]
          : []),
        ...(input.action === 'archive' && template.status === 'archived'
          ? [{ field: 'status', code: 'ALREADY_ARCHIVED', message: 'The template is already archived.', severity: 'error' as const }]
          : []),
      ];
      return {
        operation: `automation.template.${input.action}`,
        summary: `${input.action.replaceAll('_', ' ')} · ${template.name}`,
        affectedResources: [{ type: 'automation-template', id: template.id, effect: input.action }],
        permissions,
        validation,
        warnings: [
          'Development fixture operation. Receipt and rehydrated state remain authoritative:false.',
          ...(input.action === 'archive' ? ['Archived templates are removed from normal discovery but remain in audit history.'] : []),
          ...(input.action === 'rollback_version' ? ['Rollback creates a new governed pointer change; it does not erase version history.'] : []),
        ],
        authoritative: false,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      };
    },
    async executeTemplateAction(input, context, signal) {
      abortIfNeeded(signal);
      let rehydrateId: string | undefined;
      const targetId = 'templateId' in input ? input.templateId : input.sourceTemplateId;
      const target = findTemplate(targetId);
      assertTemplateConcurrency(target, context);
      if (input.action === 'clone') {
        const source = target;
        const id = `template-clone-${sequence++}`;
        const clone = { ...structuredClone(source), ...versioned(id, '1'), name: input.name, status: 'draft' as const, publishedVersionId: undefined, latestVersionId: `${id}-v1`, authoritative: false };
        templates = [clone, ...templates];
        rehydrateId = id;
        versions = [{ ...versioned(`${id}-v1`, '1'), templateId: id, number: 1, status: 'draft', releaseNotes: `Cloned from ${source.name}.`, createdBy: 'development-reviewer', validationFindings: [], definition: clone, authoritative: false }, ...versions];
      } else if (input.action === 'create_draft_version') {
        const current = findTemplate(input.templateId);
        const number = Math.max(...versions.filter((item) => item.templateId === current.id).map((item) => item.number), Number(current.version)) + 1;
        const versionId = `${current.id}-v${number}`;
        const updated = updateTemplate(current.id, (template) => bumpTemplate(template, { latestVersionId: versionId, status: 'draft' }));
        versions = [{ ...versioned(versionId, '1'), templateId: current.id, number, status: 'draft', releaseNotes: input.releaseNotes, createdBy: 'development-reviewer', validationFindings: [], definition: updated, authoritative: false }, ...versions];
      } else if (input.action === 'validate_version') {
        const version = versions.find((item) => item.id === input.versionId && item.templateId === input.templateId);
        if (!version) throw new AutomationTemplateValidationError(`Version ${input.versionId} was not found.`, 'version');
        const findings = target.dependencyHealth === 'blocked' ? [{ field: 'dependencies', code: 'DEPENDENCY_BLOCKED', message: target.dependencySummary ?? 'A required dependency is blocked.', severity: 'error' as const }] : [];
        versions = versions.map((item) => item.id === version.id ? { ...item, status: findings.length ? 'draft' : 'validated', validationFindings: findings, updatedAt: FIXTURE_NOW, authoritative: false } : item);
        const updated = updateTemplate(target.id, (template) => bumpTemplate(template, { status: findings.length ? 'draft' : 'validating' }));
        syncLatestDefinition(updated);
      } else if (input.action === 'save_metadata') {
        if (!['draft', 'validating'].includes(target.status)) throw new AutomationTemplateValidationError('Create a draft version before editing template metadata.', 'status');
        const updated = updateTemplate(input.templateId, (template) => bumpTemplate(template, input.patch));
        syncLatestDefinition(updated);
      } else if (input.action === 'save_schema') {
        if (!['draft', 'validating'].includes(target.status)) throw new AutomationTemplateValidationError('Create a draft version before editing template schema.', 'status');
        const updated = updateTemplate(input.templateId, (template) => bumpTemplate(template, { inputSchema: structuredClone(input.inputSchema), outputSchema: structuredClone(input.outputSchema), status: 'draft' }));
        syncLatestDefinition(updated);
      } else if (input.action === 'save_workflow') {
        if (!['draft', 'validating'].includes(target.status)) throw new AutomationTemplateValidationError('Create a draft version before editing template workflow.', 'status');
        const updated = updateTemplate(input.templateId, (template) => bumpTemplate(template, { workflow: structuredClone(input.workflow), status: 'draft' }));
        syncLatestDefinition(updated);
      } else if (input.action === 'publish_version') {
        const version = versions.find((item) => item.id === input.versionId && item.templateId === input.templateId);
        if (!version || version.status !== 'validated') throw new AutomationTemplateValidationError('The selected version must be validated before publication.', 'version');
        updateTemplate(input.templateId, (template) => bumpTemplate(template, { publishedVersionId: input.versionId, status: 'published' }));
        versions = versions.map((item) => item.id === input.versionId ? { ...item, status: 'published', releaseNotes: input.releaseNotes, publishedAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW, authoritative: false } : item);
      } else if (input.action === 'rollback_version') {
        if (!versions.some((item) => item.id === input.versionId && item.templateId === input.templateId)) throw new AutomationTemplateValidationError(`Version ${input.versionId} was not found.`, 'version');
        updateTemplate(input.templateId, (template) => bumpTemplate(template, { publishedVersionId: input.versionId, status: 'published' }));
      } else if (input.action === 'deprecate') {
        updateTemplate(input.templateId, (template) => bumpTemplate(template, { status: 'deprecated' }));
      } else if (input.action === 'archive') {
        if (target.status === 'archived') throw new AutomationTemplateValidationError('The template is already archived.', 'status');
        updateTemplate(input.templateId, (template) => bumpTemplate(template, { status: 'archived' }));
      }
      return { receipt: makeReceipt(`automation.template.${input.action}`, rehydrateId) };
    },
    async refreshTemplate(templateId, _receiptId, signal) { abortIfNeeded(signal); return structuredClone(findTemplate(templateId)); },
    async simulateTemplate(input: AutomationSimulationRequest, _context: MutationContext, signal) {
      abortIfNeeded(signal);
      const template = findTemplate(input.templateId);
      const versionId = input.versionId ?? template.latestVersionId;
      const steps = template.workflow.map((node, index) => ({
        sequence: index + 1, nodeId: node.id, nodeType: node.type, name: node.name,
        state: node.type === 'approval' ? 'waiting' as const : node.sideEffectClass === 'external_notification' ? 'warning' as const : 'simulated' as const,
        conditionResult: node.type === 'condition' ? true : undefined,
        approvalGate: node.type === 'approval' ? node.capability ?? 'approval required' : undefined,
        expectedReceipt: node.sideEffectClass === 'none' || node.sideEffectClass === 'read' ? undefined : `${node.type}.receipt`,
        warning: node.sideEffectClass === 'irreversible_write' || node.sideEffectClass === 'external_notification' ? `Simulation did not execute ${node.sideEffectClass}.` : undefined,
        durationMs: 10 + index * 7,
      }));
      return {
        id: `simulation-${sequence++}`, templateId: template.id, versionId, simulatedAt: FIXTURE_NOW, sampleInput: structuredClone(input.sampleInput), steps,
        expectedReceipts: steps.flatMap((step) => step.expectedReceipt ? [step.expectedReceipt] : []),
        warnings: ['Simulation only / no connector executed.', 'All receipts shown are expected contract values, not issued receipts.'],
        connectorExecuted: false, authoritative: false,
      };
    },
    async getRuntimeSettings(signal) { abortIfNeeded(signal); return structuredClone(runtime); },
    async previewRuntimeSettings(patch, signal) {
      abortIfNeeded(signal);
      const changed = Object.keys(patch);
      return {
        operation: 'automation.runtime.settings.update', summary: `Review ${changed.length} runtime setting change${changed.length === 1 ? '' : 's'}`,
        affectedResources: changed.map((key) => ({ type: 'automation-runtime-setting', id: key, effect: 'effective value update' })),
        permissions: [{ capability: 'automation.runtime.configure', decision: 'conditional', obligations: ['if_match', 'impact_preview'] }],
        validation: changed.flatMap((key) => runtime.settings.find((item) => item.key === key)?.available ? [] : [{ field: key, code: 'BACKEND_MAPPING_TBD', message: 'This setting is unavailable until an authoritative backend mapping exists.', severity: 'error' as const }]),
        warnings: ['A queued settings receipt does not restart or redeploy an execution engine.'], authoritative: false,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      };
    },
    async saveRuntimeSettings(patch, context, signal) {
      abortIfNeeded(signal);
      if (context.ifMatch && runtime.etag && context.ifMatch !== runtime.etag) throw new AutomationTemplateConflictError('Runtime settings ETag does not match the current review state.', runtime.etag);
      if (context.expectedVersion && context.expectedVersion !== runtime.version) throw new AutomationTemplateConflictError('Runtime settings version is stale.', runtime.version);
      const unavailableKeys = Object.keys(patch).filter((key) => !runtime.settings.find((item) => item.key === key)?.available);
      if (unavailableKeys.length) throw new AutomationTemplateValidationError(`Runtime settings are unavailable until backend mapping exists: ${unavailableKeys.join(', ')}`, unavailableKeys[0]);
      runtime = {
        ...runtime, version: String(Number(runtime.version) + 1), etag: `W/"automation-runtime-settings-${Number(runtime.version) + 1}"`, updatedAt: FIXTURE_NOW, authoritative: false,
        settings: runtime.settings.map((item) => Object.prototype.hasOwnProperty.call(patch, item.key) ? { ...item, configuredValue: patch[item.key], effectiveValue: patch[item.key] ?? item.effectiveValue } : item),
      };
      return { receipt: makeReceipt('automation.runtime.settings.update') };
    },
    async refreshRuntimeSettings(_receiptId, signal) { abortIfNeeded(signal); return structuredClone(runtime); },
    async listRuns(query, signal) {
      abortIfNeeded(signal);
      const managedFilterKeys = new Set(['templateId', 'templateVersionId', 'templateName', 'triggerSource', 'contractMode']);
      const baseFilters = Object.fromEntries(Object.entries(query.filters ?? {}).filter(([key]) => !managedFilterKeys.has(key)));
      const response = await base.listAutomationRuns({ ...query, cursor: undefined, limit: Math.max(query.limit ?? 100, 200), filters: baseFilters }, signal);
      const items = response.items.map((run, index) => normalizeRun(run, templates[index % templates.length]));
      return applyQuery(items, query, (item) => `${item.id} ${item.ruleId} ${item.templateId ?? ''} ${item.templateName ?? ''} ${item.triggerSource ?? ''} ${item.contractMode} ${item.state} ${item.auditCorrelationId}`);
    },
    async getRun(runId, signal) {
      const response = await base.listAutomationRuns({}, signal);
      const run = response.items.find((item) => item.id === runId);
      if (!run) throw new Error(`Automation run ${runId} was not found.`);
      return normalizeRun(run, templates.find((item) => item.id === 'template-major-incident'));
    },
    retryRun: (runId, context, signal) => base.retryAutomationRun(runId, context, signal),
    cancelRun: (runId, context, signal) => base.cancelAutomationRun(runId, context, signal),
  };
}
