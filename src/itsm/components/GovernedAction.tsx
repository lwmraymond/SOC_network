import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { EuiButton, EuiButtonEmpty, EuiCallOut, EuiLoadingSpinner, EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiSpacer } from '@elastic/eui';
import type { ImpactPreview, QueuedReceipt } from '../contracts';
import { getItsmAdapterMode } from '../client';
import { useItsmMutation } from '../hooks';

type GovernedActionTrigger = (options: { onClick: () => void; isDisabled: boolean }) => ReactNode;

export function GovernedAction<T>({
  label,
  fill,
  color = 'primary',
  isDisabled = false,
  preview,
  execute,
  rehydrate,
  onComplete,
  renderTrigger,
  autoOpen = false,
  onClose,
}: {
  label: string;
  fill?: boolean;
  color?: 'primary' | 'warning' | 'danger';
  isDisabled?: boolean;
  preview: (signal: AbortSignal) => Promise<ImpactPreview>;
  execute: (signal: AbortSignal) => Promise<{ receipt: QueuedReceipt }>;
  rehydrate: (receipt: QueuedReceipt, signal: AbortSignal) => Promise<T>;
  onComplete?: (value: T) => void;
  renderTrigger?: GovernedActionTrigger;
  autoOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const autoStarted = useRef(false);
  const mutation = useItsmMutation<Record<string, never>, T>({
    preview: (_input, signal) => preview(signal),
    execute: (_input, signal) => execute(signal),
    rehydrate: async (_input, receipt, signal) => {
      const value = await rehydrate(receipt, signal);
      onComplete?.(value);
      return value;
    },
  });
  const requestPreview = mutation.requestPreview;
  const close = () => {
    setOpen(false);
    mutation.reset();
    onClose?.();
  };
  const start = useCallback(() => {
    if (isDisabled) return;
    setOpen(true);
    void requestPreview({});
  }, [isDisabled, requestPreview]);
  useEffect(() => {
    if (autoOpen && !autoStarted.current && !isDisabled) {
      autoStarted.current = true;
      start();
    }
  }, [autoOpen, isDisabled, start]);
  const mode = getItsmAdapterMode();

  return <>
    {renderTrigger
      ? renderTrigger({ onClick: start, isDisabled })
      : !autoOpen && <EuiButton fill={fill} color={color} isDisabled={isDisabled} onClick={start}>{label}</EuiButton>}
    {open && <EuiModal onClose={close} aria-labelledby="governed-action-title">
      <EuiModalHeader><EuiModalHeaderTitle id="governed-action-title">Impact preview and governed write</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody>
        {mutation.state.stage === 'previewing' && <div className="itsmCenteredState"><EuiLoadingSpinner /><span>Calculating validation, permissions and affected resources…</span></div>}
        {mutation.state.preview && <>
          <EuiCallOut title={mutation.state.preview.summary} color={mutation.state.preview.validation.some((item) => item.severity === 'error') ? 'danger' : 'warning'}>Preview only. No production resource has changed.</EuiCallOut>
          <EuiSpacer />
          <dl className="itsmDefinitionGrid">
            <div><dt>Operation</dt><dd>{mutation.state.preview.operation}</dd></div>
            <div><dt>Expires</dt><dd>{mutation.state.preview.expiresAt}</dd></div>
            <div><dt>Affected resources</dt><dd>{mutation.state.preview.affectedResources.map((item) => `${item.type}:${item.id} (${item.effect})`).join(', ')}</dd></div>
            <div><dt>Warnings</dt><dd>{mutation.state.preview.warnings.join(' ') || 'None'}</dd></div>
          </dl>
        </>}
        {['confirming', 'queued', 'rehydrating'].includes(mutation.state.stage) && <EuiCallOut title={mutation.state.stage === 'confirming' ? 'Submitting idempotent write' : mutation.state.stage === 'queued' ? 'Queued receipt received' : 'Refreshing resource'} color="warning">{mutation.state.receipt ? `${mutation.state.receipt.receiptId} · state ${mutation.state.receipt.state}. This is not completion.` : 'Waiting for adapter response.'}</EuiCallOut>}
        {mutation.state.stage === 'complete' && <EuiCallOut title="Refresh cycle completed" color={mode === 'production' ? 'success' : 'warning'}>{mode === 'development-fixture' ? 'Ephemeral development state was re-read. authoritative:false; nothing was persisted to a production service.' : 'The configured adapter returned its refreshed resource.'}</EuiCallOut>}
        {mutation.state.error && <EuiCallOut title="Write failed" color="danger">{mutation.state.error.message}</EuiCallOut>}
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={close}>Close</EuiButtonEmpty>
        {mutation.state.stage === 'preview' && <EuiButton fill onClick={() => void mutation.confirm()} isDisabled={Boolean(mutation.state.preview?.validation.some((item) => item.severity === 'error'))}>Confirm queued write</EuiButton>}
      </EuiModalFooter>
    </EuiModal>}
  </>;
}
