import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiCodeBlock, EuiFieldSearch, EuiFlexGroup,
  EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiFormRow,
  EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel,
  EuiProgress, EuiSelect, EuiSpacer, EuiStat, EuiTextArea, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P30EventSchemasContractsWorkspace.css';

type Contract = { id: string; dataset: string; eventType: string; lifecycle: string; revision: string; compatibility: string; owner: string; errors: number; unmapped: number; consumers: number; classification: string };
type Field = { path: string; type: string; required: boolean; semantic: string; producer: string; mapping: string; quality: string };
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const num = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildContracts = (rows: PrototypeRow[]): Contract[] => rows.slice(0, 12).map((row, index) => ({
  id: text(row.contract_id, `EVT-${String(index + 1).padStart(4, '0')}`),
  dataset: text(row.dataset, ['logs-identity','logs-endpoint','logs-cloud','alerts-security'][index % 4]),
  eventType: text(row.event_type, ['authentication','process','cloud_audit','detection_alert'][index % 4]),
  lifecycle: text(row.lifecycle, index % 5 === 0 ? 'Draft' : index % 7 === 0 ? 'Deprecated' : 'Published'),
  revision: text(row.revision, `r${18 - index % 4}`),
  compatibility: text(row.compatibility, index % 5 === 0 ? 'Breaking' : index % 4 === 0 ? 'Conditional' : 'Backward compatible'),
  owner: text(row.owner, ['Identity data','Endpoint data','Cloud platform','Detection platform'][index % 4]),
  errors: num(row.validation_errors, index % 5 === 0 ? 7 : 0),
  unmapped: num(row.unmapped_fields, index % 4 === 0 ? 5 : index % 3),
  consumers: num(row.consumer_count, 4 + index * 3),
  classification: text(row.classification, index % 4 === 0 ? 'Restricted' : 'Internal'),
}));
const fields: Field[] = [
  { path: 'event.category', type: 'keyword', required: true, semantic: 'Normalized event category', producer: 'pipeline/auth', mapping: 'identity.category', quality: '99.8%' },
  { path: 'user.name', type: 'keyword', required: false, semantic: 'Resolved user principal', producer: 'identity parser', mapping: 'subject.name', quality: '97.1%' },
  { path: 'source.ip', type: 'ip', required: false, semantic: 'Observed source address', producer: 'network enricher', mapping: 'client.ip', quality: '98.5%' },
  { path: 'event.outcome', type: 'keyword', required: false, semantic: 'Success/failure/unknown', producer: 'outcome normalizer', mapping: 'auth.result', quality: '91.4%' },
  { path: 'risk.score', type: 'double', required: false, semantic: 'Normalized 0–100 score', producer: 'risk engine', mapping: 'risk_score', quality: '86.0%' },
];

