import { describe, expect, it, vi } from 'vitest';
import { normalizeItsmError } from '../client';
import { createHttpAutomationTemplateManagementAdapter } from './httpAdapter';

const context = { idempotencyKey: 'idempotency-1', ifMatch: 'W/"v1"', expectedVersion: '1', clientRequestId: 'client-1' };

describe('HTTP Automation Template adapter', () => {
  it('fails closed when an endpoint is not explicitly mapped', async () => {
    const adapter = createHttpAutomationTemplateManagementAdapter({ baseUrl: 'https://example.invalid', endpoints: {}, fetchImpl: vi.fn() as unknown as typeof fetch });
    await expect(adapter.getRuntimeSettings()).rejects.toMatchObject({ normalized: { kind: 'unavailable', retryable: false } });
  });

  it('serializes cursor/filter/sort/include and preserves page metadata', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.get('cursor')).toBe('next-1');
      expect(url.searchParams.get('limit')).toBe('25');
      expect(url.searchParams.getAll('filter[status]')).toEqual(['draft', 'validating']);
      expect(url.searchParams.getAll('sort')).toEqual(['updatedAt:desc']);
      expect(url.searchParams.getAll('include')).toEqual(['permissions', 'dependencyHealth']);
      return new Response(JSON.stringify({ data: [], nextCursor: 'next-2', total: 12, authoritativeAt: '2026-07-27T00:00:00.000Z', partialFailures: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const adapter = createHttpAutomationTemplateManagementAdapter({ baseUrl: 'https://example.invalid/api/', endpoints: { templates: 'automation/templates' }, fetchImpl: fetchImpl as unknown as typeof fetch });
    const page = await adapter.listTemplates({ cursor: 'next-1', limit: 25, filters: { status: ['draft', 'validating'] }, sort: [{ field: 'updatedAt', direction: 'desc' }], include: ['permissions', 'dependencyHealth'] });
    expect(page.nextCursor).toBe('next-2');
    expect(page.total).toBe(12);
  });

  it('injects auth, concurrency, idempotency and client-correlation headers for mapped writes', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return new Response(JSON.stringify({ data: { receiptId: 'receipt-1', operation: 'automation.template.archive', state: 'queued', submittedAt: '2026-07-27T00:00:00.000Z', authoritative: false } }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const adapter = createHttpAutomationTemplateManagementAdapter({
      baseUrl: 'https://example.invalid/api/',
      endpoints: { templateActionExecute: 'automation/template-actions' },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      headers: async () => ({ Authorization: 'Bearer test' }),
    });
    const result = await adapter.executeTemplateAction({ action: 'archive', templateId: 'template-1', reason: 'test' }, context);
    expect(result.receipt.state).toBe('queued');
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test');
    expect(headers.get('If-Match')).toBe('W/"v1"');
    expect(headers.get('Idempotency-Key')).toBe('idempotency-1');
    expect(headers.get('X-Expected-Version')).toBe('1');
    expect(headers.get('X-Client-Request-Id')).toBe('client-1');
  });

  it('normalizes permission, validation, conflict, partial and transport failures', async () => {
    const conflict = createHttpAutomationTemplateManagementAdapter({
      baseUrl: 'https://example.invalid/', endpoints: { templateActionExecute: 'action' },
      fetchImpl: async () => new Response(JSON.stringify({ message: 'Version conflict' }), { status: 412, headers: { 'content-type': 'application/json', etag: 'W/"v2"', 'x-request-id': 'request-2' } }),
    });
    try {
      await conflict.executeTemplateAction({ action: 'archive', templateId: 'template-1', reason: 'test' }, context);
      throw new Error('Expected conflict.');
    } catch (error: unknown) {
      expect(normalizeItsmError(error)).toMatchObject({ kind: 'conflict', currentVersion: 'W/"v2"', requestId: 'request-2' });
    }

    const offline = createHttpAutomationTemplateManagementAdapter({ baseUrl: 'https://example.invalid/', endpoints: { templates: 'templates' }, fetchImpl: async () => { throw new TypeError('network offline'); } });
    await expect(offline.listTemplates({})).rejects.toMatchObject({ normalized: { kind: 'offline', retryable: true } });
  });
});
