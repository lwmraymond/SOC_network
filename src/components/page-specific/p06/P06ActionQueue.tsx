import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { badgeColorForExecution, badgeColorForRisk, type GovernedAction } from './model';

export function P06ActionQueue({ actions, selectedId, onSelect }: { actions: GovernedAction[]; selectedId: string; onSelect(id: string): void }) {
  return <EuiPanel paddingSize="s" hasBorder data-visual-region="governed-action-queue">
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
      <EuiFlexItem><EuiTitle size="xs"><h2>Governed action queue</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Approval, execution and external state remain separate.</p></EuiText></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiBadge color="hollow">{actions.length} visible</EuiBadge></EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="s" />
    {actions.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item.id)} aria-pressed={item.id === selectedId} style={{ width: '100%', padding: 12, marginBottom: 8, textAlign: 'left', color: 'inherit', background: 'transparent', borderRadius: 8, cursor: 'pointer', border: item.id === selectedId ? '2px solid currentColor' : '1px solid rgba(128,128,128,.35)' }}>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}><EuiBadge color={badgeColorForRisk(item.risk)}>{item.risk}</EuiBadge></EuiFlexItem>
        <EuiFlexItem><strong>{item.actionType}</strong><EuiText size="xs" color="subdued"><p>{item.id} · {item.caseRef}</p></EuiText></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color={badgeColorForExecution(item.execution)}>{item.execution}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup gutterSize="s" responsive={false}><EuiFlexItem><small>{item.target} · {item.adapter}</small></EuiFlexItem><EuiFlexItem grow={false}><small>{item.approval}</small></EuiFlexItem></EuiFlexGroup>
    </button>)}
  </EuiPanel>;
}
