import type { ImpactPreview, ListQuery, MutationContext, NormalizedApiError, QueuedReceipt } from '../contracts';
import type {
  AutomationRuntimeSetting,
  AutomationRuntimeSettingKey,
  AutomationRuntimeSettingsSnapshot,
  AutomationSimulationRequest,
  AutomationSimulationResult,
  AutomationTemplateManagementAdapter,
  AutomationTemplateVersion,
  ManagedAutomationRun,
  ManagedAutomationTemplate,
} from './contracts';
import { AutomationTemplateAdapterUnavailableError } from './adapter';

export type HttpAutomationTemplateEndpointMap = {
  templates?: string;
  templateDetail?: (templateId: string) => string;
  templateVersions?: (templateId: string) => string;
  templateActionPreview?: string;
  templateActionExecute?: string;
  templateSimulation?: string;
  runtimeSettings?: string;
  runtimeSettingsPreview?: string;
  runtimeSettingsSave?: string;
  runs?: string;
  runDetail?: (runId: string) => string;
  runRetry?: (runId: string) => string;
  runCancel?: (runId: string) => string;
};

export type HttpAutomationTemplateAdapterConfig = {
  baseUrl: string;
  endpoints: HttpAutomationTemplateEndpointMap;
  fetchImpl?: typeof fetch;
  headers?: HeadersInit | ((signal?: AbortSignal) => HeadersInit | Promise<HeadersInit>);
};

type ApiEnvelope<T> = {
  data?: T;
  items?: T extends Array<infer Item> ? Item[] : never;
  nextCursor?: string;
  previousCursor?: string;
  total?: number;
  authoritativeAt?: string;
  error?: NormalizedApiError;
  partialFailures?: NormalizedApiError['partialFailures'];
};

const resolveUrl = (baseUrl: string, path: string) => new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();

function appendListQuery(path: string, query: ListQuery): string {
  const url = new URL(path, 'https://placeholder.invalid');
  if (query.cursor) url.searchParams.set('cursor', query.cursor);
  if (query.limit !== undefined) url.searchParams.set('limit', String(query.limit));
  for (const [field, value] of Object.entries(query.filters ?? {})) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) url.searchParams.append(`filter[${field}]`, String(item));
  }
  for (const sort of query.sort ?? []) url.searchParams.append('sort', `${sort.field}:${sort.direction}`);
  for (const include of query.include ?? []) url.searchParams.append('include', include);
  return `${url.pathname}${url.search}`;
}

async function normalizeResponseError(response: Response): Promise<never> {
  let body: unknown;
  try { body = await response.json(); } catch { body = undefined; }
  const candidate = typeof body === 'object' && body !== null ? body as { error?: Partial<NormalizedApiError>; message?: string } : undefined;
  const message = candidate?.error?.message ?? candidate?.message ?? `Automation Template API request failed with HTTP ${response.status}.`;
  const kind: NormalizedApiError['kind'] = response.status === 401 || response.status === 403
    ? 'permission'
    : response.status === 409 || response.status === 412
      ? 'conflict'
      : response.status === 400 || response.status === 422
        ? 'validation'
        : response.status === 408 || response.status === 504
          ? 'timeout'
          : response.status === 429 || response.status >= 500
            ? 'unavailable'
            : 'unknown';
  const error = new Error(message) as Error & { normalized: NormalizedApiError };
  error.normalized = {
    kind,
    message,
    status: response.status,
    requestId: response.headers.get('x-request-id') ?? undefined,
    retryable: candidate?.error?.retryable ?? (response.status === 408 || response.status === 429 || response.status >= 500),
    validation: candidate?.error?.validation,
    partialFailures: candidate?.error?.partialFailures,
    currentVersion: candidate?.error?.currentVersion ?? response.headers.get('etag') ?? undefined,
  };
  throw error;
}