export function P30EventSchemasContractsWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [lifecycle, setLifecycle] = useState('Published and draft');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [selectedField, setSelectedField] = useState(fields[0].path);
  const [sample, setSample] = useState('{"event":{"category":"authentication","outcome":"success"},"user":{"name":"masked"},"source":{"ip":"192.0.2.10"}}');
  const [fieldOpen, setFieldOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const contracts = useMemo(() => buildContracts(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => contracts.filter((item) => (!query.trim() || `${item.id} ${item.dataset} ${item.eventType} ${item.owner}`.toLowerCase().includes(query.trim().toLowerCase())) && (lifecycle === 'All lifecycle' || (lifecycle === 'Published and draft' ? item.lifecycle !== 'Deprecated' : item.lifecycle === lifecycle))), [contracts, lifecycle, query]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? contracts[0];
  const field = fields.find((item) => item.path === selectedField) ?? fields[0];
  if (!selected) return null;
  const metrics = { published: contracts.filter((item) => item.lifecycle === 'Published').length, breaking: contracts.filter((item) => item.compatibility === 'Breaking').length, errors: contracts.reduce((sum, item) => sum + item.errors, 0), unmapped: contracts.reduce((sum, item) => sum + item.unmapped, 0), risk: contracts.filter((item) => item.compatibility !== 'Backward compatible' && item.consumers > 10).length };
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; effective contract revision and consumer health remain unchanged until authoritative validation completes.`);

  return <div className="pageComposition page-p30 differentiatedPage p30Contracts" data-page-specific-composition="P30-schema-tree-field-compatibility">
    <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Contract ID, dataset, event type, field path, producer, consumer or validation error" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={lifecycle} onChange={(event: ChangeEvent) => setLifecycle(event.target.value)} options={['Published and draft','All lifecycle','Published','Draft','Deprecated'].map((value) => ({ value, text: value }))} /></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt('Create contract workbench opened in prototype mode; no registry object was created.')}>Create contract</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />{receipt && <><EuiCallOut title="Prototype contract receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="s" wrap>{[['Published contracts', metrics.published],['Breaking drafts', metrics.breaking],['Validation errors', metrics.errors],['Unmapped fields', metrics.unmapped],['Consumer risk', metrics.risk]].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>
    <EuiSpacer size="m" />
    <div className="p30Workbench">
      <EuiPanel paddingSize="m" hasBorder className="p30Tree"><EuiTitle size="s"><h2>Schema tree</h2></EuiTitle>{visible.map((item) => <details key={item.id} open={item.id === selected.id}><summary onClick={() => setSelectedId(item.id)}><span>{item.dataset}</span><EuiBadge color={item.compatibility === 'Breaking' ? 'danger' : item.compatibility === 'Conditional' ? 'warning' : 'success'}>{item.revision}</EuiBadge></summary><button type="button" onClick={() => setSelectedId(item.id)}>{item.eventType}<small>{item.id} · {item.lifecycle}</small></button>{fields.slice(0, 4).map((itemField) => <button type="button" key={itemField.path} className={itemField.path === selectedField ? 'selected' : ''} onClick={() => setSelectedField(itemField.path)}>{itemField.path}<small>{itemField.type}</small></button>)}</details>)}</EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p30Field"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.dataset} / {selected.eventType}</h2></EuiTitle><p>{selected.id} · {selected.revision} · owner {selected.owner}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.compatibility === 'Breaking' ? 'danger' : 'success'}>{selected.compatibility}</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer size="m" /><table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Semantic</th><th>Quality</th></tr></thead><tbody>{fields.map((item) => <tr key={item.path}><td><EuiButtonEmpty size="xs" onClick={() => { setSelectedField(item.path); setFieldOpen(true); }}>{item.path}</EuiButtonEmpty></td><td>{item.type}</td><td>{item.required ? 'Required' : 'Optional'}</td><td>{item.semantic}</td><td>{item.quality}</td></tr>)}</tbody></table><EuiSpacer size="m" /><EuiTitle size="xs"><h3>Sample event validation</h3></EuiTitle><EuiFormRow label="Masked JSON sample" helpText="Sample values remain subject to classification and masking."><EuiTextArea value={sample} onChange={(event: ChangeEvent) => setSample(event.target.value)} rows={8} /></EuiFormRow><EuiFlexGroup gutterSize="s"><EuiFlexItem grow={false}><EuiButton onClick={() => queue('Validate samples')}>Validate sample</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => queue('Compare revisions')}>Compare revisions</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p30Diff"><EuiTitle size="s"><h2>Compatibility & impact</h2></EuiTitle><div className="p30Revision"><span>Effective {selected.revision}</span><strong>→</strong><span>Draft r19</span></div><del>event.outcome: keyword optional</del><ins>event.outcome: keyword required</ins><ins>authentication.method: keyword optional</ins><EuiSpacer /><EuiCallOut title={`${selected.consumers} consumers`} color={selected.compatibility === 'Breaking' ? 'warning' : 'success'}>{selected.compatibility === 'Breaking' ? 'Rules, dashboards and playbooks require migration before publish.' : 'Compatibility checks pass for current consumers.'}</EuiCallOut><EuiSpacer /><EuiTitle size="xs"><h3>Consumer readiness</h3></EuiTitle>{['Detection rules','P07 queries','Dashboards','Playbooks'].map((item, index) => <div key={item}><strong>{item}</strong><EuiProgress value={[82,94,71,56][index]} max={100} size="s" color={index > 2 ? 'warning' : 'primary'} /><span>{index === 3 ? 'Migration required' : 'Ready'}</span></div>)}<EuiSpacer /><EuiButton fill fullWidth onClick={() => setPublishOpen(true)}>Review publish</EuiButton></EuiPanel>
    </div>
    {fieldOpen && <EuiFlyout onClose={() => setFieldOpen(false)} ownFocus size="m" aria-labelledby="p30-field-title"><EuiFlyoutHeader><EuiTitle><h2 id="p30-field-title">{field.path}</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><dl><div><dt>Type</dt><dd>{field.type}</dd></div><div><dt>Semantic</dt><dd>{field.semantic}</dd></div><div><dt>Producer</dt><dd>{field.producer}</dd></div><div><dt>Mapping</dt><dd>{field.mapping}</dd></div><div><dt>Quality</dt><dd>{field.quality}</dd></div></dl><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ path: field.path, type: field.type, required: field.required, classification: selected.classification }, null, 2)}</EuiCodeBlock></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={() => setFieldOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {publishOpen && <EuiModal onClose={() => setPublishOpen(false)} aria-labelledby="p30-publish-title"><EuiModalHeader><EuiModalHeaderTitle id="p30-publish-title">Contract publication impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Breaking contract governance" color="warning">Publication requires sample validation, consumer migration, Change linkage and rollback revision. ITSM closure does not prove data recovery.</EuiCallOut><ul><li>Contract: {selected.id}</li><li>Compatibility: {selected.compatibility}</li><li>Consumers: {selected.consumers}</li><li>Validation errors: {selected.errors}</li><li>Rollback: {selected.revision}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setPublishOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue('Publish contract'); setPublishOpen(false); }}>Queue publish</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
