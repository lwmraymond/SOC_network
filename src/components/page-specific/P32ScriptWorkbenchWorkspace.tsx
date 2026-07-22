import { useMemo, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiCodeBlock, EuiFieldSearch, EuiFieldText, EuiFlexGroup,
  EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiFormRow,
  EuiPanel,
  EuiSelect, EuiSpacer, EuiSwitch, EuiTextArea, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P32ScriptWorkbenchWorkspace.css';

loader.config({ monaco });

type Script = { id: string; name: string; language: string; lifecycle: string; owner: string; capability: string; dependency: string; tests: string; lastRun: string; revision: string; risk: string };
type ChangeEvent = { target: { value: string } };
type InspectorTab = 'Inputs' | 'Validation' | 'Runs' | 'Versions';
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const buildScripts = (rows: PrototypeRow[]): Script[] => rows.slice(0, 12).map((row, index) => ({
  id: text(row.script_id, `SCR-${String(index + 1).padStart(4, '0')}`),
  name: text(row.name, ['Collect endpoint triage','Normalize firewall evidence','Validate identity token','Prepare containment package'][index % 4]),
  language: text(row.language, ['TypeScript','Python','JavaScript','Python'][index % 4]),
  lifecycle: text(row.lifecycle, index % 5 === 0 ? 'Draft' : index % 7 === 0 ? 'Disabled' : 'Published'),
  owner: text(row.owner, ['Automation','Endpoint response','Identity engineering','SOC platform'][index % 4]),
  capability: text(row.capability, ['read.telemetry','upload.artifact','query.identity','execute.response'][index % 4]),
  dependency: text(row.dependency_state, index % 6 === 0 ? 'Broken' : 'Ready'),
  tests: text(row.test_state, index % 5 === 0 ? 'Failing' : 'Passing'),
  lastRun: text(row.last_run, `${index + 1}h ago`),
  revision: text(row.revision, `r${12 - index % 4}`),
  risk: text(row.risk, index % 4 === 3 ? 'High' : 'Medium'),
}));
const initialSource = `export async function run(input) {
  const targets = input.targets.filter((target) => target.eligible);
  return {
    summary: \`\${targets.length} targets prepared\`,
    artifacts: [],
    authoritative: false,
  };
}`;

export function P32ScriptWorkbenchWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [lifecycle, setLifecycle] = useState('Active');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [source, setSource] = useState(initialSource);
  const [tab, setTab] = useState<InspectorTab>('Inputs');
  const [dryRun, setDryRun] = useState(true);
  const [runOpen, setRunOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const scripts = useMemo(() => buildScripts(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => scripts.filter((item) => (!query.trim() || `${item.id} ${item.name} ${item.language} ${item.owner} ${item.capability}`.toLowerCase().includes(query.trim().toLowerCase())) && (lifecycle === 'All lifecycle' || (lifecycle === 'Active' ? item.lifecycle !== 'Disabled' : item.lifecycle === lifecycle))), [lifecycle, query, scripts]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? scripts[0];
  if (!selected) return null;
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; runner, attempts, outputs and production state remain authoritative.`);

  return <div className="pageComposition page-p32 differentiatedPage p32Scripts" data-page-specific-composition="P32-library-monaco-test-run">
    {receipt && <><EuiCallOut title="Prototype script receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <div className="p32Workbench">
      <EuiPanel paddingSize="m" hasBorder className="p32Library"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Script library</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty size="xs" onClick={() => setReceipt('Create script workbench opened in prototype mode.')}>New</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Script, code token, runtime, owner or capability" /><EuiSelect compressed value={lifecycle} onChange={(event: ChangeEvent) => setLifecycle(event.target.value)} options={['Active','All lifecycle','Published','Draft','Disabled'].map((value) => ({ value, text: value }))} />{visible.map((item) => <button type="button" key={item.id} className={item.id === selected.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span><EuiBadge color={item.tests === 'Passing' ? 'success' : 'danger'}>{item.tests}</EuiBadge><small>{item.revision}</small></span><strong>{item.name}</strong><small>{item.id} · {item.language} · {item.capability}</small></button>)}</EuiPanel>
      <EuiPanel paddingSize="none" hasBorder className="p32Editor"><header><div><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · {selected.language} · owner {selected.owner}</p></div><div><EuiBadge color={selected.dependency === 'Ready' ? 'success' : 'danger'}>{selected.dependency}</EuiBadge><EuiBadge color="hollow">{selected.lifecycle}</EuiBadge></div></header><Editor height="570px" language={selected.language === 'Python' ? 'python' : 'typescript'} value={source} onChange={(value: string | undefined) => setSource(value ?? '')} options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true, ariaLabel: `${selected.name} script editor` }} /><footer><EuiButton onClick={() => queue('Save draft')}>Save draft</EuiButton><EuiButton onClick={() => queue('Run tests')}>Run tests</EuiButton><EuiButton fill onClick={() => setRunOpen(true)}>Configure run</EuiButton></footer></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p32Inspector"><div className="p32Tabs" role="tablist">{(['Inputs','Validation','Runs','Versions'] as InspectorTab[]).map((item) => <button type="button" role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>{tab === 'Inputs' && <><EuiFormRow label="Input schema"><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ targets: { type: 'array', maxItems: 50 }, caseRef: { type: 'string' }, dryRun: { type: 'boolean' } }, null, 2)}</EuiCodeBlock></EuiFormRow><EuiFormRow label="Output contract"><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ summary: 'string', artifacts: 'array', authoritative: false }, null, 2)}</EuiCodeBlock></EuiFormRow></>}{tab === 'Validation' && <div className="p32Checks">{[['Type check','Pass'],['Unit tests',selected.tests],['Security scan','Pass'],['Dependencies',selected.dependency],['Capability scope',selected.capability]].map(([label, value]) => <div key={label}><strong>{label}</strong><EuiBadge color={value === 'Pass' || value === 'Passing' || value === 'Ready' ? 'success' : 'danger'}>{value}</EuiBadge></div>)}</div>}{tab === 'Runs' && <><EuiCodeBlock language="text" paddingSize="s">run-20260721-2210
sandbox=true
attempt=1
status=completed
outputs=0 artifacts</EuiCodeBlock><EuiButtonEmpty onClick={() => queue('Open run detail')}>Open run detail</EuiButtonEmpty></>}{tab === 'Versions' && <div className="p32Diff"><del>{selected.revision}: previous source</del><ins>draft: {source.slice(0, 180)}…</ins><EuiButtonEmpty color="danger" onClick={() => queue('Rollback review')}>Review rollback</EuiButtonEmpty></div>}<EuiSpacer /><EuiCallOut title="Execution boundary" size="s">No KPI or decorative chart is used. Script source, inputs, runner attempts and authoritative outputs are kept separate.</EuiCallOut></EuiPanel>
    </div>
    {runOpen && <EuiFlyout onClose={() => setRunOpen(false)} ownFocus size="m" aria-labelledby="p32-run-title"><EuiFlyoutHeader><EuiTitle><h2 id="p32-run-title">Run configuration</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiSwitch checked={dryRun} onChange={() => setDryRun((value) => !value)} label="Dry run / sandbox" /><EuiFormRow label="Targets" helpText="Explicit target snapshot; maximum 50."><EuiTextArea value={'asset-031\nasset-044'} readOnly rows={4} /></EuiFormRow><EuiFormRow label="Capability" helpText="Capability is derived from the selected script revision."><EuiFieldText value={selected.capability} readOnly /></EuiFormRow><EuiCallOut title="Production impact" color="warning">Non-sandbox or high-impact execution requires approval, Change linkage and immutable attempt receipts.</EuiCallOut></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={() => setRunOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue(dryRun ? 'Dry run' : 'Production run request'); setRunOpen(false); }}>Queue {dryRun ? 'dry run' : 'approval'}</EuiButton></EuiFlyoutFooter></EuiFlyout>}
  </div>;
}