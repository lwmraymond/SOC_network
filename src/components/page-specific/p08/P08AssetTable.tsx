import type { MouseEvent } from 'react';
import { EuiBadge, EuiBasicTable, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiHealth, EuiPanel, EuiSpacer, EuiText, EuiTitle, type EuiBasicTableColumn } from '@elastic/eui';
import { badgeForCriticality, badgeForHealth, badgeForReconciliation, type AssetRecord } from './model';

type Props = { assets: AssetRecord[]; onPreview(asset: AssetRecord, event: MouseEvent<HTMLButtonElement>): void };

export function P08AssetTable({ assets, onPreview }: Props) {
  const columns: Array<EuiBasicTableColumn<AssetRecord>> = [
    { name: 'Asset identity', width: '260px', render: (asset: AssetRecord) => <EuiButtonEmpty size="xs" onClick={(event: MouseEvent<HTMLButtonElement>) => onPreview(asset, event)} aria-label={`Preview ${asset.name}`}><strong>{asset.name}</strong><br /><small>{asset.id}</small></EuiButtonEmpty> },
    { name: 'Type / criticality', width: '150px', render: (asset: AssetRecord) => <><span>{asset.type}</span><br /><EuiBadge color={badgeForCriticality(asset.criticality)}>{asset.criticality}</EuiBadge></> },
    { name: 'Identifiers', width: '220px', render: (asset: AssetRecord) => <span>{asset.identifiers.slice(0, 2).join(' · ')}</span> },
    { name: 'Lifecycle / health', width: '160px', render: (asset: AssetRecord) => <><EuiBadge color="hollow">{asset.lifecycle}</EuiBadge><br /><EuiHealth color={badgeForHealth(asset.health) === 'success' ? 'success' : badgeForHealth(asset.health) === 'danger' ? 'danger' : 'warning'}>{asset.health}</EuiHealth></> },
    { name: 'Site / owner', width: '190px', render: (asset: AssetRecord) => <><span>{asset.site}</span><br /><strong>{asset.owner}</strong></> },
    { name: 'Sources / reconciliation', width: '210px', render: (asset: AssetRecord) => <><span>{asset.sources.join(', ')}</span><br /><EuiBadge color={badgeForReconciliation(asset.reconciliation)}>{asset.reconciliation}</EuiBadge></> },
    { name: 'Last seen', width: '160px', render: (asset: AssetRecord) => <span>{asset.lastSeen}</span> },
    { name: 'Risk / exposure', width: '150px', render: (asset: AssetRecord) => <><strong>{asset.risk}</strong><br /><span>{asset.exposure}</span></> },
  ];
  return <EuiPanel paddingSize="m" hasBorder data-visual-region="canonical-asset-inventory-grid">
    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s">
      <EuiFlexItem><EuiTitle size="s"><h2>Canonical asset inventory</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Canonical identities remain separate from source observations; exact IDs take precedence over fuzzy hostnames.</p></EuiText></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiBadge color={assets.length ? 'success' : 'warning'}>{assets.length} visible</EuiBadge></EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="s" />
    <div style={{ overflowX: 'auto' }}><EuiBasicTable tableCaption="Canonical asset inventory" items={assets} itemId="id" columns={columns} noItemsMessage="No canonical assets match the current search and facet scope." /></div>
  </EuiPanel>;
}
