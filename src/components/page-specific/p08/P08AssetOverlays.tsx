import { useState } from 'react';
import { EuiButton, EuiButtonEmpty, EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiPanel, EuiSelect, EuiSpacer, EuiStat, EuiText, EuiTitle } from '@elastic/eui';
import { useNavigate } from 'react-router-dom';
import type { AssetRecord } from './model';

type Props = {
  asset: AssetRecord;
  previewOpen: boolean;
  reconciliationOpen: boolean;
  onClosePreview(): void;
  onOpenReconciliation(): void;
  onCloseReconciliation(): void;
  onQueueReconciliation(): void;
};

export function P08AssetOverlays(props: Props) {
  const navigate = useNavigate();
  const [fieldWinner, setFieldWinner] = useState('CMDB for owner and criticality');
  const asset = props.asset;
  return <>
    {props.previewOpen && <EuiFlyout onClose={props.onClosePreview} ownFocus size="m" aria-labelledby="p08-preview-title">
      <EuiFlyoutHeader><EuiTitle><h2 id="p08-preview-title">Asset preview · {asset.name}</h2></EuiTitle></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title="Canonical identity and source provenance" color={asset.reconciliation === 'Canonical' ? 'success' : 'warning'}>Canonical values, source observations, freshness and conflicts remain separate. CMDB-owned fields are never silently overwritten.</EuiCallOut>
        <EuiSpacer />
        <EuiFlexGroup gutterSize="m" alignItems="stretch">
          <EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiTitle size="xs"><h3>Identity and ownership</h3></EuiTitle><dl><dt>Asset ID</dt><dd>{asset.id}</dd><dt>Identifiers</dt><dd>{asset.identifiers.join(' · ')}</dd><dt>Owner</dt><dd>{asset.owner}</dd><dt>Site</dt><dd>{asset.site}</dd></dl></EuiPanel></EuiFlexItem>
          <EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiTitle size="xs"><h3>Source observations</h3></EuiTitle>{asset.sources.map((source, index) => <div key={source} style={{ padding: '8px 0', borderBottom: '1px solid var(--euiBorderColor, #d3dae6)' }}><strong>{source}</strong><br /><small>{index === 0 ? 'Preferred for discovered identity' : 'Contributes governed fields'} · observed {index + 2}m ago</small></div>)}</EuiPanel></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="xs"><h3>Risk and related work</h3></EuiTitle><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem><EuiStat title={String(asset.risk)} description="Risk projection" titleSize="s" /></EuiFlexItem><EuiFlexItem><EuiStat title={asset.criticality} description="Business criticality" titleSize="s" /></EuiFlexItem><EuiFlexItem><EuiStat title={asset.health} description="Telemetry health" titleSize="s" /></EuiFlexItem></EuiFlexGroup></EuiPanel>
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiFlexGroup justifyContent="spaceBetween" alignItems="center"><EuiFlexItem grow={false}><EuiButtonEmpty onClick={props.onClosePreview}>Close</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => navigate(`/analyzer/search?q=asset_id%3A${encodeURIComponent(asset.id)}`)}>Hunt events</EuiButtonEmpty><EuiButtonEmpty onClick={() => navigate(`/itsm/incidents?asset=${encodeURIComponent(asset.id)}`)}>Open ITSM context</EuiButtonEmpty><EuiButton fill onClick={props.onOpenReconciliation}>Reconcile observations</EuiButton></EuiFlexItem></EuiFlexGroup></EuiFlyoutFooter>
    </EuiFlyout>}

    {props.reconciliationOpen && <EuiFlyout onClose={props.onCloseReconciliation} ownFocus size="l" aria-labelledby="p08-reconcile-title">
      <EuiFlyoutHeader><EuiTitle><h2 id="p08-reconcile-title">Reconcile observations · {asset.name}</h2></EuiTitle></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title="Prototype impact preview" color="warning">Submitting queues a simulation receipt only. Canonical state, CMDB-owned fields and source observations remain unchanged.</EuiCallOut>
        <EuiSpacer />
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="xs"><h3>Conflict and field ownership</h3></EuiTitle><table style={{ width: '100%' }}><thead><tr><th>Field</th><th>Canonical value</th><th>Observation candidate</th><th>Owner</th></tr></thead><tbody><tr><td>Owner</td><td>{asset.owner}</td><td>Platform Operations</td><td>CMDB</td></tr><tr><td>Criticality</td><td>{asset.criticality}</td><td>High</td><td>CMDB</td></tr><tr><td>Hostname</td><td>{asset.name}</td><td>{asset.identifiers[0]}</td><td>Endpoint agent</td></tr><tr><td>Last seen</td><td>{asset.lastSeen}</td><td>2026-07-18 11:58 +08</td><td>Discovery source</td></tr></tbody></table></EuiPanel>
        <EuiSpacer />
        <EuiSelect value={fieldWinner} onChange={(event) => setFieldWinner(event.target.value)} aria-label="Field ownership decision" options={['CMDB for owner and criticality', 'Endpoint for discovered identity', 'Escalate unresolved ownership'].map((value) => ({ value, text: value }))} />
        <EuiSpacer /><EuiText><p><strong>Impact:</strong> preserve four observation records, update the mapping revision and request authoritative rehydration. Merge/split remains approval-gated.</p></EuiText>
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiFlexGroup justifyContent="spaceBetween"><EuiFlexItem grow={false}><EuiButtonEmpty onClick={props.onCloseReconciliation}>Cancel</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={props.onQueueReconciliation}>Queue prototype reconciliation</EuiButton></EuiFlexItem></EuiFlexGroup></EuiFlyoutFooter>
    </EuiFlyout>}
  </>;
}
