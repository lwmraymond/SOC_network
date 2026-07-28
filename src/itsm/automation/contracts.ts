import type {
  AutomationRun,
  CursorPage,
  ImpactPreview,
  ListQuery,
  MutationContext,
  NormalizedApiError,
  PermissionCapability,
  QueuedReceipt,
  ValidationIssue,
  VersionedResource,
} from '../contracts';

export type AutomationTemplateLifecycle = 'draft' | 'validating' | 'published' | 'deprecated' | 'archived';
export type AutomationDependencyHealth = 'healthy' | 'degraded' | 'blocked' | 'unknown';
export type AutomationSchemaFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'datetime' | 'reference' | 'secret';
export type AutomationNodeType = 'trigger' | 'condition' | 'action' | 'approval' | 'wait' | 'notification';
export type AutomationSideEffectClass = 'none' | 'read' | 'reversible_write' | 'irreversible_write' | 'external_notification';
export type AutomationCompensationPolicy = 'none' | 'best_effort' | 'required' | 'manual';

export type AutomationSchemaField = {
  id: string;
  name: string;
  label: string;
  type: AutomationSchemaFieldType;
  required: boolean;
  defaultValue?: unknown;
  validation?: string;
  secret: boolean;
  reference: boolean;
  referenceType?: string;
  description?: string;
};

export type AutomationSchema = {
  fields: AutomationSchemaField[];
  additionalProperties: boolean;
};

export type ManagedAutomationNode = {
  id: string;
  type: AutomationNodeType;
  name: string;
  description?: string;
  configuration: Record<string, unknown>;
  capability?: string;
  timeoutMs?: number;
  retry: {
    maxAttempts: number;
    backoff: 'none' | 'fixed' | 'exponential';
    initialDelayMs?: number;
    maxDelayMs?: number;
  };
  idempotency: {
    required: boolean;
    keyExpression?: string;
    windowSeconds?: number;
  };
  sideEffectClass: AutomationSideEffectClass;
  compensationPolicy: AutomationCompensationPolicy;
  approvalTimeoutSeconds?: number;
};

export type ManagedAutomationTemplate = VersionedResource & {
  name: string;
  description: string;
  category: string;
  owner: string;
  tags: string[];
  permissions: PermissionCapability[];
  dependencyHealth: AutomationDependencyHealth;
  dependencySummary?: string;
  status: AutomationTemplateLifecycle;
  latestVersionId: string;
  publishedVersionId?: string;
  inputSchema: AutomationSchema;
  outputSchema: AutomationSchema;
  workflow: ManagedAutomationNode[];
  authoritative: boolean;
};

export type AutomationTemplateVersionStatus = 'draft' | 'validating' | 'validated' | 'published' | 'deprecated' | 'archived';

export type AutomationTemplateVersion = VersionedResource & {
  templateId: string;
  number: number;
  status: AutomationTemplateVersionStatus;
  releaseNotes: string;
  createdBy: string;
  publishedAt?: string;
  rolledBackFromVersionId?: string;
  validationFindings: ValidationIssue[];
  definition: ManagedAutomationTemplate;
  authoritative: boolean;
};

export type AutomationTemplateAction =
  | { action: 'clone'; sourceTemplateId: string; name: string }
  | { action: 'create_draft_version'; templateId: string; releaseNotes: string }
  | { action: 'validate_version'; templateId: string; versionId: string }
  | { action: 'save_metadata'; templateId: string; patch: Pick<ManagedAutomationTemplate, 'name' | 'description' | 'category' | 'owner' | 'tags'> }
  | { action: 'save_schema'; templateId: string; inputSchema: AutomationSchema; outputSchema: AutomationSchema }
  | { action: 'save_workflow'; templateId: string; workflow: ManagedAutomationNode[] }
  | { action: 'publish_version'; templateId: string; versionId: string; releaseNotes: string }
  | { action: 'rollback_version'; templateId: string; versionId: string; reason: string }
  | { action: 'deprecate'; templateId: string; reason: string }
  | { action: 'archive'; templateId: string; reason: string };

export type AutomationSimulationRequest = {
  templateId: string;
  versionId?: string;
  sampleInput: Record<string, unknown>;
};

export type AutomationSimulationStep = {
  sequence: number;
  nodeId: string;
  nodeType: AutomationNodeType;
  name: string;
  state: 'matched' | 'passed' | 'blocked' | 'waiting' | 'skipped' | 'simulated' | 'warning';
  conditionResult?: boolean;
  approvalGate?: string;
  expectedReceipt?: string;
  warning?: string;
  durationMs?: number;
};

