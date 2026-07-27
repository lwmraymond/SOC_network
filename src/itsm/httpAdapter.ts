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
  ListQuery,
  MutationContext,
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
} from './contracts';
import { ItsmAdapterUnavailableError } from './client';

export type HttpItsmOperation = keyof ItsmApiAdapter;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpEndpointDefinition = {
  method: HttpMethod;
  path: string;
};

export type HttpResponseMetadata = {
  etag?: string;
  requestId?: string;
  status: number;
  headers: Headers;
};

export type HttpItsmAdapterConfig = {
  baseUrl: string;
  endpoints: Partial<Record<HttpItsmOperation, HttpEndpointDefinition>>;
  fetchImpl?: typeof fetch;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  getAuthHeaders?: () => HeadersInit | Promise<HeadersInit>;
  mapRequest?: Partial<Record<HttpItsmOperation, (value: unknown) => unknown>>;
  mapResponse?: Partial<Record<HttpItsmOperation, (value: unknown, metadata: HttpResponseMetadata) => unknown>>;
};

class HttpItsmError extends Error {
  readonly normalized: NormalizedApiError;

  constructor(normalized: NormalizedApiError) {
    super(normalized.message);
    this.name = 'HttpItsmError';
    this.normalized = normalized;
  }
}

function renderPath(template: string, values: Record<string, string | undefined>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const value = values[key];
    if (!value) throw new ItsmAdapterUnavailableError('http-path', `Endpoint template requires ${key}, but no value was supplied.`);
    return encodeURIComponent(value);
  });
}

function addQuery(url: URL, query?: ListQuery | Record<string, string | number | boolean | undefined>) {
  if (!query) return;
  if ('filters' in query || 'sort' in query || 'include' in query) {
    const listQuery = query as ListQuery;
    if (listQuery.cursor) url.searchParams.set('cursor', listQuery.cursor);
    if (listQuery.limit !== undefined) url.searchParams.set('limit', String(listQuery.limit));
    for (const [key, value] of Object.entries(listQuery.filters ?? {})) {
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) url.searchParams.append(`filter[${key}]`, String(item));
    }
    for (const sort of listQuery.sort ?? []) url.searchParams.append('sort', `${sort.field}:${sort.direction}`);
    for (const include of listQuery.include ?? []) url.searchParams.append('include', include);
    return;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
}

function statusKind(status: number): NormalizedApiError['kind'] {
  if (status === 401 || status === 403) return 'permission';
  if (status === 408 || status === 504) return 'timeout';
  if (status === 409 || status === 412) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status === 207) return 'partial';
  if (status === 502 || status === 503) return 'unavailable';
  return 'unknown';
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try { return JSON.parse(text) as unknown; } catch { return { message: text }; }
  }
  return { message: text };
}

function normalizeHttpFailure(response: Response, body: unknown): NormalizedApiError {
  const value = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const validation = Array.isArray(value.validation) ? value.validation as NormalizedApiError['validation'] : undefined;
  const partialFailures = Array.isArray(value.partialFailures) ? value.partialFailures as NormalizedApiError['partialFailures'] : undefined;
  return {
    kind: statusKind(response.status),
    message: typeof value.message === 'string' ? value.message : `ITSM HTTP request failed with status ${response.status}.`,
    status: response.status,
    requestId: response.headers.get('x-request-id') ?? (typeof value.requestId === 'string' ? value.requestId : undefined),
    retryable: response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500,
    validation,
    partialFailures,
    currentVersion: response.headers.get('etag') ?? (typeof value.currentVersion === 'string' ? value.currentVersion : undefined),
  };
}

async function resolveHeaders(value?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>)) {
  return typeof value === 'function' ? value() : value;
}

function attachMetadata<T>(value: T, metadata: HttpResponseMetadata): T {
  if (typeof value !== 'object' || value === null || !metadata.etag) return value;
  const record = value as Record<string, unknown>;
  if ('resource' in record && typeof record.resource === 'object' && record.resource !== null) {
    const resource = record.resource as Record<string, unknown>;
    if (!resource.etag) resource.etag = metadata.etag;
  } else if (!record.etag && 'id' in record) {
    record.etag = metadata.etag;
  }
  return value;
}

