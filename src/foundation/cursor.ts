import type { FilterCondition, FilterGroup } from './filters';
import type { QueryEnvelope, QueryNode } from './query';

export type CursorError = 'NETWORK' | 'DENIED' | 'TIMEOUT' | 'CANCELLED' | 'INVALID_REQUEST';

export type CursorRequest = {
  query: QueryEnvelope;
  filters: FilterGroup;
  cursor?: string;
  direction?: 'next' | 'previous';
  limit: number;
  sort: QueryEnvelope['sort'];
  signal?: AbortSignal;
};

export type CursorResponse<T> = {
  items: T[];
  nextCursor?: string;
  previousCursor?: string;
  totalCount?: number;
  approximateCount?: number;
  coverage: number;
  partial: boolean;
  stale: boolean;
  requestId: string;
  executionId: string;
  error?: { classification: CursorError; message: string; retryable: boolean };
};

export interface ServerCursorAdapter<T> {
  search(request: CursorRequest): Promise<CursorResponse<T>>;
  retry(requestId: string, signal?: AbortSignal): Promise<CursorResponse<T>>;
}

type CursorToken = { anchor: string; direction: 'next' | 'previous' };
type SearchableRow = { id: string } & Record<string, unknown>;

const encodeCursor = (token: CursorToken) => btoa(JSON.stringify(token));
const decodeCursor = (cursor: string): CursorToken | undefined => {
  try {
    const value = JSON.parse(atob(cursor)) as Partial<CursorToken>;
    if (typeof value.anchor !== 'string' || (value.direction !== 'next' && value.direction !== 'previous')) return undefined;
    return value as CursorToken;
  } catch {
    return undefined;
  }
};

const text = (value: unknown) => String(value ?? '').toLowerCase();

function compare(actual: unknown, operator: string, expected: unknown) {
  const actualText = text(actual);
  const expectedValues = Array.isArray(expected) ? expected.map(text) : [text(expected)];
  if (operator === ':' || operator === '=') return expectedValues.some((value) => actualText === value || actualText.includes(value));
  if (operator === '!=') return expectedValues.every((value) => actualText !== value && !actualText.includes(value));
  if (operator === 'PREFIX') return expectedValues.some((value) => actualText.startsWith(value));

  const actualNumber = Date.parse(String(actual)) || Number(actual);
  const expectedNumber = Date.parse(String(expected)) || Number(expected);
  if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) return false;
  if (operator === '>') return actualNumber > expectedNumber;
  if (operator === '>=') return actualNumber >= expectedNumber;
  if (operator === '<') return actualNumber < expectedNumber;
  if (operator === '<=') return actualNumber <= expectedNumber;
  return false;
}

function matchesQuery(row: SearchableRow, node: QueryNode | null): boolean {
  if (!node) return true;
  if (node.kind === 'term') return Object.values(row).some((value) => text(value).includes(text(node.value)));
  if (node.kind === 'condition') return compare(row[node.field], node.operator, node.value);
  if (node.kind === 'not') return !matchesQuery(row, node.child);
  const matches = node.children.map((child) => matchesQuery(row, child));
  return node.operator === 'AND' ? matches.every(Boolean) : matches.some(Boolean);
}

function matchesCondition(row: SearchableRow, condition: FilterCondition) {
  const result = compare(row[condition.field], condition.operator, condition.value);
  return condition.exclude ? !result : result;
}

function matchesFilters(row: SearchableRow, group: FilterGroup): boolean {
  if (group.children.length === 0) return true;
  const values = group.children.map((child) => child.kind === 'group' ? matchesFilters(row, child) : matchesCondition(row, child));
  return group.operator === 'AND' ? values.every(Boolean) : values.some(Boolean);
}

export class FixtureCursorAdapter<T extends { id: string }> implements ServerCursorAdapter<T> {
  private readonly requests = new Map<string, CursorRequest>();

  constructor(private readonly sourceRows: T[]) {}

  async search(request: CursorRequest): Promise<CursorResponse<T>> {
    if (request.signal?.aborted) return this.error('CANCELLED', 'Cancelled', false);
    const requestId = `req-${crypto.randomUUID()}`;
    this.requests.set(requestId, request);

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 25);
      request.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });

    if (request.signal?.aborted) return this.error('CANCELLED', 'Cancelled', false, requestId);
    if (request.query.raw === 'network:error') return this.error('NETWORK', 'Fixture network failure', true, requestId);
    if (request.query.raw === 'denied:true') return this.error('DENIED', 'Dataset denied', false, requestId);

    let rows = this.sourceRows
      .filter((row) => matchesQuery(row as SearchableRow, request.query.ast))
      .filter((row) => matchesFilters(row as SearchableRow, request.filters));

    for (const sort of [...request.sort].reverse()) {
      rows = [...rows].sort((a, b) => text((a as SearchableRow)[sort.field]).localeCompare(text((b as SearchableRow)[sort.field])) * (sort.direction === 'asc' ? 1 : -1));
    }

    let start = 0;
    if (request.cursor) {
      const token = decodeCursor(request.cursor);
      if (!token) return this.error('INVALID_REQUEST', 'Cursor is malformed or expired.', false, requestId);
      const anchorIndex = rows.findIndex((row) => row.id === token.anchor);
      if (anchorIndex < 0) return this.error('INVALID_REQUEST', 'Cursor anchor is no longer in the result set.', true, requestId);
      start = token.direction === 'next' ? anchorIndex + 1 : Math.max(0, anchorIndex - request.limit);
    }

    const items = rows.slice(start, start + request.limit);
    const first = items[0];
    const last = items.at(-1);
    const partial = request.query.raw === 'partial:true';
    const stale = request.query.raw === 'stale:true';

    return {
      items,
      nextCursor: last && start + items.length < rows.length ? encodeCursor({ anchor: last.id, direction: 'next' }) : undefined,
      previousCursor: first && start > 0 ? encodeCursor({ anchor: first.id, direction: 'previous' }) : undefined,
      totalCount: partial ? undefined : rows.length,
      approximateCount: partial ? Math.max(rows.length, Math.round(rows.length / 0.72)) : undefined,
      coverage: partial ? 0.72 : 1,
      partial,
      stale,
      requestId,
      executionId: `exec-${crypto.randomUUID()}`,
    };
  }

  async retry(requestId: string, signal?: AbortSignal) {
    const request = this.requests.get(requestId);
    if (!request) return this.error('INVALID_REQUEST', 'Unknown request', false);
    return this.search({ ...request, signal });
  }

  private error(classification: CursorError, message: string, retryable: boolean, requestId = `req-${crypto.randomUUID()}`): CursorResponse<T> {
    return {
      items: [],
      coverage: 0,
      partial: false,
      stale: false,
      requestId,
      executionId: `exec-${crypto.randomUUID()}`,
      error: { classification, message, retryable },
    };
  }
}
