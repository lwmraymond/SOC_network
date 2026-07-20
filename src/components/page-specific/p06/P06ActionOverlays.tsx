import { EuiButton, EuiButtonEmpty, EuiCallOut, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture } from '../../../types/prototype';
import type { GovernedAction } from './model';

export function P06ActionOverlays({ action, fixture, detailOpen, approvalOpen, onCloseDetail, onCloseApproval, onDecision }: { action: GovernedAction; fixture: PrototypePageFixture; detailOpen: boolean; approvalOpen: boolean; onCloseDetail(): void; onCloseApproval(): void; onDecision(decision: string): void }) {
  return <>
    {detailOpen && <EuiFlyout ownFocus size="m" onClose={onCloseDetail} aria-labelledby="p06-action-detail-title">
      <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p06-action-detail-title">{action.actionType}</h2></EuiTitle><EuiText size="s" color="subdued"><p>{action.id} · {action.target}</p></EuiText></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title="Authoritative-state boundary" color="warning">This preview shows request, approval, execution and external observation as separate states.</EuiCallOut><EuiSpacer size="m" />
        <dl><div><dt>Case</dt><dd>{action.caseRef}</dd></div><div><dt>Requester</dt><dd>{action.requester}</dd></div><div><dt>Approver</dt><dd>{action.approver}</dd></div><div><dt>Execution</dt><dd>{action.execution}</dd></div><div><dt>External state</dt><dd>{action.authoritativeStatus}</dd></div><div><dt>Receipt</dt><dd>{action.receipt}</dd></div><div><dt>Rollback</dt><dd>{action.rollback}</dd></div></dl>
        <EuiSpacer size="m" /><EuiTitle size="xs"><h3>Latest execution log</h3></EuiTitle>
        {fixture.timeline.slice(0, 4).map((entry) => <EuiPanel key={`${entry.time}-${entry.title}`} paddingSize="s" hasBorder style={{ marginTop: 8 }}><strong>{entry.time} · {entry.title}</strong><EuiText size="xs" color="subdued"><p>{entry.detail}</p></EuiText></EuiPanel>)}
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiButtonEmpty onClick={onCloseDetail}>Close</EuiButtonEmpty><EuiButton fill onClick={() => { onCloseDetail(); onDecision('Case / ITSM synchronization request'); }}>Sync reference to Case / ITSM</EuiButton></EuiFlyoutFooter>
    </EuiFlyout>}

    {approvalOpen && <EuiModal onClose={onCloseApproval} aria-labelledby="p06-approval-title">
      <EuiModalHeader><EuiModalHeaderTitle id="p06-approval-title">Review governed action</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody><EuiCallOut title={`${action.risk} risk · ${action.actionType}`} color="warning">Target {action.target}; requester {action.requester}; policy expires {action.expires}.</EuiCallOut><EuiSpacer size="m" /><EuiText><p>Approving creates an approval receipt only. Execution, external confirmation and completion remain separate downstream states.</p></EuiText></EuiModalBody>
      <EuiModalFooter><EuiButtonEmpty onClick={() => onDecision('Decline')}>Decline</EuiButtonEmpty><EuiButton fill color="warning" onClick={() => onDecision('Approval')}>Approve prototype request</EuiButton></EuiModalFooter>
    </EuiModal>}
  </>;
}
