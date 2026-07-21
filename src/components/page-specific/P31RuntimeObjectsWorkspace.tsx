import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiCodeBlock, EuiFieldSearch, EuiFlexGroup,
  EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiModal,
  EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel, EuiProgress,
  EuiSelect, EuiSpacer, EuiStat, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P31RuntimeObjectsWorkspace.css';

type Tab = 'Types' | 'Instances' | 'Relationships';
type RuntimeObject = { id: string; name: string; type: string; lifecycle: string; revision: string; validation: string; owner: string; relationships: number; consumers: number; drift: string; capability: string };
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const num = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildObjects = (rows: PrototypeRow[]): RuntimeObject[] => rows.slice(0, 18).map((row, index) => ({
  id: text(row.instance_id ?? row.object_type_id, `OBJ-${String(index + 1).padStart(4, '0')}`),
  name: text(row.name, ['Asset identity','Business service','Detection entity','Automation target'][index % 4] + ` ${index + 1}`),
  type: text(row.object_type, ['asset','service','identity','automation_target'][index % 4]),
  lifecycle: text(row.lifecycle, index % 7 === 0 ? 'Deprecated' : index % 5 === 0 ? 'Draft' : 'Published'),
  revision: text(row.revision, `r${16 - index % 4}`),
  validation: text(row.validation_state, index % 6 === 0 ? 'Invalid' : 'Valid'),
  owner: text(row.owner, ['Runtime modeling','Service management','Entity analytics','Automation'][index % 4]),
  relationships: num(row.relationship_count, 2 + index % 7),
  consumers: num(row.consumer_count, 3 + index * 2),
  drift: text(row.schema_drift, index % 5 === 0 ? 'Drift detected' : 'Aligned'),
  capability: text(row.capability, ['query','link','enrich','execute'][index % 4]),
}));

