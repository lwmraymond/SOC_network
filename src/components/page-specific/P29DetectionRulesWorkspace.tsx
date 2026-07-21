import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiCodeBlock, EuiFieldSearch, EuiFlexGroup,
  EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiFormRow,
  EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel,
  EuiProgress, EuiSelect, EuiSpacer, EuiStat, EuiSwitch, EuiTextArea, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P29DetectionRulesWorkspace.css';

type Rule = {
  id: string; name: string; type: string; lifecycle: string; severity: string; health: string;
  owner: string; query: string; dataset: string; technique: string; enabled: boolean; yield30d: number;
  falsePositive: number; revision: string; schedule: string; dependency: string;
};
type ChangeEvent = { target: { value: string } };
type WorkTab = 'Definition' | 'Replay' | 'Outcomes' | 'Diff';

const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const num = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildRules = (rows: PrototypeRow[]): Rule[] => rows.slice(0, 16).map((row, index) => ({
  id: text(row.rule_id, `RULE-${String(index + 1).padStart(4, '0')}`),
  name: text(row.name, ['Suspicious identity failover','Rare privileged process','Cloud credential anomaly','Endpoint isolation bypass'][index % 4]),
  type: text(row.rule_type, ['KQL','ES|QL','Threshold','Machine learning'][index % 4]),
  lifecycle: text(row.lifecycle, index % 6 === 0 ? 'Draft' : index % 7 === 0 ? 'Deprecated' : 'Published'),
  severity: text(row.severity, index < 3 ? 'Critical' : index < 8 ? 'High' : 'Medium'),
  health: text(row.run_health, index % 5 === 0 ? 'Failing' : index % 6 === 0 ? 'Gapped' : 'Healthy'),
  owner: text(row.owner, ['Detection engineering','Identity detections','Cloud security','Endpoint detections'][index % 4]),
  query: text(row.query, `event.category:authentication and risk_score >= ${60 + index}`),
  dataset: text(row.dataset, ['logs-identity-*','logs-endpoint-*','logs-cloud-*','alerts-security-*'][index % 4]),
  technique: text(row.mitre_technique, ['T1078','T1059','T1552','T1562'][index % 4]),
  enabled: Boolean(row.enabled ?? (index % 6 !== 0)),
  yield30d: num(row.alert_yield_30d, index % 5 === 0 ? 0 : 18 + index * 4),
  falsePositive: num(row.false_positive_rate, index % 4 === 0 ? 38 : 8 + index),
  revision: text(row.revision, `r${22 - index % 5}`),
  schedule: text(row.schedule, index % 2 ? 'Every 5m / lookback 10m' : 'Every 1m / lookback 5m'),
  dependency: text(row.dependency_health, index % 6 === 0 ? 'Schema break' : 'Ready'),
}));

