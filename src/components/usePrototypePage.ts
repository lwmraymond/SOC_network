import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isPrototypeMode, loadPrototypePage } from '../prototype/runtime';
import type { PrototypePageFixture } from '../types/prototype';

export type PrototypeViewState = 'ready' | 'loading' | 'empty' | 'filtered-empty' | 'error' | 'denied' | 'offline' | 'stale' | 'degraded' | 'partial';

const allowedStates: PrototypeViewState[] = ['ready','loading','empty','filtered-empty','error','denied','offline','stale','degraded','partial'];

export function usePrototypePage(pageId: string) {
  const [params, setParams] = useSearchParams();
  const rawState = params.get('state') as PrototypeViewState | null;
  const viewState = rawState && allowedStates.includes(rawState) ? rawState : 'ready';
  const [fixture, setFixture] = useState<PrototypePageFixture>();
  const [adapterError, setAdapterError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    loadPrototypePage(pageId)
      .then((value) => { if (!cancelled) { setFixture(value); setAdapterError(undefined); } })
      .catch((error: unknown) => { if (!cancelled) setAdapterError(error instanceof Error ? error.message : String(error)); });
    return () => { cancelled = true; };
  }, [pageId]);

  const setViewState = useCallback((next: PrototypeViewState) => {
    const updated = new URLSearchParams(params);
    if (next === 'ready') updated.delete('state'); else updated.set('state', next);
    setParams(updated, { replace: false });
  }, [params, setParams]);

  useEffect(() => {
    const requestedScroll = Number(params.get('scroll'));
    if (!fixture || !Number.isFinite(requestedScroll) || requestedScroll <= 0) return;
    const frame = requestAnimationFrame(() => window.scrollTo({ top: requestedScroll, behavior: 'auto' }));
    return () => cancelAnimationFrame(frame);
  }, [fixture, params]);

  return { fixture, adapterError, isPrototypeMode, viewState, setViewState, params, setParams };
}
