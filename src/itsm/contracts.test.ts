import { describe, expect, it } from 'vitest';
import { ITSM_ENDPOINTS } from './contracts';
import {
  ItsmAdapterUnavailableError,
  fixtureAutomationRuns,
  fixtureDeliveries,
  fixtureMailboxes,
  fixtureSlaPolicies,
  fixtureTickets,
  normalizeItsmError,
} from './client';

describe('ITSM frontend contracts', () => {
  it('keeps every production endpoint unmapped until verified', () => {
    for (const endpoint of Object.values(ITSM_ENDPOINTS)) {
      expect(endpoint.status).toBe('tbd');
      expect('path' in endpoint ? endpoint.path : undefined).toBeUndefined();
    }
  });

  it('provides one differentiated fixture ticket for every supported kind', () => {
    expect(new Set(fixtureTickets.map((ticket) => ticket.kind))).toEqual(new Set(['request', 'incident', 'problem', 'change']));
    expect(new Set(fixtureTickets.map((ticket) => ticket.key)).size).toBe(fixtureTickets.length);

    const request = fixtureTickets.find((ticket) => ticket.kind === 'request');
    const incident = fixtureTickets.find((ticket) => ticket.kind === 'incident');
    const problem = fixtureTickets.find((ticket) => ticket.kind === 'problem');
    const change = fixtureTickets.find((ticket) => ticket.kind === 'change');

    expect(request && 'dynamicFields' in request).toBe(true);
    expect(incident && 'affectedObjectIds' in incident).toBe(true);
    expect(problem && 'rootCause' in problem).toBe(true);
    expect(change && 'rollbackPlan' in change).toBe(true);
  });

  it('models the complete SLA lifecycle rather than only a due date', () => {
    const policy = fixtureSlaPolicies.find((item) => item.id === 'sla-p2-resolution');
    expect(policy?.start.length).toBeGreaterThan(0);
    expect(policy?.pause.length).toBeGreaterThan(0);
    expect(policy?.resume.length).toBeGreaterThan(0);
    expect(policy?.stop.length).toBeGreaterThan(0);
  });

  it('never represents queued or dry-run activity as production completion', () => {
    expect(fixtureDeliveries.some((delivery) => delivery.state === 'queued')).toBe(true);
    expect(fixtureAutomationRuns.some((run) => run.dryRun)).toBe(true);
    expect(fixtureAutomationRuns.find((run) => run.dryRun)?.state).toBe('succeeded');
    expect(fixtureAutomationRuns.find((run) => run.dryRun)?.dryRun).toBe(true);
  });

  it('keeps messaging credentials out of fixture provider and mailbox records', () => {
    expect(fixtureMailboxes.every((mailbox) => mailbox.secretConfigured === false)).toBe(true);
    expect(fixtureMailboxes.every((mailbox) => !('password' in mailbox))).toBe(true);
  });

  it('normalizes an unmapped production operation as non-retryable unavailable', () => {
    const error = normalizeItsmError(new ItsmAdapterUnavailableError('listTickets'));
    expect(error.kind).toBe('unavailable');
    expect(error.retryable).toBe(false);
    expect(error.message).toContain('listTickets');
  });
});