export function P29DetectionRulesWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [lifecycle, setLifecycle] = useState('Active and draft');
  const [health, setHealth] = useState('Attention first');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<WorkTab>('Definition');
  const [source, setSource] = useState('from logs-identity-* | where event.category == "authentication" | stats count() by user.name, source.ip');
  const [enabled, setEnabled] = useState(true);
  const [executionOpen, setExecutionOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const rules = useMemo(() => buildRules(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => rules.filter((item) => {
    const haystack = `${item.id} ${item.name} ${item.query} ${item.dataset} ${item.technique} ${item.owner}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (lifecycle === 'All lifecycle' || (lifecycle === 'Active and draft' ? item.lifecycle !== 'Deprecated' : item.lifecycle === lifecycle))
      && (health === 'All health' || (health === 'Attention first' ? item.health !== 'Healthy' : item.health === health));
  }), [health, lifecycle, query, rules]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? rules[0];
  if (!selected) return null;
  const metrics = {
    enabled: rules.filter((item) => item.enabled).length,
    failing: rules.filter((item) => item.health !== 'Healthy').length,
    broken: rules.filter((item) => item.dependency !== 'Ready').length,
    falsePositive: rules.filter((item) => item.falsePositive >= 30).length,
    lowYield: rules.filter((item) => item.yield30d < 5).length,
  };
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; scheduler, alert outcomes and production revision remain authoritative.`);

  return <div className="pageComposition page-p29 differentiatedPage p29Rules" data-page-specific-composition="P29-rule-library-editor-replay">
    <EuiPanel paddingSize="m" hasBorder className="p29Scope">
      <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
        <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Rule ID, name, KQL/ES|QL, dataset, technique, owner or error" /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed value={lifecycle} onChange={(event: ChangeEvent) => setLifecycle(event.target.value)} options={['Active and draft','All lifecycle','Published','Draft','Deprecated'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed value={health} onChange={(event: ChangeEvent) => setHealth(event.target.value)} options={['Attention first','All health','Healthy','Failing','Gapped'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt('Create rule workbench opened in prototype mode; no production rule was created.')}>Create rule</EuiButton></EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
    <EuiSpacer size="m" />
    {receipt && <><EuiCallOut title="Prototype rule receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="s" wrap className="p29Metrics">
      {[
        ['Enabled rules', metrics.enabled], ['Failing / gapped', metrics.failing], ['Schema breaks', metrics.broken],
        ['High false-positive', metrics.falsePositive], ['Never / low yield', metrics.lowYield],
      ].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /></EuiPanel></EuiFlexItem>)}
    </EuiFlexGroup>
    <EuiSpacer size="m" />
    <div className="p29Workbench">
      <EuiPanel paddingSize="m" hasBorder className="p29Library">
        <EuiTitle size="s"><h2>Detection rule library</h2></EuiTitle>
        <div className="p29RuleRows">{visible.map((item) => <button type="button" key={item.id} className={item.id === selected.id ? 'selected' : ''} onClick={() => { setSelectedId(item.id); setSource(item.query); }}>
          <span><EuiBadge color={item.health === 'Healthy' ? 'success' : item.health === 'Failing' ? 'danger' : 'warning'}>{item.health}</EuiBadge><small>{item.id} · {item.revision}</small></span>
          <strong>{item.name}</strong>
          <span>{item.type} · {item.dataset}</span>
          <small>{item.technique} · {item.yield30d} alerts / 30d</small>
        </button>)}</div>
      </EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p29Editor">
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · owner {selected.owner} · {selected.schedule}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiSwitch checked={enabled} onChange={() => setEnabled((value) => !value)} label="Enabled in draft" /></EuiFlexItem></EuiFlexGroup>
        <div className="p29Tabs" role="tablist">{(['Definition','Replay','Outcomes','Diff'] as WorkTab[]).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{item}</button>)}</div>
        {tab === 'Definition' && <><EuiFormRow label={`${selected.type} rule source`} helpText="Use authorized datasets and exact field paths. Raw event investigation remains in Event Search & Hunt."><EuiTextArea value={source} onChange={(event: ChangeEvent) => setSource(event.target.value)} rows={12} /></EuiFormRow><div className="p29DefinitionGrid"><dl><div><dt>Dataset</dt><dd>{selected.dataset}</dd></div><div><dt>Technique</dt><dd>{selected.technique}</dd></div><div><dt>Severity</dt><dd>{selected.severity}</dd></div><div><dt>Dependency</dt><dd>{selected.dependency}</dd></div></dl><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ schedule: selected.schedule, riskScore: 73, suppression: 'user.name + source.ip', revision: selected.revision }, null, 2)}</EuiCodeBlock></div></>}
        {tab === 'Replay' && <div className="p29Replay"><EuiCallOut title="Replay uses a frozen event window">No production alert is created. Outcomes are compared with analyst labels and rule exceptions.</EuiCallOut>{fixture.timeline.slice(0, 6).map((item, index) => <div key={`${item.time}-${index}`}><time>{item.time}</time><strong>{item.title}</strong><span>{index % 3 === 0 ? 'Matched · review' : 'No match'}</span></div>)}<EuiButton fill onClick={() => queue('Replay test')}>Run replay</EuiButton></div>}
        {tab === 'Outcomes' && <div className="p29OutcomeGrid"><article><strong>{selected.yield30d}</strong><span>Alerts generated</span></article><article><strong>{selected.falsePositive}%</strong><span>False-positive candidate</span></article><article><strong>68%</strong><span>Case-linked coverage</span></article><article><strong>4</strong><span>Exception candidates</span></article></div>}
        {tab === 'Diff' && <div className="p29Diff"><del>{selected.revision}: {selected.query}</del><ins>draft: {source}</ins><EuiCallOut title="Breaking-change check" color={selected.dependency === 'Ready' ? 'success' : 'warning'}>{selected.dependency === 'Ready' ? 'Field and dataset dependencies resolve.' : 'Schema dependency is unresolved; publication must remain blocked.'}</EuiCallOut></div>}
        <EuiSpacer size="m" /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton onClick={() => queue('Validate rule')}>Validate</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setExecutionOpen(true)}>Execution detail</EuiButtonEmpty></EuiFlexItem><EuiFlexItem /><EuiFlexItem grow={false}><EuiButton fill onClick={() => setPublishOpen(true)}>Review publish</EuiButton></EuiFlexItem></EuiFlexGroup>
      </EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p29Coverage">
        <EuiTitle size="xs"><h2>Coverage & runtime</h2></EuiTitle>
        {['Credential access','Execution','Defense evasion','Collection'].map((label, index) => <div key={label}><strong>{label}</strong><EuiProgress value={[78,63,51,36][index]} max={100} size="s" color={index > 1 ? 'warning' : 'primary'} /><span>{[8,6,5,3][index]} rules</span></div>)}
        <EuiSpacer /><EuiCallOut title="Elastic-style status language" size="s">Color is paired with labels, counts and copy. Failing, gapped and draft states remain explicit.</EuiCallOut>
      </EuiPanel>
    </div>
    {executionOpen && <EuiFlyout onClose={() => setExecutionOpen(false)} ownFocus size="m" aria-labelledby="p29-execution-title"><EuiFlyoutHeader><EuiTitle><h2 id="p29-execution-title">Rule execution detail</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Runtime receipt">Execution health comes from the scheduler and alert outcome store, not the editor state.</EuiCallOut><EuiSpacer /><EuiCodeBlock language="text" paddingSize="s">run rule-20260721-1042
attempt 1 · query compiled
dataset watermark 2m
result: 18 matches · 2 suppressed · 0 errors</EuiCodeBlock></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={() => setExecutionOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {publishOpen && <EuiModal onClose={() => setPublishOpen(false)} aria-labelledby="p29-publish-title"><EuiModalHeader><EuiModalHeaderTitle id="p29-publish-title">Rule publish impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Governed publication" color="warning">High-risk publish or disable may require approval and Change linkage. Queued does not mean enabled.</EuiCallOut><ul><li>Rule: {selected.id}</li><li>Dataset: {selected.dataset}</li><li>Dependency: {selected.dependency}</li><li>Replay outcome: review required</li><li>Rollback: {selected.revision}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setPublishOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue('Publish rule'); setPublishOpen(false); }}>Queue publish</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