export function createHttpAutomationTemplateManagementAdapter(config: HttpAutomationTemplateAdapterConfig): AutomationTemplateManagementAdapter {
  const fetchImpl = config.fetchImpl ?? fetch;

  const requireEndpoint = (path: string | undefined, name: string) => {
    if (!path) throw new AutomationTemplateAdapterUnavailableError(`Automation Template HTTP endpoint '${name}' is not mapped.`);
    return path;
  };

  const getHeaders = async (signal?: AbortSignal) => {
    const source = typeof config.headers === 'function' ? await config.headers(signal) : config.headers;
    return new Headers(source);
  };

  const request = async <T>(
    path: string,
    init: RequestInit = {},
    context?: MutationContext,
    signal?: AbortSignal,
    preserveEnvelope = false,
  ): Promise<T> => {
    const headers = await getHeaders(signal);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    if (context?.ifMatch) headers.set('If-Match', context.ifMatch);
    if (context?.expectedVersion) headers.set('X-Expected-Version', context.expectedVersion);
    if (context?.idempotencyKey) headers.set('Idempotency-Key', context.idempotencyKey);
    if (context?.clientRequestId) headers.set('X-Client-Request-Id', context.clientRequestId);
    let response: Response;
    try {
      response = await fetchImpl(resolveUrl(config.baseUrl, path), { ...init, headers, signal });
    } catch (reason: unknown) {
      const aborted = typeof DOMException !== 'undefined' && reason instanceof DOMException && reason.name === 'AbortError';
      const normalized: NormalizedApiError = {
        kind: aborted ? 'timeout' : reason instanceof TypeError ? 'offline' : 'unknown',
        message: reason instanceof Error ? reason.message : String(reason),
        retryable: aborted || reason instanceof TypeError,
      };
      const error = new Error(normalized.message) as Error & { normalized: NormalizedApiError };
      error.normalized = normalized;
      throw error;
    }
    if (!response.ok) return normalizeResponseError(response);
    if (response.status === 204) return undefined as T;
    const body = await response.json() as ApiEnvelope<T> | T;
    if (preserveEnvelope) return body as T;
    const data = typeof body === 'object' && body !== null && 'data' in body ? (body as ApiEnvelope<T>).data : body as T;
    if (data && typeof data === 'object' && !Array.isArray(data) && !('etag' in data)) {
      const etag = response.headers.get('etag');
      if (etag) Object.assign(data as object, { etag });
    }
    return data as T;
  };

  const list = async <T>(path: string, query: ListQuery, signal?: AbortSignal) => {
    const response = await request<ApiEnvelope<T[]> | T[]>(appendListQuery(path, query), { method: 'GET' }, undefined, signal, true);
    if (Array.isArray(response)) return { items: response, authoritativeAt: new Date().toISOString() };
    const envelope = response as ApiEnvelope<T[]>;
    return {
      items: Array.isArray(envelope.data) ? envelope.data : envelope.items ?? [],
      nextCursor: envelope.nextCursor,
      previousCursor: envelope.previousCursor,
      total: envelope.total,
      partialFailures: envelope.partialFailures,
      authoritativeAt: envelope.authoritativeAt ?? new Date().toISOString(),
    };
  };

  return {
    listTemplates: async (query, signal) => list<ManagedAutomationTemplate>(requireEndpoint(config.endpoints.templates, 'templates'), query, signal),
    getTemplate: async (templateId, signal) => request<ManagedAutomationTemplate>(requireEndpoint(config.endpoints.templateDetail?.(templateId), 'templateDetail'), { method: 'GET' }, undefined, signal),
    listTemplateVersions: async (templateId, query, signal) => list<AutomationTemplateVersion>(requireEndpoint(config.endpoints.templateVersions?.(templateId), 'templateVersions'), query, signal),
    previewTemplateAction: async (input, signal) => request<ImpactPreview>(requireEndpoint(config.endpoints.templateActionPreview, 'templateActionPreview'), { method: 'POST', body: JSON.stringify(input) }, undefined, signal),
    executeTemplateAction: async (input, context, signal) => ({
      receipt: await request<QueuedReceipt>(requireEndpoint(config.endpoints.templateActionExecute, 'templateActionExecute'), { method: 'POST', body: JSON.stringify(input) }, context, signal),
    }),
    refreshTemplate: async (templateId, receiptId, signal) => {
      const path = requireEndpoint(config.endpoints.templateDetail?.(templateId), 'templateDetail');
      return request<ManagedAutomationTemplate>(receiptId ? appendListQuery(path, { filters: { receiptId } }) : path, { method: 'GET' }, undefined, signal);
    },
    simulateTemplate: async (input: AutomationSimulationRequest, context, signal) => request<AutomationSimulationResult>(requireEndpoint(config.endpoints.templateSimulation, 'templateSimulation'), { method: 'POST', body: JSON.stringify(input) }, context, signal),
    getRuntimeSettings: async (signal) => request<AutomationRuntimeSettingsSnapshot>(requireEndpoint(config.endpoints.runtimeSettings, 'runtimeSettings'), { method: 'GET' }, undefined, signal),
    previewRuntimeSettings: async (patch: Partial<Record<AutomationRuntimeSettingKey, AutomationRuntimeSetting['effectiveValue']>>, signal) => request<ImpactPreview>(requireEndpoint(config.endpoints.runtimeSettingsPreview, 'runtimeSettingsPreview'), { method: 'POST', body: JSON.stringify({ patch }) }, undefined, signal),
    saveRuntimeSettings: async (patch, context, signal) => ({
      receipt: await request<QueuedReceipt>(requireEndpoint(config.endpoints.runtimeSettingsSave, 'runtimeSettingsSave'), { method: 'PATCH', body: JSON.stringify({ patch }) }, context, signal),
    }),
    refreshRuntimeSettings: async (receiptId, signal) => {
      const path = requireEndpoint(config.endpoints.runtimeSettings, 'runtimeSettings');
      return request<AutomationRuntimeSettingsSnapshot>(receiptId ? appendListQuery(path, { filters: { receiptId } }) : path, { method: 'GET' }, undefined, signal);
    },
    listRuns: async (query, signal) => list<ManagedAutomationRun>(requireEndpoint(config.endpoints.runs, 'runs'), query, signal),
    getRun: async (runId, signal) => request<ManagedAutomationRun>(requireEndpoint(config.endpoints.runDetail?.(runId), 'runDetail'), { method: 'GET' }, undefined, signal),
    retryRun: async (runId, context, signal) => request<QueuedReceipt>(requireEndpoint(config.endpoints.runRetry?.(runId), 'runRetry'), { method: 'POST', body: JSON.stringify({}) }, context, signal),
    cancelRun: async (runId, context, signal) => request<QueuedReceipt>(requireEndpoint(config.endpoints.runCancel?.(runId), 'runCancel'), { method: 'POST', body: JSON.stringify({}) }, context, signal),
  };
}
