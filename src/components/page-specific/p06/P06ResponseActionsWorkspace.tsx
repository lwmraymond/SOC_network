import { useMemo, useState } from 'react';
import { EuiBadge, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiSelect, EuiSpacer, EuiText } from '@elastic/eui';
import { useSearchParams } from 'react-router-dom';
import type { PrototypePageFixture } from '../../../types/prototype';
import { P06ActionDetails, P06RecoveryLane } from './P06ActionDetails';
import { P06ActionOverlays } from './P06ActionOverlays';
import { P06ActionQueue } from './P06ActionQueue';
import { actionRows, approvalStates, executionStates, risks } from './model';

export function P06ResponseActionsWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('All approvals');
  const [executionFilter, setExecutionFilter] = useState('Active and failed');
  const [riskFilter, setRiskFilter] = useState('All risk');
  const [activeTab, setActiveTab] = useState('Governance');
  const [detailOpen, setDetailOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [prototypeNotice, setPrototypeNotice] = useState<string>();
  const actions = useMemo(() => actionRows(fixture.rows), [fixture.rows]);
  const selectedId = searchParams.get('action') ?? actions[0]?.id;
  const selectedAction = actions.find((item) => item.id === selectedId) ?? actions[0];
  const visibleActions = useMemo(() => actions.filter((item) => {
    const haystack = `${item.id} ${item.actionType} ${item.target} ${item.caseRef} ${item.requester} ${item.approver} ${item.adapter} ${item.receipt}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesApproval = approvalFilter === 'All approvals' || item.approval === approvalFilter;
    const matchesExecution = executionFilter === 'All execution states' || (executionFilter === 'Active and failed' && ['Queued', 'Running', 'Failed', 'Partial', 'Rollback pending'].includes(item.execution)) || item.execution === executionFilter;
    return matchesQuery && matchesApproval && matchesExecution && (riskFilter === 'All risk' || item.risk === riskFilter);
  }), [actions, approvalFilter, executionFilter, query, riskFilter]);
  if (!selectedAction) return null;

  const selectAction = (id: string) => {
    setSearchParams((current) => { const next = new URLSearchParams(current); next.set('action', id); return next; }, { replace: true });
    setActiveTab('Governance');
    setPrototypeNotice(undefined);
  };
  const recordDecision = (decision: string) => {
    setPrototypeNotice(`${decision} submitted as a prototype decision. No authoritative action state was changed.`);
    setApprovalOpen(false);
  };

  return <div className="pageComposition page-p06 differentiatedPage" data-page-specific-composition="P06-governed-response-actions">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="action-scope-and-status-filters">
      <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
        <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, case, target, requester, adapter or receipt" aria-label="Search response actions" /></EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 170 }}><EuiSelect compressed aria-label="Approval state" value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value)} options={['All approvals', ...approvalStates].map((value) => ({ value, text: value }))} /></EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 180 }}><EuiSelect compressed aria-label="Execution state" value={executionFilter} onChange={(event) => setExecutionFilter(event.target.value)} options={['Active and failed', 'All execution states', ...executionStates].map((value) => ({ value, text: value }))} /></EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 140 }}><EuiSelect compressed aria-label="Action risk" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} options={['All risk', ...risks].map((value) => ({ value, text: value }))} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">7-day action ledger</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" /><EuiFlexGroup alignItems="center" gutterSize="s" wrap><EuiFlexItem grow={false}><EuiText size="xs" color="subdued"><p>Saved views:</p></EuiText></EuiFlexItem>{['My approvals', 'Execution failures', 'Rollback available', 'Awaiting external state'].map((view, index) => <EuiFlexItem key={view} grow={false}><EuiButtonEmpty size="xs" color={index === 0 ? 'primary' : 'text'}>{view}</EuiButtonEmpty></EuiFlexItem>)}</EuiFlexGroup>
    </EuiPanel>
    <EuiSpacer size="m" />
    {prototypeNotice && <><EuiCallOut title="Prototype receipt" color="warning">{prototypeNotice}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={3} style={{ minWidth: 360 }}><P06ActionQueue actions={visibleActions} selectedId={selectedAction.id} onSelect={selectAction} /></EuiFlexItem>
      <EuiFlexItem grow={6}><P06ActionDetails action={selectedAction} fixture={fixture} activeTab={activeTab} onTab={setActiveTab} onOpenDetails={() => setDetailOpen(true)} onOpenApproval={() => setApprovalOpen(true)} onDecision={recordDecision} /></EuiFlexItem>
      <EuiFlexItem grow={2} style={{ minWidth: 280 }}><P06RecoveryLane action={selectedAction} /></EuiFlexItem>
    </EuiFlexGroup>
    <P06ActionOverlays action={selectedAction} fixture={fixture} detailOpen={detailOpen} approvalOpen={approvalOpen} onCloseDetail={() => setDetailOpen(false)} onCloseApproval={() => setApprovalOpen(false)} onDecision={recordDecision} />
  </div>;
}
