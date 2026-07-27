import { describe, expect, it, vi } from 'vitest';
import { normalizeItsmError } from './client';
import { createHttpItsmAdapter } from './httpAdapter';

describe('HTTP ITSM adapter framework', () => {
  it('fails closed when an operation has no verified mapping', async () => {
    const adapter = createHttpItsmAdapter({ baseUrl: 'https://itsm.example.invalid/', endpoints: {} });
    await expect(adapter.listTickets({})).rejects.toMatchObject({ name: 'ItsmAdapterUnavailableError' });
  });

  it('injects list query, auth, optimistic concurrency and idempotency headers', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      expect(url).toContain('cursor=next-1');
      expect(url).toContain('limit=25');
      expect(url).toContain('filter%5Bstatus%5D=open');
      expect(url).toContain('sort=updatedAt%3Adesc');
      expect(url).toContain('include=comments');
      const headers = new Headers(init?.headers);
      expect(headers.get('authorization')).toBe('Bearer review-token');
      return new Response(JSON.stringify({ items: [], total: 0, authoritativeAt: '2026-07-27T00:00:00.000Z' }), { status: 200, headers: { 'content-type': 'application/json', 'x-request-id': 'request-list' } });
    });
    const adapter = createHttpItsmAdapter({
      baseUrl: 'https://itsm.example.invalid/api/',
      endpoints: { listTickets: { method: 'GET', path: 'tickets' } },
      fetchImpl: fetchImpl as typeof fetch,
      getAuthHeaders: () => ({ Authorization: 'Bearer review-token' }),
    });
    await adapter.listTickets({ cursor: 'next-1', limit: 25, filters: { status: 'open' }, sort: [{ field: 'updatedAt', direction: 'desc' }], include: ['comments'] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('sends If-Match and Idempotency-Key for governed writes', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('if-match')).toBe('W/"inc-7001-12"');
      expect(headers.get('idempotency-key')).toBe('idem-1');
      expect(headers.get('x-expected-version')).toBe('12');
      return new Response(JSON.stringify({ receipt: { receiptId: 'receipt-1', operation: 'ticket.update', state: 'queued', submittedAt: '2026-07-27T00:00:00.000Z', authoritative: false }, authoritative: false }), { status: 202, headers: { 'content-type': 'application/json' } });
    });
    const adapter = createHttpItsmAdapter({
      baseUrl: 'https://itsm.example.invalid/',
      endpoints: { updateTicket: { method: 'PATCH', path: 'tickets/{ticketId}' } },
      fetchImpl: fetchImpl as typeof fetch,
    });
    const result = await adapter.updateTicket('inc-7001', { status: 'pending' }, { idempotencyKey: 'idem-1', ifMatch: 'W/"inc-7001-12"', expectedVersion: '12' });
    expect(result.authoritative).toBe(false);
  });

  it('normalizes validation and conflict responses with request metadata', async () => {
    const adapter = createHttpItsmAdapter({
      baseUrl: 'https://itsm.example.invalid/',
      endpoints: { updateTicket: { method: 'PATCH', path: 'tickets/{ticketId}' } },
      fetchImpl: async () => new Response(JSON.stringify({ message: 'Version conflict', currentVersion: '13' }), { status: 412, headers: { 'content-type': 'application/json', 'x-request-id': 'request-conflict', etag: 'W/"inc-7001-13"' } }),
    });
    try {
      await adapter.updateTicket('inc-7001', { status: 'pending' }, { idempotencyKey: 'idem-2' });
      throw new Error('Expected adapter call to fail.');
    } catch (error: unknown) {
      const normalized = normalizeItsmError(error);
      expect(normalized.kind).toBe('conflict');
      expect(normalized.requestId).toBe('request-conflict');
      expect(normalized.currentVersion).toBe('W/"inc-7001-13"');
    }
  });
});
