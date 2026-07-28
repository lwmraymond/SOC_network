import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiCodeBlock, EuiFieldSearch, EuiFieldText, EuiFlexGroup,
  EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiFormRow,
  EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel,
  EuiProgress, EuiSelect, EuiSpacer, EuiStat, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P34PlaybooksAutomationTemplatesWorkspace.css';

type Playbook = { id: string; name: string; category: string; lifecycle: string; owner: string; trigger: string; steps: number; dependency: string; validation: string; success: number; manual: number; revision: string };
type ChangeEvent = { target: { value: string } };
type NodeKind = 'Trigger' | 'Condition' | 'Action' | 'Approval';
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const num = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildPlaybooks = (rows: PrototypeRow[]): Playbook[] => rows.slice(0, 12).map((row, index) => ({
  id: text(row.playbook_id, `PB-${String(index + 1).padStart(4, '0')}`),
  name: text(row.name, ['Identity compromise response','Endpoint containment','Cloud credential rotation','Major incident evidence pack'][index % 4]),
  category: text(row.category, ['Identity','Endpoint','Cloud','Incident'][index % 4]),
  lifecycle: text(row.lifecycle, index % 5 === 0 ? 'Draft' : index % 7 === 0 ? 'Deprecated' : 'Published'),
  owner: text(row.owner, ['Automation','Endpoint response','Cloud security','Incident response'][index % 4]),
  trigger: text(row.trigger, ['Alert severity ≥ high','Case tag containment','Credential exposure','Major incident declared'][index % 4]),
  steps: num(row.step_count, 5 + index % 6),
  dependency: text(row.dependency_state, index % 6 === 0 ? 'Broken' : 'Ready'),
  validation: text(row.validation_state, index % 5 === 0 ? 'Invalid' : 'Valid'),
  success: num(row.success_rate, Math.max(48, 96 - index * 3)),
  manual: num(row.manual_intervention_rate, 8 + index * 2),
  revision: text(row.revision, `r${14 - index % 4}`),
}));

export function P34PlaybooksAutomationTemplatesWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [lifecycle, setLifecycle] = useState('Active');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [selectedNode, setSelectedNode] = useState<NodeKind>('Action');
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const playbooks = useMemo(() => buildPlaybooks(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => playbooks.filter((item) => (!query.trim() || `${item.id} ${item.name} ${item.category} ${item.trigger} ${item.owner}`.toLowerCase().includes(query.trim().toLowerCase())) && (lifecycle === 'All lifecycle' || (lifecycle === 'Active' ? item.lifecycle !== 'Deprecated' : item.lifecycle === lifecycle))), [lifecycle, playbooks, query]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? playbooks[0];
  if (!selected) return null;
  const metrics = { published: playbooks.filter((item) => item.lifecycle === 'Published').length, invalid: playbooks.filter((item) => item.validation !== 'Valid').length, broken: playbooks.filter((item) => item.dependency !== 'Ready').length, failed: 6, manual: `${Math.round(playbooks.reduce((sum, item) => sum + item.manual, 0) / playbooks.length)}%` };
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; connector steps, approvals and run receipts remain independently authoritative.`);
  const selectedCapability = selectedNode === 'Action' ? 'execute.response' : selectedNode === 'Approval' ? 'approve.containment' : 'evaluate.condition';

  return <div className="pageComposition page-p34 differentiatedPage p34Playbooks" data-page-specific-composition="P34-visual-graph-simulation-publish">
    <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Playbook, trigger, step, capability, dependency, owner or run error" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={lifecycle} onChange={(event: ChangeEvent) => setLifecycle(event.target.value)} options={['Active','All lifecycle','Published','Draft','Deprecated'].map((value) => ({ value, text: value }))} /></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty href="/itsm/automation/templates">ITSM Template Library</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt('Create playbook composer opened in prototype mode; no production definition was created.')}>Create playbook</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />{receipt && <><EuiCallOut title="Prototype playbook receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="s" wrap>{[['Published playbooks', metrics.published],['Invalid drafts', metrics.invalid],['Broken dependencies', metrics.broken],['Failed runs 7d', metrics.failed],['Manual intervention', metrics.manual]].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>
    <EuiSpacer size="m" /><div className="p34Workspace">
      <EuiPanel paddingSize="m" hasBorder className="p34Library"><EuiTitle size="s"><h2>Playbook library</h2></EuiTitle>{visible.map((item) => <button type="button" key={item.id} className={item.id === selected.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span><EuiBadge color={item.validation === 'Valid' ? 'success' : 'danger'}>{item.validation}</EuiBadge><small>{item.revision}</small></span><strong>{item.name}</strong><small>{item.trigger}</small><span>{item.steps} steps · {item.success}% success</span></button>)}</EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p34Composer"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · owner {selected.owner} · {selected.lifecycle}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.dependency === 'Ready' ? 'success' : 'danger'}>{selected.dependency}</EuiBadge></EuiFlexItem></EuiFlexGroup><div className="p34Graph"><button type="button" className="node trigger" onClick={() => setSelectedNode('Trigger')}><b>Trigger</b><span>{selected.trigger}</span></button><button type="button" className="node condition" onClick={() => setSelectedNode('Condition')}><b>Condition</b><span>asset.criticality = critical</span></button><button type="button" className="node action action1" onClick={() => setSelectedNode('Action')}><b>Action</b><span>Create / update Case</span></button><button type="button" className="node approval" onClick={() => setSelectedNode('Approval')}><b>Approval</b><span>Containment policy gate</span></button><button type="button" className="node action action2" onClick={() => setSelectedNode('Action')}><b>Action</b><span>Dispatch endpoint task</span></button><button type="button" className="node action action3" onClick={() => setSelectedNode('Action')}><b>Action</b><span>Wait for receipt / rehydrate</span></button></div><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton onClick={() => queue('Validate playbook')}>Validate</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setSimulationOpen(true)}>Simulate</EuiButton></EuiFlexItem><EuiFlexItem /><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setRunOpen(true)}>Run / publish</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p34Inspector"><EuiTitle size="s"><h2>{selectedNode} configuration</h2></EuiTitle><EuiFormRow label="Node ID"><EuiFieldText value={`${selected.id}-${selectedNode.toLowerCase()}-03`} readOnly /></EuiFormRow><EuiFormRow label="Capability" helpText="Capability is derived from the selected node type."><EuiFieldText value={selectedCapability} readOnly /></EuiFormRow><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ inputs: ['caseRef','targetSnapshot'], outputs: ['requestId','receiptId'], retry: { maxAttempts: 2 }, authoritative: false }, null, 2)}</EuiCodeBlock><EuiSpacer /><EuiTitle size="xs"><h3>Path coverage</h3></EuiTitle>{[['Happy path',96],['Approval rejection',84],['Connector failure',71],['Partial side effects',58]].map(([label, value]) => <div key={String(label)}><strong>{label}</strong><EuiProgress value={Number(value)} max={100} size="s" color={Number(value) < 65 ? 'warning' : 'primary'} /></div>)}</EuiPanel>
    </div>
    {simulationOpen && <EuiFlyout onClose={() => setSimulationOpen(false)} ownFocus size="m" aria-labelledby="p34-sim-title"><EuiFlyoutHeader><EuiTitle><h2 id="p34-sim-title">Simulation trace</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Simulation only">No connector or ITSM step is executed. The trace exposes branch coverage, policy gates and expected receipts.</EuiCallOut><EuiSpacer />{['Trigger matched','Condition true','Case write accepted','Approval pending','Endpoint action not executed'].map((item, index) => <div className="p34Trace" key={item}><b>{index + 1}</b><strong>{item}</strong><EuiBadge color={index < 3 ? 'success' : 'warning'}>{index < 3 ? 'Simulated' : 'Pending'}</EuiBadge></div>)}</EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={() => setSimulationOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {runOpen && <EuiModal onClose={() => setRunOpen(false)} aria-labelledby="p34-run-title"><EuiModalHeader><EuiModalHeaderTitle id="p34-run-title">Publish or manual run impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Connector receipt boundary" color="warning">Accepted or approved steps are not completed steps. Each write requires a connector receipt and authoritative rehydration.</EuiCallOut><ul><li>Playbook: {selected.id}</li><li>Dependency: {selected.dependency}</li><li>Validation: {selected.validation}</li><li>Rollback: {selected.revision}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setRunOpen(false)}>Cancel</EuiButtonEmpty><EuiButton onClick={() => { queue('Manual run'); setRunOpen(false); }}>Queue run</EuiButton><EuiButton fill onClick={() => { queue('Publish playbook'); setRunOpen(false); }}>Queue publish</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}