import { useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P31RuntimeObjectsWorkspace.css';

type Tab = 'Types' | 'Instances' | 'Relationships';
type RuntimeObject = {
  key: string;
  id: string;
  name: string;
  type: string;
  lifecycle: string;
  revision: string;
  validation: string;
  owner: string;
  relationships: number;
  consumers: number;
  drift: string;
  capability: string;
};
type ChangeEvent = { target: { value: string } };
type DetailKind = 'object' | 'relationship';
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const num = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildObjects = (rows: PrototypeRow[]): RuntimeObject[] => rows.slice(0, 18).map((row, index) => ({
  key: `${row.id}:${index}`,
  id: text(row.instance_id ?? row.object_type_id, `OBJ-${String(index + 1).padStart(4, '0')}`),
  name: text(row.name, `${['Asset identity','Business service','Detection entity','Automation target'][index % 4]} ${index + 1}`),
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
  const [selectedKey, setSelectedKey] = useState<string>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailKind, setDetailKind] = useState<DetailKind>('object');
  const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number>();
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [receipt, setReceipt] = useState<string>();
  const detailOpener = useRef<HTMLButtonElement | null>(null);
  const reconcileOpener = useRef<HTMLButtonElement | null>(null);
  const objects = useMemo(() => buildObjects(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => objects.filter((item) => {
    const term = query.trim().toLowerCase();
    return (!term || `${item.id} ${item.name} ${item.type} ${item.owner} ${item.capability}`.toLowerCase().includes(term))
      && (lifecycle === 'All lifecycle' || (lifecycle === 'Active' ? item.lifecycle !== 'Deprecated' : item.lifecycle === lifecycle));
  }), [lifecycle, objects, query]);
  const selected = objects.find((item) => item.key === selectedKey) ?? visible[0] ?? objects[0];
  if (!selected) return null;
  const status = {
    types: new Set(objects.map((item) => item.type)).size,
    invalid: objects.filter((item) => item.validation === 'Invalid').length,
    orphan: fixture.relationships.filter((_, index) => index % 5 === 0).length,
    drift: objects.filter((item) => item.drift !== 'Aligned').length,
    deprecated: objects.filter((item) => item.lifecycle === 'Deprecated' && item.consumers > 0).length,
  };
  const selectedEdge = selectedEdgeIndex === undefined ? undefined : fixture.relationships[selectedEdgeIndex];
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; object registry and relationship graph remain authoritative until rehydrated.`);
  const openObjectDetail = (trigger: HTMLButtonElement) => {
    detailOpener.current = trigger;
    setDetailKind('object');
    setSelectedEdgeIndex(undefined);
    setDetailOpen(true);
  };
  const openRelationshipDetail = (index: number, trigger: HTMLButtonElement) => {
    detailOpener.current = trigger;
    setDetailKind('relationship');
    setSelectedEdgeIndex(index);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    requestAnimationFrame(() => detailOpener.current?.focus());
  };
  const closeReconcile = () => {
    setReconcileOpen(false);
    requestAnimationFrame(() => reconcileOpener.current?.focus());
  };

  return <div className="pageComposition page-p31 differentiatedPage p31Objects" data-page-specific-composition="P31-master-detail-relationships-disclosure">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="runtime-object-command">
      <EuiFlexGroup alignItems="center" gutterSize="m" wrap>
        <EuiFlexItem><div className="p31Tabs" role="tablist" aria-label="Runtime object mode">{(['Types','Instances','Relationships'] as Tab[]).map((item) => <button type="button" role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}</div></EuiFlexItem>
        <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Type, instance, property, relationship, capability, owner or revision" aria-label="Search runtime objects" /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed value={lifecycle} onChange={(event: ChangeEvent) => setLifecycle(event.target.value)} options={['Active','All lifecycle','Published','Draft','Deprecated'].map((value) => ({ value, text: value }))} aria-label="Object lifecycle" /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt(`Create ${tab.toLowerCase()} workbench opened in prototype mode.`)}>Create {tab === 'Types' ? 'type' : tab === 'Relationships' ? 'relationship' : 'object'}</EuiButton></EuiFlexItem>
      </EuiFlexGroup>
      <div className="p31StatusStrip">
        <span><strong>{status.types}</strong> published types</span>
        <span><strong>{status.invalid}</strong> invalid instances</span>
        <span><strong>{status.orphan}</strong> orphan relationships</span>
        <span><strong>{status.drift}</strong> schema drift</span>
        <span><strong>{status.deprecated}</strong> deprecated consumers</span>
      </div>
    </EuiPanel>

    {receipt && <EuiCallOut title="Prototype registry receipt" color="warning">{receipt}</EuiCallOut>}

    {tab !== 'Relationships' ? <div className="p31Registry">
      <EuiPanel paddingSize="m" hasBorder className="p31Table" data-visual-region="runtime-object-registry">
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{tab} registry</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <p>Select one object to inspect its owned fields, validation and consumers.</p>
        <div className="p31TableWrap"><table><thead><tr><th>Identity</th><th>Type</th><th>Lifecycle</th><th>Validation</th><th>Revision</th><th>Relationships / consumers</th></tr></thead><tbody>{visible.map((item) => <tr key={item.key} aria-selected={item.key === selected.key}><td><EuiButtonEmpty size="xs" onClick={() => setSelectedKey(item.key)}>{item.id}</EuiButtonEmpty><small>{item.name}</small></td><td>{item.type}</td><td>{item.lifecycle}</td><td><EuiBadge color={item.validation === 'Valid' ? 'success' : 'danger'}>{item.validation}</EuiBadge></td><td>{item.revision}</td><td>{item.relationships} / {item.consumers}</td></tr>)}</tbody></table></div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder className="p31Detail" data-visual-region="runtime-object-detail">
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · {selected.type} · owner {selected.owner}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.drift === 'Aligned' ? 'success' : 'warning'}>{selected.drift}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <dl className="p31Definition"><div><dt>Revision</dt><dd>{selected.revision}</dd></div><div><dt>Lifecycle</dt><dd>{selected.lifecycle}</dd></div><div><dt>Capability</dt><dd>{selected.capability}</dd></div><div><dt>Validation</dt><dd>{selected.validation}</dd></div></dl>
        <EuiAccordion id={`p31-json-${selected.key}`} buttonContent="Raw object JSON and field ownership" paddingSize="s">
          <EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ id: selected.id, type: selected.type, revision: selected.revision, identity: { canonical_name: selected.name }, capability: selected.capability, fieldOwnership: { identity: 'runtime registry', service: 'ITSM mapping' } }, null, 2)}</EuiCodeBlock>
        </EuiAccordion>
        <EuiAccordion id={`p31-compat-${selected.key}`} buttonContent="Consumer compatibility" paddingSize="s">
          <div className="p31Compatibility">{[['Schema validation', selected.validation === 'Valid' ? 96 : 44],['Relationship integrity', 83],['Consumer compatibility', selected.lifecycle === 'Deprecated' ? 51 : 91]].map(([label, value]) => <div key={String(label)}><strong>{label}</strong><EuiProgress value={Number(value)} max={100} size="s" color={Number(value) < 60 ? 'warning' : 'primary'} /><span>{value}%</span></div>)}</div>
        </EuiAccordion>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" wrap>
          <EuiFlexItem grow={false}><EuiButton onClick={(event: MouseEvent<HTMLButtonElement>) => openObjectDetail(event.currentTarget)}>Open object detail</EuiButton></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty buttonRef={reconcileOpener} onClick={() => setReconcileOpen(true)}>Reconcile</EuiButtonEmpty></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty color="danger" onClick={() => queue('Deprecation review')}>Review deprecate</EuiButtonEmpty></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div> : <EuiPanel paddingSize="m" hasBorder className="p31Graph" data-visual-region="runtime-relationship-explorer">
      <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Relationship explorer</h2></EuiTitle><p>{selected.id} remains the current object context.</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{fixture.relationships.length} edges</EuiBadge></EuiFlexItem></EuiFlexGroup>
      <div className="p31GraphCanvas"><span className="center">{selected.id}</span>{['Business service','Owner identity','Detection rule','Case','Change','Automation target','Knowledge source','Dataset'].map((item, index) => <button type="button" key={item} className={`node node-${index}`} onClick={(event) => openRelationshipDetail(index % fixture.relationships.length, event.currentTarget)}>{item}<small>{index % 2 ? 'depends_on' : 'related_to'}</small></button>)}</div>
      <div className="p31TableWrap"><table><thead><tr><th>Source</th><th>Relationship</th><th>Target</th><th>Validation</th><th>Detail</th></tr></thead><tbody>{fixture.relationships.slice(0, 8).map((item, index) => <tr key={`${item.source}-${item.target}-${index}`}><td>{item.source}</td><td>{item.relation}</td><td>{item.target}</td><td><EuiBadge color={index % 5 === 0 ? 'warning' : 'success'}>{index % 5 === 0 ? 'Orphan review' : 'Valid'}</EuiBadge></td><td><EuiButtonEmpty size="xs" onClick={(event: MouseEvent<HTMLButtonElement>) => openRelationshipDetail(index, event.currentTarget)}>Inspect edge</EuiButtonEmpty></td></tr>)}</tbody></table></div>
    </EuiPanel>}

    {detailOpen && <EuiFlyout onClose={closeDetail} ownFocus size="m" aria-labelledby="p31-detail-title"><EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p31-detail-title">{detailKind === 'object' ? 'Object detail' : 'Relationship detail'}</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Field ownership boundary">Mappings to ITSM CI, service and user objects respect field ownership; the runtime registry remains the source of truth for owned fields.</EuiCallOut><EuiSpacer />{detailKind === 'object' ? <><dl className="p31Definition"><div><dt>Object</dt><dd>{selected.id}</dd></div><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Consumers</dt><dd>{selected.consumers}</dd></div><div><dt>Relationships</dt><dd>{selected.relationships}</dd></div></dl><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify(selected, null, 2)}</EuiCodeBlock></> : selectedEdge ? <dl className="p31Definition"><div><dt>Source</dt><dd>{selectedEdge.source}</dd></div><div><dt>Relationship</dt><dd>{selectedEdge.relation}</dd></div><div><dt>Target</dt><dd>{selectedEdge.target}</dd></div><div><dt>Validation</dt><dd>{(selectedEdgeIndex ?? 0) % 5 === 0 ? 'Orphan review' : 'Valid'}</dd></div></dl> : <EuiCallOut title="Relationship unavailable">The selected edge is no longer in the current fixture page.</EuiCallOut>}</EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={closeDetail}>Close detail</EuiButton></EuiFlyoutFooter></EuiFlyout>}

    {reconcileOpen && <EuiModal onClose={closeReconcile} aria-labelledby="p31-reconcile-title"><EuiModalHeader><EuiModalHeaderTitle id="p31-reconcile-title">Reconciliation impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Prototype reconciliation" color="warning">The action records a proposed field or edge resolution. It does not mutate the authoritative registry.</EuiCallOut><ul><li>Object: {selected.id}</li><li>Drift: {selected.drift}</li><li>Consumers: {selected.consumers}</li><li>Relationships: {selected.relationships}</li><li>Rollback revision: {selected.revision}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={closeReconcile}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue('Reconciliation'); closeReconcile(); }}>Queue reconciliation</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}