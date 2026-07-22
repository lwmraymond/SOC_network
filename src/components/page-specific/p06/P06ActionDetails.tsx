import { EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiHealth, EuiPanel, EuiProgress, EuiSpacer, EuiTab, EuiTabs, EuiText, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture } from '../../../types/prototype';
import { badgeColorForExecution, badgeColorForRisk, detailTabs, type GovernedAction } from './model';

export function P06ActionDetails({ action, fixture, activeTab, onTab, onOpenDetails, onOpenApproval, onDecision }: { action: GovernedAction; fixture: PrototypePageFixture; activeTab: string; onTab(tab: string): void; onOpenDetails(): void; onOpenApproval(): void; onDecision(decision: string): void }) {
  return <EuiPanel paddingSize="m" hasBorder data-visual-region="selected-action-governance-workspace">
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart" responsive={false}>
      <EuiFlexItem><EuiBadge color={badgeColorForRisk(action.risk)}>{action.risk} risk</EuiBadge><EuiSpacer size="s" /><EuiTitle size="m"><h2>{action.actionType}</h2></EuiTitle><EuiText size="s" color="subdued"><p>{action.id} · target {action.target} · case {action.caseRef}</p></EuiText></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiButtonEmpty onClick={onOpenDetails}>Open logs / receipt</EuiButtonEmpty>{action.approval === 'Pending' ? <EuiButton fill onClick={onOpenApproval}>Review approval</EuiButton> : <EuiButton fill onClick={() => onDecision(action.execution === 'Failed' ? 'Retry request' : 'Action follow-up')}>{action.execution === 'Failed' ? 'Retry' : 'Request follow-up'}</EuiButton>}</EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="m" /><EuiTabs size="s">{detailTabs.map((tab) => <EuiTab key={tab} isSelected={activeTab === tab} onClick={() => onTab(tab)}>{tab}</EuiTab>)}</EuiTabs><EuiSpacer size="m" />

    {activeTab === 'Governance' && <>
      <EuiFlexGroup gutterSize="m" responsive={false}>
        <EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Requester</p></EuiText><EuiTitle size="s"><h3>{action.requester}</h3></EuiTitle><small>Context: {action.caseRef}</small></EuiPanel></EuiFlexItem>
        <EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Approval owner</p></EuiText><EuiTitle size="s"><h3>{action.approver}</h3></EuiTitle><EuiHealth color={action.approval === 'Approved' ? 'success' : 'warning'}>{action.approval}</EuiHealth></EuiPanel></EuiFlexItem>
        <EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Policy expiry</p></EuiText><EuiTitle size="s"><h3>{action.expires}</h3></EuiTitle><small>Re-evaluate after expiry</small></EuiPanel></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" /><EuiTitle size="xs"><h3>Impact and preconditions</h3></EuiTitle><EuiSpacer size="s" />
      {[['Capability check', 100, 'Pass'], ['Target freshness', 78, 'Review'], ['Owner acknowledgement', 52, 'Pending'], ['Rollback readiness', action.rollback.startsWith('Available') ? 88 : 35, action.rollback]].map(([label, value, result]) => <div key={String(label)} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 180px', gap: 12, alignItems: 'center', marginBottom: 10 }}><span>{label}</span><EuiProgress value={Number(value)} max={100} size="s" color={Number(value) < 60 ? 'warning' : 'primary'} /><small>{result}</small></div>)}
    </>}

    {activeTab === 'Execution attempts' && <div>{fixture.timeline.slice(0, 6).map((attempt, index) => <EuiPanel key={`${attempt.time}-${attempt.title}`} paddingSize="s" hasBorder style={{ marginBottom: 8 }}><EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}><EuiFlexItem grow={false}><time>{attempt.time}</time></EuiFlexItem><EuiFlexItem><strong>Attempt {index + 1} · {action.adapter}</strong><EuiText size="xs" color="subdued"><p>{attempt.detail}</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={index === 0 ? badgeColorForExecution(action.execution) : 'hollow'}>{index === 0 ? action.execution : attempt.status}</EuiBadge></EuiFlexItem></EuiFlexGroup></EuiPanel>)}</div>}

    {activeTab === 'Receipts' && <EuiFlexGroup gutterSize="m" wrap>{['Request receipt', 'Approval receipt', 'Execution receipt', 'External observation'].map((label, index) => <EuiFlexItem key={label} grow={1} style={{ minWidth: 220 }}><EuiPanel paddingSize="m" hasBorder><EuiHealth color={index < 2 ? 'success' : action.execution === 'Completed' ? 'success' : 'warning'}>{index < 2 || action.execution === 'Completed' ? 'Available' : 'Pending'}</EuiHealth><EuiTitle size="xs"><h3>{label}</h3></EuiTitle><EuiText size="xs" color="subdued"><p>{action.receipt}-{index + 1} · immutable demo reference</p></EuiText></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>}

    {activeTab === 'Rollback' && <EuiCallOut title="Rollback boundary" color={action.rollback.startsWith('Available') ? 'warning' : 'danger'}>{action.rollback}. Rollback creates a new governed request and never rewrites the original receipt.</EuiCallOut>}
  </EuiPanel>;
}

export function P06RecoveryLane({ action }: { action: GovernedAction }) {
  return <EuiPanel paddingSize="m" hasBorder data-visual-region="authoritative-state-and-recovery-lane">
    <EuiTitle size="s"><h2>Authoritative external state</h2></EuiTitle><EuiSpacer size="s" />
    <EuiCallOut title={action.authoritativeStatus} color={action.execution === 'Completed' ? 'success' : 'warning'}>Adapter: {action.adapter}. Queued or accepted is never presented as completed.</EuiCallOut>
    <EuiSpacer size="m" /><EuiTitle size="xs"><h3>Recovery options</h3></EuiTitle><EuiSpacer size="s" />
    {[['Cancel queued', action.execution === 'Queued' ? 'Eligible' : 'Unavailable'], ['Retry failed', action.execution === 'Failed' ? 'Eligible' : 'Unavailable'], ['Rollback', action.rollback], ['Escalate to ITSM', action.risk === 'Destructive' ? 'Recommended' : 'Optional']].map(([label, value]) => <EuiPanel key={label} paddingSize="s" hasBorder style={{ marginBottom: 8 }}><strong>{label}</strong><EuiText size="xs" color="subdued"><p>{value}</p></EuiText></EuiPanel>)}
  </EuiPanel>;
}
