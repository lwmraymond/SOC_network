import type { TicketKind } from './contracts';

const defaultTicketByKind: Record<TicketKind, string> = {
  request: 'REQ-6201',
  incident: 'INC-7001',
  problem: 'PRB-3104',
  change: 'CHG-4208',
};

export function ticketKindFromLabel(value: string): TicketKind {
  const normalized = value.toLowerCase();
  if (normalized.includes('request')) return 'request';
  if (normalized.includes('problem')) return 'problem';
  if (normalized.includes('change')) return 'change';
  return 'incident';
}

export function ticketKeyForDetail(kind: TicketKind, candidate?: string): string {
  const value = candidate?.trim();
  if (value && /^(REQ|INC|PRB|CHG)-[A-Z0-9-]+$/i.test(value)) return value.toUpperCase();
  return defaultTicketByKind[kind];
}

export function ticketDetailHref(ticketKey: string, returnTo: string, parentLabel?: string): string {
  const params = new URLSearchParams({ returnTo });
  if (parentLabel) params.set('parentLabel', parentLabel);
  return `/itsm/tickets/${encodeURIComponent(ticketKey)}?${params.toString()}`;
}

export function safeItsmReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/itsm/') || value.startsWith('/itsm/tickets/')) return '/itsm/queues';
  return value;
}
