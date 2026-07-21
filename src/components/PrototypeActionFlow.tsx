import { useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckbox,
  EuiFieldText,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiSteps,
  EuiText,
} from '@elastic/eui';
import type { PageSpec } from '../catalog/pageSpecs';

export type PrototypeReceipt = {
  receiptId: string;
  requestId: string;
  status: 'submitted' | 'accepted' | 'queued';
  action: string;
  target: string;
  prototypeSimulation: true;
};

export function PrototypeActionFlow({ spec, open, onClose, onReceipt }: { spec: PageSpec; open: boolean; onClose(): void; onReceipt(receipt: PrototypeReceipt): void }) {
  const [reason, setReason] = useState('Design review simulation');
  const [confirmed, setConfirmed] = useState(false);
  const steps = useMemo(() => [
    { title: 'Preconditions', children: <EuiText size="s"><p>Capability, authoritative revision and source freshness would be checked by the production policy/action services.</p></EuiText> },
    { title: 'Input and validation', children: <EuiFieldText aria-label="Action reason" value={reason} onChange={(event) => setReason(event.target.value)} /> },
    { title: 'Impact preview', children: <EuiText size="s"><p>Target: {spec.title}. No external system or production data will be changed.</p></EuiText> },
    { title: 'Approval and confirmation', children: <EuiCheckbox id={`${spec.id}-confirm`} label="I understand this is a prototype simulation only" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> },
  ], [confirmed, reason, spec]);
  if (!open) return null;
  const submit = () => {
    onReceipt({ receiptId: `prototype-receipt-${spec.id.toLowerCase()}`, requestId: `prototype-request-${spec.id.toLowerCase()}`, status: 'queued', action: spec.primaryAction, target: spec.id, prototypeSimulation: true });
    onClose();
  };
  return (
    <EuiModal data-overlay-semantic="governed-primary-action" onClose={onClose} aria-labelledby={`${spec.id}-action-title`} maxWidth={720}>
      <EuiModalHeader><EuiModalHeaderTitle id={`${spec.id}-action-title`}>{spec.primaryAction}</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody>
        <EuiCallOut title="Prototype simulation · no production mutation" color="warning">
          This flow demonstrates validation, impact, approval, confirmation and receipt semantics. It does not call a production API and does not mean an external system accepted or completed the action.
        </EuiCallOut>
        <EuiSpacer />
        <EuiSteps steps={steps} titleSize="xs" />
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        <EuiButton fill onClick={submit} isDisabled={!confirmed || !reason.trim()}>Create prototype receipt</EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
}