export function P31RuntimeObjectsWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [tab, setTab] = useState<Tab>('Types');
  const [query, setQuery] = useState('');
  const [lifecycle, setLifecycle] = useState('Active');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const objects = useMemo(() => buildObjects(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => objects.filter((item) => (!query.trim() || `${item.id} ${item.name} ${item.type} ${item.owner} ${item.capability}`.toLowerCase().includes(query.trim().toLowerCase())) && (lifecycle === 'All lifecycle' || (lifecycle === 'Active' ? item.lifecycle !== 'Deprecated' : item.lifecycle === lifecycle))), [lifecycle, objects, query]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? objects[0];
  if (!selected) return null;
  const metrics = { types: new Set(objects.map((item) => item.type)).size, invalid: objects.filter((item) => item.validation === 'Invalid').length, orphan: 4, drift: objects.filter((item) => item.drift !== 'Aligned').length, deprecated: objects.filter((item) => item.lifecycle === 'Deprecated' && item.consumers > 0).length };
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; object registry and relationship graph remain authoritative until rehydrated.`);

  return <div className="pageComposition page-p31 differentiatedPage p31Objects" data-page-specific-composition="P31-object-registry-relationship-reconcile">
    <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup alignItems="center" gutterSize="m" wrap><EuiFlexItem><div className="p31Tabs" role="tablist">{(['Types','Instances','Relationships'] as Tab[]).map((item) => <button type="button" role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}</div></EuiFlexItem><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Type, instance, property, relationship, capability, owner or revision" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={lifecycle} onChange={(event: ChangeEvent) => setLifecycle(event.target.value)} options={['Active','All lifecycle','Published','Draft','Deprecated'].map((value) => ({ value, text: value }))} /></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt(`Create ${tab.toLowerCase()} workbench opened in prototype mode.`)}>Create {tab === 'Types' ? 'type' : 'object'}</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />{receipt && <><EuiCallOut title="Prototype registry receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="s" wrap>{[['Published types', metrics.types],['Invalid instances', metrics.invalid],['Orphan relationships', metrics.orphan],['Schema drift', metrics.drift],['Deprecated consumers', metrics.deprecated]].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>
    <EuiSpacer size="m" />
    {tab !== 'Relationships' ? <div className="p31Registry">
      <EuiPanel paddingSize="m" hasBorder className="p31Table"><EuiTitle size="s"><h2>{tab} registry</h2></EuiTitle><table><thead><tr><th>Identity</th><th>Type</th><th>Lifecycle</th><th>Validation</th><th>Revision</th><th>Relationships</th><th>Consumers</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><EuiButtonEmpty size="xs" onClick={() => setSelectedId(item.id)}>{item.id}</EuiButtonEmpty><small>{item.name}</small></td><td>{item.type}</td><td>{item.lifecycle}</td><td><EuiBadge color={item.validation === 'Valid' ? 'success' : 'danger'}>{item.validation}</EuiBadge></td><td>{item.revision}</td><td>{item.relationships}</td><td>{item.consumers}</td></tr>)}</tbody></table></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p31Detail"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · {selected.type} · owner {selected.owner}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.drift === 'Aligned' ? 'success' : 'warning'}>{selected.drift}</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer /><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ id: selected.id, type: selected.type, revision: selected.revision, identity: { canonical_name: selected.name }, capability: selected.capability }, null, 2)}</EuiCodeBlock><EuiSpacer /><EuiTitle size="xs"><h3>Validation and consumers</h3></EuiTitle>{[['Schema validation', selected.validation === 'Valid' ? 96 : 44],['Relationship integrity', 83],['Consumer compatibility', selected.lifecycle === 'Deprecated' ? 51 : 91]].map(([label, value]) => <div key={String(label)}><strong>{label}</strong><EuiProgress value={Number(value)} max={100} size="s" color={Number(value) < 60 ? 'warning' : 'primary'} /></div>)}<EuiSpacer /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton fill onClick={() => setDetailOpen(true)}>Open object detail</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setReconcileOpen(true)}>Reconcile</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty color="danger" onClick={() => queue('Deprecation review')}>Review deprecate</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup></EuiPanel>
    </div> : <EuiPanel paddingSize="m" hasBorder className="p31Graph"><EuiTitle size="s"><h2>Relationship explorer</h2></EuiTitle><div className="p31GraphCanvas"><span className="center">{selected.id}</span>{['Business service','Owner identity','Detection rule','Case','Change','Automation target','Knowledge source','Dataset'].map((item, index) => <button type="button" key={item} className={`node node-${index}`} onClick={() => setDetailOpen(true)}>{item}<small>{index % 2 ? 'depends_on' : 'related_to'}</small></button>)}</div><table><thead><tr><th>Source</th><th>Relationship</th><th>Target</th><th>Validation</th></tr></thead><tbody>{fixture.relationships.slice(0, 8).map((item, index) => <tr key={`${item.source}-${index}`}><td>{item.source}</td><td>{item.relation}</td><td>{item.target}</td><td>{index % 5 === 0 ? 'Orphan review' : 'Valid'}</td></tr>)}</tbody></table></EuiPanel>}
    {detailOpen && <EuiFlyout onClose={() => setDetailOpen(false)} ownFocus size="m" aria-labelledby="p31-detail-title"><EuiFlyoutHeader><EuiTitle><h2 id="p31-detail-title">Object and edge detail</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Field ownership boundary">Mappings to ITSM CI/service/user objects respect field ownership; the runtime registry remains the source of truth for owned fields.</EuiCallOut><EuiSpacer /><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify(selected, null, 2)}</EuiCodeBlock></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={() => setDetailOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {reconcileOpen && <EuiModal onClose={() => setReconcileOpen(false)} aria-labelledby="p31-reconcile-title"><EuiModalHeader><EuiModalHeaderTitle id="p31-reconcile-title">Reconciliation impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Prototype reconciliation" color="warning">The action records a proposed field/edge resolution. It does not mutate the authoritative registry.</EuiCallOut><ul><li>Object: {selected.id}</li><li>Drift: {selected.drift}</li><li>Consumers: {selected.consumers}</li><li>Rollback revision: {selected.revision}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setReconcileOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue('Reconciliation'); setReconcileOpen(false); }}>Queue reconciliation</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