export type AutomationSimulationResult = {
  id: string;
  templateId: string;
  versionId: string;
  simulatedAt: string;
  sampleInput: Record<string, unknown>;
  steps: AutomationSimulationStep[];
  expectedReceipts: string[];
  warnings: string[];
  connectorExecuted: false;
  authoritative: false;
};

export type AutomationRuntimeSettingKey =
  | 'queue.maxConcurrency'
  | 'queue.partitionStrategy'
  | 'execution.defaultTimeoutMs'
  | 'retry.maxAttempts'
  | 'retry.backoff'
  | 'deadLetter.enabled'
  | 'deadLetter.retentionDays'
  | 'idempotency.windowSeconds'
  | 'approval.timeoutSeconds'
  | 'compensation.defaultPolicy'
  | 'history.retentionDays'
  | 'audit.correlationRequired';

export type AutomationRuntimeSetting = {
  key: AutomationRuntimeSettingKey;
  label: string;
  description: string;
  source: 'default' | 'environment' | 'tenant' | 'service' | 'TBD';
  effectiveValue: string | number | boolean;
  configuredValue?: string | number | boolean;
  validation: ValidationIssue[];
  permission: PermissionCapability;
  requirement: 'none' | 'restart' | 'redeploy' | 'executor_upgrade' | 'TBD';
  available: boolean;
};

export type AutomationRuntimeSettingsSnapshot = VersionedResource & {
  settings: AutomationRuntimeSetting[];
  adapter: 'production' | 'development-fixture' | 'unavailable';
  authoritative: boolean;
};

export type ManagedAutomationRunStep = {
  sequence: number;
  nodeId: string;
  nodeType: AutomationNodeType;
  name: string;
  state: 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped' | 'waiting' | 'cancelled' | 'partial';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  attempt: number;
  expectedReceipt?: string;
  receiptId?: string;
  failure?: NormalizedApiError;
};

export type ManagedAutomationRun = AutomationRun & {
  templateId?: string;
  templateVersionId?: string;
  templateName?: string;
  triggerSource?: string;
  contractMode: 'dry_run' | 'live';
  durationMs?: number;
  steps: ManagedAutomationRunStep[];
};

export type AutomationTemplateManagementAdapter = {
  listTemplates(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<ManagedAutomationTemplate>>;
  getTemplate(templateId: string, signal?: AbortSignal): Promise<ManagedAutomationTemplate>;
  listTemplateVersions(templateId: string, query: ListQuery, signal?: AbortSignal): Promise<CursorPage<AutomationTemplateVersion>>;
  previewTemplateAction(input: AutomationTemplateAction, signal?: AbortSignal): Promise<ImpactPreview>;
  executeTemplateAction(input: AutomationTemplateAction, context: MutationContext, signal?: AbortSignal): Promise<{ receipt: QueuedReceipt }>;
  refreshTemplate(templateId: string, receiptId?: string, signal?: AbortSignal): Promise<ManagedAutomationTemplate>;
  simulateTemplate(input: AutomationSimulationRequest, context: MutationContext, signal?: AbortSignal): Promise<AutomationSimulationResult>;
  getRuntimeSettings(signal?: AbortSignal): Promise<AutomationRuntimeSettingsSnapshot>;
  previewRuntimeSettings(patch: Partial<Record<AutomationRuntimeSettingKey, AutomationRuntimeSetting['effectiveValue']>>, signal?: AbortSignal): Promise<ImpactPreview>;
  saveRuntimeSettings(patch: Partial<Record<AutomationRuntimeSettingKey, AutomationRuntimeSetting['effectiveValue']>>, context: MutationContext, signal?: AbortSignal): Promise<{ receipt: QueuedReceipt }>;
  refreshRuntimeSettings(receiptId?: string, signal?: AbortSignal): Promise<AutomationRuntimeSettingsSnapshot>;
  listRuns(query: ListQuery, signal?: AbortSignal): Promise<CursorPage<ManagedAutomationRun>>;
  getRun(runId: string, signal?: AbortSignal): Promise<ManagedAutomationRun>;
  retryRun(runId: string, context: MutationContext, signal?: AbortSignal): Promise<QueuedReceipt>;
  cancelRun(runId: string, context: MutationContext, signal?: AbortSignal): Promise<QueuedReceipt>;
};