export function createHttpItsmAdapter(config: HttpItsmAdapterConfig): ItsmApiAdapter {
  const fetchImpl = config.fetchImpl ?? fetch;
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;

  const invoke = async <T>(operation: HttpItsmOperation, options: {
    path?: Record<string, string | undefined>;
    query?: ListQuery | Record<string, string | number | boolean | undefined>;
    body?: unknown;
    context?: MutationContext;
    signal?: AbortSignal;
    fallbackOperation?: HttpItsmOperation;
  } = {}): Promise<T> => {
    const definition = config.endpoints[operation] ?? (options.fallbackOperation ? config.endpoints[options.fallbackOperation] : undefined);
    if (!definition) throw new ItsmAdapterUnavailableError(operation, `No verified endpoint mapping is configured for ${operation}.`);
    const renderedPath = renderPath(definition.path, options.path ?? {});
    const origin = typeof window === 'undefined' ? 'http://localhost/' : `${window.location.origin}/`;
    const url = new URL(renderedPath.replace(/^\//, ''), new URL(baseUrl, origin));
    addQuery(url, options.query);

    const headers = new Headers(await resolveHeaders(config.headers));
    const authHeaders = await config.getAuthHeaders?.();
    if (authHeaders) new Headers(authHeaders).forEach((value, key) => headers.set(key, value));
    headers.set('Accept', 'application/json');
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    if (options.context?.ifMatch) headers.set('If-Match', options.context.ifMatch);
    if (options.context?.idempotencyKey) headers.set('Idempotency-Key', options.context.idempotencyKey);
    if (options.context?.expectedVersion) headers.set('X-Expected-Version', options.context.expectedVersion);
    if (options.context?.clientRequestId) headers.set('X-Client-Request-Id', options.context.clientRequestId);

    const mappedBody = options.body === undefined ? undefined : (config.mapRequest?.[operation]?.(options.body) ?? options.body);
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: definition.method,
        headers,
        body: mappedBody === undefined ? undefined : JSON.stringify(mappedBody),
        signal: options.signal,
      });
    } catch (error: unknown) {
      if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpItsmError({ kind: 'timeout', message: `ITSM operation ${operation} was aborted.`, retryable: true });
      }
      throw new HttpItsmError({ kind: 'offline', message: error instanceof Error ? error.message : String(error), retryable: true });
    }

    const body = await parseBody(response);
    if (!response.ok && response.status !== 207) throw new HttpItsmError(normalizeHttpFailure(response, body));
    const metadata: HttpResponseMetadata = {
      etag: response.headers.get('etag') ?? undefined,
      requestId: response.headers.get('x-request-id') ?? undefined,
      status: response.status,
      headers: response.headers,
    };
    const mapped = (config.mapResponse?.[operation]?.(body, metadata) ?? body) as T;
    return attachMetadata(mapped, metadata);
  };

  return {
    getCapabilities: (signal) => invoke<CapabilitySnapshot>('getCapabilities', { signal }),
    listTickets: (query, signal) => invoke<CursorPage<Ticket>>('listTickets', { query, signal }),
    getTicket: (ticketId, signal) => invoke<TicketBundle>('getTicket', { path: { ticketId }, signal }),
    previewCreateTicket: (input, signal) => invoke<ImpactPreview>('previewCreateTicket', { body: input, signal }),
    createTicket: (input, context, signal) => invoke<AuthoritativeMutationResult<Ticket>>('createTicket', { body: input, context, signal }),
    previewUpdateTicket: (ticketId, patch, signal) => invoke<ImpactPreview>('previewUpdateTicket', { path: { ticketId }, body: patch, signal }),
    updateTicket: (ticketId, patch, context, signal) => invoke<AuthoritativeMutationResult<Ticket>>('updateTicket', { path: { ticketId }, body: patch, context, signal }),
    refreshTicket: (ticketId, receiptId, signal) => invoke<TicketBundle>('refreshTicket', { path: { ticketId }, query: { receiptId }, signal, fallbackOperation: 'getTicket' }),

    listComments: (ticketId, query, signal) => invoke<CursorPage<TicketComment>>('listComments', { path: { ticketId }, query, signal }),
    previewCreateComment: (ticketId, input, signal) => invoke<ImpactPreview>('previewCreateComment', { path: { ticketId }, body: input, signal }),
    createComment: (ticketId, input, context, signal) => invoke<AuthoritativeMutationResult<TicketComment>>('createComment', { path: { ticketId }, body: input, context, signal }),
    createAttachmentPlaceholder: (ticketId, filename, context, signal) => invoke<AuthoritativeMutationResult<TicketAttachment>>('createAttachmentPlaceholder', { path: { ticketId }, body: { filename }, context, signal }),
    listRelations: (ticketId, query, signal) => invoke<CursorPage<TicketRelation>>('listRelations', { path: { ticketId }, query, signal }),
    createRelation: (ticketId, relation, context, signal) => invoke<AuthoritativeMutationResult<TicketRelation>>('createRelation', { path: { ticketId }, body: relation, context, signal }),
    listApprovals: (ticketId, query, signal) => invoke<CursorPage<TicketApproval>>('listApprovals', { path: { ticketId }, query, signal }),
    decideApproval: (ticketId, approvalId, decision, rationale, context, signal) => invoke<AuthoritativeMutationResult<TicketApproval>>('decideApproval', { path: { ticketId, approvalId }, body: { decision, rationale }, context, signal }),
    listAuditEvents: (ticketId, query, signal) => invoke<CursorPage<TicketAuditEvent>>('listAuditEvents', { path: { ticketId }, query, signal }),

    listSlaPolicies: (query, signal) => invoke<CursorPage<SlaPolicy>>('listSlaPolicies', { query, signal }),
    listBusinessCalendars: (query, signal) => invoke<CursorPage<BusinessCalendar>>('listBusinessCalendars', { query, signal }),
    listSlaClocks: (query, signal) => invoke<CursorPage<SlaClock>>('listSlaClocks', { query, signal }),
    listEscalationRules: (query, signal) => invoke<CursorPage<EscalationRule>>('listEscalationRules', { query, signal }),
    previewSlaPolicy: (policy, signal) => invoke<ImpactPreview>('previewSlaPolicy', { path: { policyId: policy.id }, body: policy, signal }),
    saveSlaPolicy: (policy, context, signal) => invoke<AuthoritativeMutationResult<SlaPolicy>>('saveSlaPolicy', { path: { policyId: policy.id }, body: policy, context, signal }),

    listAutomationTemplates: (query, signal) => invoke<CursorPage<AutomationTemplate>>('listAutomationTemplates', { query, signal }),
    listAutomationRules: (query, signal) => invoke<CursorPage<AutomationRule>>('listAutomationRules', { query, signal }),
    listAutomationVersions: (ruleId, query, signal) => invoke<CursorPage<AutomationVersion>>('listAutomationVersions', { path: { ruleId }, query, signal }),
    listAutomationRuns: (query, signal) => invoke<CursorPage<AutomationRun>>('listAutomationRuns', { query, signal }),
    previewAutomationRule: (rule, signal) => invoke<ImpactPreview>('previewAutomationRule', { path: { ruleId: rule.id }, body: rule, signal }),
    saveAutomationRule: (rule, context, signal) => invoke<AuthoritativeMutationResult<AutomationRule>>('saveAutomationRule', { path: { ruleId: rule.id }, body: rule, context, signal }),
    publishAutomationRule: (ruleId, versionId, context, signal) => invoke<QueuedReceipt>('publishAutomationRule', { path: { ruleId, versionId }, body: { versionId }, context, signal }),
    dryRunAutomationRule: (ruleId, input, context, signal) => invoke<AutomationRun>('dryRunAutomationRule', { path: { ruleId }, body: input, context, signal }),
    retryAutomationRun: (runId, context, signal) => invoke<QueuedReceipt>('retryAutomationRun', { path: { runId }, context, signal }),
    cancelAutomationRun: (runId, context, signal) => invoke<QueuedReceipt>('cancelAutomationRun', { path: { runId }, context, signal }),

    listNotificationProviders: (query, signal) => invoke<CursorPage<NotificationProvider>>('listNotificationProviders', { query, signal }),
    listNotificationRecipients: (query, signal) => invoke<CursorPage<NotificationRecipient>>('listNotificationRecipients', { query, signal }),
    listNotificationTemplates: (query, signal) => invoke<CursorPage<NotificationTemplate>>('listNotificationTemplates', { query, signal }),
    listNotificationPolicies: (query, signal) => invoke<CursorPage<NotificationPolicy>>('listNotificationPolicies', { query, signal }),
    listNotificationDeliveries: (query, signal) => invoke<CursorPage<NotificationDelivery>>('listNotificationDeliveries', { query, signal }),
    saveNotificationProvider: (provider, context, signal) => invoke<AuthoritativeMutationResult<NotificationProvider>>('saveNotificationProvider', { path: { providerId: provider.id }, body: provider, context, signal }),
    testNotificationProvider: (providerId, context, signal) => invoke<QueuedReceipt>('testNotificationProvider', { path: { providerId }, context, signal }),

    listInboundMailboxes: (query, signal) => invoke<CursorPage<InboundMailbox>>('listInboundMailboxes', { query, signal }),
    listInboundRoutingRules: (query, signal) => invoke<CursorPage<InboundRoutingRule>>('listInboundRoutingRules', { query, signal }),
    listIngestionEvents: (query, signal) => invoke<CursorPage<IngestionEvent>>('listIngestionEvents', { query, signal }),
    saveInboundMailbox: (mailbox, context, signal) => invoke<AuthoritativeMutationResult<InboundMailbox>>('saveInboundMailbox', { path: { mailboxId: mailbox.id }, body: mailbox, context, signal }),
    testInboundMailbox: (mailboxId, context, signal) => invoke<QueuedReceipt>('testInboundMailbox', { path: { mailboxId }, context, signal }),
  };
}
