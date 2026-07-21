import { EuiBadge, EuiButton, EuiButtonEmpty, EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiSelect, EuiSpacer, EuiText } from '@elastic/eui';
import { assetTypes, healthStates, lifecycles } from './model';

type Props = {
  query: string; typeFilter: string; lifecycleFilter: string; healthFilter: string;
  ownerFilter: string; sourceFilter: string; riskFilter: string;
  onQuery(value: string): void; onType(value: string): void; onLifecycle(value: string): void;
  onHealth(value: string): void; onOwner(value: string): void; onSource(value: string): void;
  onRisk(value: string): void; onApply(): void; onSavedView(view: string): void;
};
const options = (values: readonly string[]) => values.map((value) => ({ value, text: value }));

export function P08AssetScopeBar(props: Props) {
  return <EuiPanel paddingSize="m" hasBorder data-visual-region="asset-search-facet-command-bar">
    <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
      <EuiFlexItem grow={2}><EuiFieldSearch compressed value={props.query} onChange={(event) => props.onQuery(event.target.value)} onSearch={props.onApply} placeholder="Asset ID, hostname, IP/MAC, serial, cloud ID, owner or observation" aria-label="Search canonical assets" /></EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 145 }}><EuiSelect compressed value={props.typeFilter} onChange={(event) => props.onType(event.target.value)} aria-label="Asset type filter" options={options(['All types', ...assetTypes])} /></EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 145 }}><EuiSelect compressed value={props.lifecycleFilter} onChange={(event) => props.onLifecycle(event.target.value)} aria-label="Lifecycle filter" options={options(['All lifecycle', ...lifecycles])} /></EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 145 }}><EuiSelect compressed value={props.healthFilter} onChange={(event) => props.onHealth(event.target.value)} aria-label="Health filter" options={options(['All health', ...healthStates])} /></EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 145 }}><EuiSelect compressed value={props.ownerFilter} onChange={(event) => props.onOwner(event.target.value)} aria-label="Owner filter" options={options(['All owners', 'Owned', 'Unowned'])} /></EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 165 }}><EuiSelect compressed value={props.sourceFilter} onChange={(event) => props.onSource(event.target.value)} aria-label="Inventory source filter" options={options(['All sources', 'Endpoint agent', 'CMDB', 'Cloud inventory', 'Network discovery'])} /></EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 145 }}><EuiSelect compressed value={props.riskFilter} onChange={(event) => props.onRisk(event.target.value)} aria-label="Exposure filter" options={options(['All exposure', 'High exposure', 'Lower exposure'])} /></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiButton fill size="s" onClick={props.onApply}>Apply scope</EuiButton></EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="s" />
    <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
      <EuiFlexItem grow={false}><EuiText size="xs" color="subdued"><p>Saved views:</p></EuiText></EuiFlexItem>
      {['Canonical active', 'Reconciliation attention', 'Unowned critical', 'Stale telemetry'].map((label, index) => <EuiFlexItem key={label} grow={false}><EuiButtonEmpty size="xs" color={index === 0 ? 'primary' : 'text'} onClick={() => props.onSavedView(label)}>{label}</EuiButtonEmpty></EuiFlexItem>)}
      <EuiFlexItem /><EuiFlexItem grow={false}><EuiBadge color="hollow">Current snapshot · observations 30d</EuiBadge></EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>;
}
