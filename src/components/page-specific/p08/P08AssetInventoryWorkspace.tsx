import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiProgress, EuiSpacer, EuiStat, EuiText, EuiTitle } from '@elastic/eui';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { PrototypePageFixture } from '../../../types/prototype';
import { P08AssetOverlays } from './P08AssetOverlays';
import { P08AssetScopeBar } from './P08AssetScopeBar';
import { P08AssetTable } from './P08AssetTable';
import { badgeForCriticality, badgeForReconciliation, buildAssets, lifecycleHealth, sourceCoverage, type AssetRecord } from './model';

type Props = { fixture: PrototypePageFixture; onOpenDeviceStatus(): void };

type Scope = { query: string; type: string; lifecycle: string; health: string; owner: string; source: string; risk: string };
const emptyScope: Scope = { query: '', type: 'All types', lifecycle: 'All lifecycle', health: 'All health', owner: 'All owners', source: 'All sources', risk: 'All exposure' };

export function P08AssetInventoryWorkspace({ fixture, onOpenDeviceStatus }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<Scope>({
    query: params.get('q') ?? '', type: params.get('assetType') ?? 'All types', lifecycle: params.get('lifecycle') ?? 'All lifecycle',
    health: params.get('health') ?? 'All health', owner: params.get('owner') ?? 'All owners', source: params.get('source') ?? 'All sources', risk: params.get('risk') ?? 'All exposure',
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [receipt, setReceipt] = useState<string>();
  const opener = useRef<HTMLButtonElement | null>(null);
  const assets = useMemo(() => buildAssets(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => assets.filter((asset) => {
    const haystack = `${asset.id} ${asset.name} ${asset.type} ${asset.identifiers.join(' ')} ${asset.site} ${asset.owner} ${asset.sources.join(' ')} ${asset.reconciliation} ${asset.exposure}`.toLowerCase();
    return (!scope.query.trim() || haystack.includes(scope.query.trim().toLowerCase()))
      && (scope.type === 'All types' || asset.type === scope.type)
      && (scope.lifecycle === 'All lifecycle' || asset.lifecycle === scope.lifecycle)
      && (scope.health === 'All health' || asset.health === scope.health)
      && (scope.owner === 'All owners' || (scope.owner === 'Unowned' ? asset.owner === 'Unassigned' : asset.owner !== 'Unassigned'))
      && (scope.source === 'All sources' || asset.sources.includes(scope.source))
      && (scope.risk === 'All exposure' || (scope.risk === 'High exposure' ? asset.risk >= 70 : asset.risk < 70));
  }), [assets, scope]);
  const selectedId = params.get('asset') ?? visible[0]?.id ?? assets[0]?.id;
  const selected = visible.find((asset) => asset.id === selectedId) ?? visible[0] ?? assets.find((asset) => asset.id === selectedId) ?? assets[0];
  const metrics = useMemo(() => ({
    active: assets.filter((asset) => asset.lifecycle === 'Active').length,
    unreconciled: assets.filter((asset) => asset.reconciliation !== 'Canonical').length,
    stale: assets.filter((asset) => asset.health === 'Stale').length,
    unownedCritical: assets.filter((asset) => asset.owner === 'Unassigned' && ['Critical', 'High'].includes(asset.criticality)).length,
    highExposure: assets.filter((asset) => asset.risk >= 70).length,
  }), [assets]);
  if (!selected) return null;

  const writeUrl = (nextScope = scope) => setParams((current) => {
    const next = new URLSearchParams(current);
    const values = { q: nextScope.query, assetType: nextScope.type, lifecycle: nextScope.lifecycle, health: nextScope.health, owner: nextScope.owner, source: nextScope.source, risk: nextScope.risk };
    Object.entries(values).forEach(([key, value]) => { if (!value || value.startsWith('All ')) next.delete(key); else next.set(key, value); });
    return next;
  }, { replace: true });
  const applySavedView = (view: string) => {
    const next = { ...emptyScope };
    if (view === 'Canonical active') next.lifecycle = 'Active';
    if (view === 'Reconciliation attention') next.query = 'Conflict';
    if (view === 'Unowned critical') { next.owner = 'Unowned'; next.risk = 'High exposure'; }
    if (view === 'Stale telemetry') next.health = 'Stale';
    setScope(next);
    writeUrl(next);
  };
  const select = (asset: AssetRecord) => setParams((current) => { const next = new URLSearchParams(current); next.set('asset', asset.id); return next; }, { replace: true });
  const preview = (asset: AssetRecord, event: MouseEvent<HTMLButtonElement>) => { opener.current = event.currentTarget; select(asset); setPreviewOpen(true); };
  const closePreview = () => { setPreviewOpen(false); requestAnimationFrame(() => opener.current?.focus()); };
  const closeReconcile = () => { setReconciliationOpen(false); requestAnimationFrame(() => opener.current?.focus()); };
  const queueReconcile = () => { setReceipt(`reconcile-${selected.id}-20260718 queued for simulation; authoritative asset state is unchanged.`); closeReconcile(); };
  const openAssetDetail = () => {
    const workflowParams = new URLSearchParams({
      returnTo: `${location.pathname}${location.search}`,
      revision: 'asset-r18',
    });
    navigate(`/devices/assets/${encodeURIComponent(selected.id)}?${workflowParams.toString()}`);
  };

  return <div className="pageComposition page-p08 differentiatedPage" data-page-specific-composition="P08-canonical-asset-inventory">
    <P08AssetScopeBar query={scope.query} typeFilter={scope.type} lifecycleFilter={scope.lifecycle} healthFilter={scope.health} ownerFilter={scope.owner} sourceFilter={scope.source} riskFilter={scope.risk}
      onQuery={(query) => setScope((value) => ({ ...value, query }))} onType={(type) => setScope((value) => ({ ...value, type }))} onLifecycle={(lifecycle) => setScope((value) => ({ ...value, lifecycle }))}
      onHealth={(health) => setScope((value) => ({ ...value, health }))} onOwner={(owner) => setScope((value) => ({ ...value, owner }))} onSource={(source) => setScope((value) => ({ ...value, source }))}
      onRisk={(risk) => setScope((value) => ({ ...value, risk }))} onApply={() => writeUrl()} onSavedView={applySavedView} />
    <EuiSpacer size="m" />
    {receipt && <><EuiCallOut title="Prototype reconciliation receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="s" wrap data-visual-region="asset-decision-summary">
      {[
        ['Active assets', metrics.active, 'Canonical lifecycle'], ['Unreconciled observations', metrics.unreconciled, 'Conflict or unmatched'],
        ['Stale assets', metrics.stale, 'Outside freshness budget'], ['Unowned critical', metrics.unownedCritical, 'Ownership gap'], ['High exposure', metrics.highExposure, 'Risk projection ≥ 70'],
      ].map(([label, value, note]) => <EuiFlexItem key={label} style={{ minWidth: 180 }}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /><EuiText size="xs" color="subdued"><p>{note}</p></EuiText></EuiPanel></EuiFlexItem>)}
    </EuiFlexGroup>
    <EuiSpacer size="m" />
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive>
      <EuiFlexItem grow={2} style={{ minWidth: 245 }}><EuiPanel paddingSize="m" hasBorder data-visual-region="inventory-source-coverage">
        <EuiTitle size="xs"><h2>Source coverage and blind spots</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Canonical, unmatched and stale observations by authoritative source.</p></EuiText><EuiSpacer size="s" />
        {sourceCoverage.map((item) => <div key={item.source} style={{ marginBottom: 14 }}><EuiFlexGroup justifyContent="spaceBetween" gutterSize="s" responsive={false}><EuiFlexItem><strong>{item.source}</strong></EuiFlexItem><EuiFlexItem grow={false}><small>{item.canonical}% canonical</small></EuiFlexItem></EuiFlexGroup><EuiProgress value={item.canonical} max={100} size="s" color={item.canonical < 85 ? 'warning' : 'primary'} /><small>{item.unmatched}% unmatched · {item.stale}% stale</small></div>)}
        <table style={{ width: '100%', fontSize: 12 }}><caption>Exact source coverage values</caption><thead><tr><th>Source</th><th>Canonical</th><th>Unmatched</th></tr></thead><tbody>{sourceCoverage.map((item) => <tr key={item.source}><td>{item.source}</td><td>{item.canonical}%</td><td>{item.unmatched}%</td></tr>)}</tbody></table>
        <EuiSpacer size="m" /><EuiTitle size="xs"><h3>Lifecycle × telemetry health</h3></EuiTitle><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 8 }}>{lifecycleHealth.map(([label, value]) => <button key={label} type="button" onClick={() => setScope((current) => ({ ...current, health: label.includes('Stale') ? 'Stale' : label.includes('Healthy') ? 'Healthy' : current.health }))} style={{ minHeight: 58, border: '1px solid var(--euiBorderColor, #d3dae6)', borderRadius: 6, background: 'transparent', color: 'inherit', textAlign: 'left', padding: 8 }}><strong>{value}</strong><br /><small>{label}</small></button>)}</div>
        <EuiSpacer size="m" /><EuiTitle size="xs"><h3>Reconciliation attention</h3></EuiTitle>{assets.filter((asset) => asset.reconciliation !== 'Canonical').slice(0, 3).map((asset) => <button key={asset.id} type="button" onClick={() => select(asset)} style={{ width: '100%', textAlign: 'left', border: 0, borderTop: '1px solid var(--euiBorderColor, #d3dae6)', background: 'transparent', padding: '10px 0', color: 'inherit' }}><strong>{asset.name}</strong><br /><small>{asset.reconciliation} · {asset.observationCount} observations</small></button>)}
      </EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={6} style={{ minWidth: 620 }}><P08AssetTable assets={visible} onPreview={preview} /></EuiFlexItem>
      <EuiFlexItem grow={3} style={{ minWidth: 285 }}><EuiPanel paddingSize="m" hasBorder data-visual-region="asset-identity-preview">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s"><EuiFlexItem><EuiTitle size="xs"><h2>Identity preview</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={badgeForReconciliation(selected.reconciliation)}>{selected.reconciliation}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <EuiSpacer size="s" /><EuiTitle size="s"><h3>{selected.name}</h3></EuiTitle><EuiText size="xs" color="subdued"><p>{selected.id} · {selected.type} · {selected.site}</p></EuiText>
        <dl style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', marginTop: 16 }}><dt>Criticality</dt><dd><EuiBadge color={badgeForCriticality(selected.criticality)}>{selected.criticality}</EuiBadge></dd><dt>Owner</dt><dd>{selected.owner}</dd><dt>Health</dt><dd>{selected.health}</dd><dt>Last seen</dt><dd>{selected.lastSeen}</dd><dt>Sources</dt><dd>{selected.sources.join(', ')}</dd><dt>Exposure</dt><dd>{selected.exposure} ({selected.risk})</dd></dl>
        <EuiSpacer size="m" /><EuiButton fullWidth onClick={(event: MouseEvent<HTMLButtonElement>) => { opener.current = event.currentTarget; setPreviewOpen(true); }}>Open asset preview</EuiButton><EuiSpacer size="s" />
        <EuiButtonEmpty style={{ width: '100%' }} onClick={openAssetDetail}>Open Asset Detail</EuiButtonEmpty>
        <EuiButtonEmpty style={{ width: '100%' }} onClick={onOpenDeviceStatus}>Device status view</EuiButtonEmpty>
        <EuiButtonEmpty style={{ width: '100%' }} onClick={() => navigate(`/devices/vulnerabilities?asset=${encodeURIComponent(selected.id)}`)}>View exposure</EuiButtonEmpty>
      </EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    <P08AssetOverlays asset={selected} previewOpen={previewOpen} reconciliationOpen={reconciliationOpen} onClosePreview={closePreview} onOpenReconciliation={() => { setPreviewOpen(false); setReconciliationOpen(true); }} onCloseReconciliation={closeReconcile} onQueueReconciliation={queueReconcile} />
  </div>;
}
