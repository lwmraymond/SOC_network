import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImpactPreview, NormalizedApiError, QueuedReceipt, ViewState } from './contracts';
import { normalizeItsmError } from './client';

export type ItsmQueryResult<T> = {
  data?: T;
  state: ViewState;
  error?: NormalizedApiError;
  refresh: () => void;
  refreshedAt?: string;
};

export function useItsmQuery<T>(load: (signal: AbortSignal) => Promise<T>, dependencies: readonly unknown[] = []): ItsmQueryResult<T> {
  const [data, setData] = useState<T>();
  const [state, setState] = useState<ViewState>('loading');
  const [error, setError] = useState<NormalizedApiError>();
  const [refreshedAt, setRefreshedAt] = useState<string>();
  const [revision, setRevision] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  const dependencyKey = dependencies.map((value) => String(value)).join('\u001f');

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setError(undefined);
    loadRef.current(controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return;
        setData(value);
        setState(Array.isArray(value) && value.length === 0 ? 'empty' : 'ready');
        setRefreshedAt(new Date().toISOString());
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        const normalized = normalizeItsmError(reason);
        setError(normalized);
        setState(normalized.kind === 'permission' ? 'denied' : normalized.kind === 'offline' ? 'offline' : 'error');
      });
    return () => controller.abort();
  }, [dependencyKey, revision]);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  return { data, state, error, refresh, refreshedAt };
}

export type MutationStage = 'idle' | 'previewing' | 'preview' | 'confirming' | 'queued' | 'rehydrating' | 'complete' | 'error';

export type ItsmMutationState<T> = {
  stage: MutationStage;
  preview?: ImpactPreview;
  receipt?: QueuedReceipt;
  authoritative?: T;
  error?: NormalizedApiError;
};

export function useItsmMutation<TInput, TResult>(options: {
  preview: (input: TInput, signal: AbortSignal) => Promise<ImpactPreview>;
  execute: (input: TInput, signal: AbortSignal) => Promise<{ receipt: QueuedReceipt }>;
  rehydrate: (input: TInput, receipt: QueuedReceipt, signal: AbortSignal) => Promise<TResult>;
}) {
  const [state, setState] = useState<ItsmMutationState<TResult>>({ stage: 'idle' });
  const inputRef = useRef<TInput | undefined>(undefined);
  const controllerRef = useRef<AbortController | undefined>(undefined);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    inputRef.current = undefined;
    setState({ stage: 'idle' });
  }, []);

  const requestPreview = useCallback(async (input: TInput) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    inputRef.current = input;
    setState({ stage: 'previewing' });
    try {
      const preview = await options.preview(input, controller.signal);
      if (!controller.signal.aborted) setState({ stage: 'preview', preview });
    } catch (error: unknown) {
      if (!controller.signal.aborted) setState({ stage: 'error', error: normalizeItsmError(error) });
    }
  }, [options]);

  const confirm = useCallback(async () => {
    const input = inputRef.current;
    if (input === undefined) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((current) => ({ ...current, stage: 'confirming' }));
    try {
      const { receipt } = await options.execute(input, controller.signal);
      if (controller.signal.aborted) return;
      setState((current) => ({ ...current, stage: 'queued', receipt }));
      setState((current) => ({ ...current, stage: 'rehydrating', receipt }));
      const authoritative = await options.rehydrate(input, receipt, controller.signal);
      if (!controller.signal.aborted) setState((current) => ({ ...current, stage: 'complete', receipt, authoritative }));
    } catch (error: unknown) {
      if (!controller.signal.aborted) setState((current) => ({ ...current, stage: 'error', error: normalizeItsmError(error) }));
    }
  }, [options]);

  return { state, requestPreview, confirm, reset };
}
