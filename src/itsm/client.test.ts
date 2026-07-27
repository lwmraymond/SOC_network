import { describe, expect, it } from 'vitest';
import { createFixtureItsmAdapter, createFixtureItsmStore } from './client';
import type { MutationContext } from './contracts';

const context: MutationContext = {
  idempotencyKey: 'test-idempotency-key',
  ifMatch: 'W/"inc-7001-12"',
  expectedVersion: '12',
};

describe('development fixture ITSM adapter', () => {
  it('rehydrates ephemeral public and internal comments without claiming authority', async () => {
    const store = createFixtureItsmStore();
    const adapter = createFixtureItsmAdapter(store);
    const initial = await adapter.getTicket('INC-7001');

    expect(initial.comments.some((comment) => comment.visibility === 'public')).toBe(true);
    expect(initial.comments.some((comment) => comment.visibility === 'internal')).toBe(true);
    expect(initial.comments.find((comment) => comment.source === 'email')?.sourceMessageId).toBe('<msg-7001@example.invalid>');

    const attachment = await adapter.createAttachmentPlaceholder('INC-7001', 'review-evidence.txt', context);
    expect(attachment.authoritative).toBe(false);
    expect(attachment.resource?.uploadState).toBe('placeholder');

    const publicResult = await adapter.createComment('INC-7001', {
      visibility: 'public',
      body: 'Public update for @requester.',
      mentions: ['requester'],
      attachmentIds: attachment.resource ? [attachment.resource.id] : [],
    }, context);
    expect(publicResult.authoritative).toBe(false);
    expect(publicResult.receipt.state).toBe('queued');

    const internalResult = await adapter.createComment('INC-7001', {
      visibility: 'internal',
      body: 'Internal note for @identity-oncall.',
      mentions: ['identity-oncall'],
      attachmentIds: [],
    }, context);
    expect(internalResult.authoritative).toBe(false);

    const refreshed = await adapter.refreshTicket('INC-7001', publicResult.receipt.receiptId);
    const publicComment = refreshed.comments.find((comment) => comment.body.includes('Public update'));
    const internalComment = refreshed.comments.find((comment) => comment.body.includes('Internal note'));

    expect(publicComment?.visibility).toBe('public');
    expect(publicComment?.mentions).toEqual(['requester']);
    expect(publicComment?.attachmentIds).toEqual(attachment.resource ? [attachment.resource.id] : []);
    expect(internalComment?.visibility).toBe('internal');
    expect(internalComment?.mentions).toEqual(['identity-oncall']);
    expect(refreshed.attachments.some((item) => item.filename === 'review-evidence.txt' && item.uploadState === 'placeholder')).toBe(true);
  });

  it('creates a type-correct ephemeral detail record for queue identifiers', async () => {
    const adapter = createFixtureItsmAdapter();
    const incident = await adapter.getTicket('INC-5299');
    const request = await adapter.getTicket('REQ-6299');
    const problem = await adapter.getTicket('PRB-3399');
    const change = await adapter.getTicket('CHG-8299');

    expect(incident.ticket.kind).toBe('incident');
    expect(request.ticket.kind).toBe('request');
    expect(problem.ticket.kind).toBe('problem');
    expect(change.ticket.kind).toBe('change');
    expect(incident.ticket.key).toBe('INC-5299');
  });
});
