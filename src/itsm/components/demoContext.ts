import type { MutationContext } from '../contracts';

export function createDemoMutationContext(etag?: string, version?: string): MutationContext {
  return {
    idempotencyKey: `ui-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ifMatch: etag,
    expectedVersion: version,
    reason: 'Frontend governed-write review',
    clientRequestId: `review-${Math.random().toString(36).slice(2)}`,
  };
}
