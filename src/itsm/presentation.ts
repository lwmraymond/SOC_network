import type { Ticket } from './contracts';

const mentionPattern = /@([\w-]+)/g;

export function extractMentions(body: string): string[] {
  return Array.from(new Set(Array.from(body.matchAll(mentionPattern)).map((match) => match[1])));
}

export function ticketKindLabel(ticket: Ticket): string {
  return ticket.kind === 'request' ? 'Service request' : `${ticket.kind[0].toUpperCase()}${ticket.kind.slice(1)}`;
}
