import { useMemo, useRef, useState } from 'react';
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
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P26AgentRuntimeAccessWorkspace.css';

type Policy = {
  key: string;
  id: string;
  subject: string;
  capability: string;
  resource: string;
  effect: string;
  conditions: string;
  risk: string;
  state: string;
  hits: number;
  expiry: string;
  revision: string;
  conflict: string;
};
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const number = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildPolicies = (rows: PrototypeRow[]): Policy[] => rows.slice(0, 12).map((row, index) => ({
  key: `${row.id}:${index}`,
  id: text(row.policy_id, `POL-${5100 + index}`),
  subject: text(row.agent_scope, `fleet:${['endpoint','cloud','restricted','taipei'][index % 4]}`),
  capability: text(row.capability, ['execute.response','query.events','run.script','read.artifact'][index % 4]),
  resource: text(row.resource_scope, [`site:${['prod','corp','cloud','isolated'][index % 4]}`,`dataset:security-${index % 3}`][index % 2]),
  effect: text(row.effect, index % 6 === 0 ? 'Deny' : 'Allow'),
  conditions: text(row.conditions, index % 3 === 0 ? 'approval=true AND window=maintenance' : 'risk<=medium'),
  risk: text(row.risk, index < 3 ? 'Critical' : index < 7 ? 'High' : 'Medium'),
  state: text(row.state, index % 4 === 0 ? 'Draft' : 'Published'),
  hits: number(row.hit_count, index % 5 === 0 ? 0 : 12 + index * 3),
  expiry: text(row.expires_at, index % 4 === 0 ? '7d' : 'None'),
  revision: text(row.revision, `r${14 - index % 4}`),
  conflict: text(row.conflict, index % 5 === 0 ? 'Unresolved overlap' : 'None'),
}));

export function P26AgentRuntimeAccessWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState('High and critical');
  const [selectedKey, setSelectedKey] = useState<string>();
  const [subject, setSubject] = useState('fleet:endpoint');
  const [capability, setCapability] = useState('execute.response');
  const [resource, setResource] = useState('site:prod');
  const [includeDraft, setIncludeDraft] = useState(true);
  const [evaluation, setEvaluation] = useState<'Not run' | 'Deny' | 'Allow'>('Not run');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftExists, setDraftExists] = useState(false);
  const [draftEffect, setDraftEffect] = useState('Allow');
  const [draftConditions, setDraftConditions] = useState('approval=true AND case.severity>=high');
  const [publishOpen, setPublishOpen] = useState(false);
  const [receipt, setReceipt] = useState<string>();
  const editorOpener = useRef<HTMLButtonElement | null>(null);

  const policies = useMemo(() => buildPolicies(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => policies.filter((item) => {
    const term = query.trim().toLowerCase();
    return (!term || `${item.id} ${item.subject} ${item.capability} ${item.resource} ${item.conditions}`.toLowerCase().includes(term))
      && (risk === 'All risk' || (risk === 'High and critical' ? ['High','Critical'].includes(item.risk) : item.risk === risk));
  }), [policies, query, risk]);
  const selected = policies.find((item) => item.key === selectedKey);
  const status = {
    highRiskGrants: policies.filter((item) => item.effect === 'Allow' && ['High','Critical'].includes(item.risk) && item.state === 'Published').length,
    conflicts: policies.filter((item) => item.conflict !== 'None').length,
    unused: policies.filter((item) => item.hits === 0).length,
    expiring: policies.filter((item) => item.expiry !== 'None').length,
  };

  const selectPolicy = (policy: Policy) => {
    setSelectedKey(policy.key);
    setDraftExists(policy.state === 'Draft');
    setDraftEffect(policy.effect);
    setDraftConditions(policy.conditions);
  };
  const simulate = () => {
    const decision = resource.includes('prod') || draftConditions.includes('approval=true') ? 'Deny' : 'Allow';
    setEvaluation(decision);
    setReceipt(`Prototype effective-access simulation returned ${decision.toUpperCase()} for ${subject} → ${capability} on ${resource}. No policy or task state changed.`);
  };
  const openEditor = () => {
    if (!selected) return;
    setDraftExists(selected.state === 'Draft');
    setDraftEffect(selected.effect);
    setDraftConditions(selected.conditions);
    setEditorOpen(true);
  };
  const closeEditor = () => {
    setEditorOpen(false);
    requestAnimationFrame(() => editorOpener.current?.focus());
  };
  const createDraft = () => {
    setDraftExists(true);
    setReceipt(`Prototype draft initialized from ${selected?.revision}. Published effective access remains unchanged.`);
  };
  const saveDraft = () => {
    setReceipt(`Prototype draft saved for ${selected?.id}. Validation, approval and authoritative publication remain pending.`);
  };
  const publish = () => {
    if (!selected) return;
    setReceipt(`Publish request queued for ${selected.id}. Running-task impact, approval, audit receipt and authoritative re-evaluation remain pending.`);
    setPublishOpen(false);
    closeEditor();
  };

  return <div className="pageComposition page-p26 differentiatedPage p26RuntimeAccess" data-page-specific-composition="P26-policy-grid-effective-access-selection-editor">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="runtime-policy-command">
      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Policy, agent scope, capability, resource or condition" aria-label="Search runtime policies" /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed value={risk} onChange={(event: ChangeEvent) => setRisk(event.target.value)} options={['High and critical','All risk','Critical','High','Medium'].map((value) => ({ value, text: value }))} aria-label="Policy risk" /></EuiFlexItem>
      </EuiFlexGroup>
      <div className="p26StatusStrip">
        <span><strong>{status.highRiskGrants}</strong> high-risk grants</span>
        <span><strong>{status.conflicts}</strong> conflicts</span>
        <span><strong>{status.unused}</strong> unused</span>
        <span><strong>{status.expiring}</strong> expiring</span>
      </div>
    </EuiPanel>

    {receipt && <EuiCallOut title="Policy evaluation receipt" color="warning">{receipt}</EuiCallOut>}

    <div className="p26Workspace">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="policy-grid">
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Runtime policy grid</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <p>Select one policy before editing or reviewing its draft impact.</p>
        <div className="p26TableWrap"><table><thead><tr><th>Policy</th><th>Subject</th><th>Capability / resource</th><th>Effect</th><th>Risk</th><th>Attention</th></tr></thead><tbody>{visible.map((item) => <tr key={item.key} aria-selected={item.key === selectedKey}><td><EuiButtonEmpty size="xs" onClick={() => selectPolicy(item)}>{item.id}</EuiButtonEmpty><small>{item.revision} · {item.state}</small></td><td>{item.subject}</td><td><strong>{item.capability}</strong><small>{item.resource}</small></td><td><EuiBadge color={item.effect === 'Allow' ? 'warning' : 'danger'}>{item.effect}</EuiBadge></td><td>{item.risk}</td><td><div className="p26Attention">{item.conflict !== 'None' && <EuiBadge color="danger">Conflict</EuiBadge>}{item.hits === 0 && <EuiBadge color="hollow">Unused</EuiBadge>}{item.expiry !== 'None' && <EuiBadge color="warning">Expires {item.expiry}</EuiBadge>}</div></td></tr>)}</tbody></table></div>
        <div className="p26SelectionBar">
          {selected ? <><span><strong>{selected.id}</strong> · {selected.subject} · {selected.capability}</span><EuiButton buttonRef={editorOpener} onClick={openEditor}>{draftExists ? 'Open draft editor' : 'Inspect policy'}</EuiButton></> : <span>Select a policy to inspect revision, consumers and draft state.</span>}
        </div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder data-visual-region="effective-access-explorer">
        <EuiTitle size="s"><h2>Effective access explorer</h2></EuiTitle>
        <p>Evaluate a subject, capability and resource tuple independently from policy authoring.</p>
        <div className="p26AccessGrid">
          <EuiFormRow label="Agent / fleet"><EuiSelect value={subject} onChange={(event: ChangeEvent) => setSubject(event.target.value)} options={['fleet:endpoint','fleet:cloud','agent:agt-001'].map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiFormRow label="Capability"><EuiSelect value={capability} onChange={(event: ChangeEvent) => setCapability(event.target.value)} options={['execute.response','query.events','run.script','read.artifact'].map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiFormRow label="Resource"><EuiSelect value={resource} onChange={(event: ChangeEvent) => setResource(event.target.value)} options={['site:prod','dataset:security-1','asset:critical'].map((value) => ({ value, text: value }))} /></EuiFormRow>
        </div>
        <EuiSwitch checked={includeDraft} onChange={() => setIncludeDraft((value) => !value)} label="Include selected draft when available" />
        <EuiSpacer size="m" />
        <EuiButton fill onClick={simulate}>Simulate decision</EuiButton>
        {evaluation !== 'Not run' && <><EuiSpacer size="m" /><EuiCallOut title={`Final decision: ${evaluation.toUpperCase()}`} color={evaluation === 'Deny' ? 'warning' : 'success'}>The result is a simulation receipt, not an authorization mutation.</EuiCallOut><EuiAccordion id="p26-decision-trace" buttonContent="Show decision precedence trace" paddingSize="s"><EuiCodeBlock language="text" paddingSize="s">{`1. explicit deny on ${resource} → ${evaluation === 'Deny' ? 'matched' : 'not matched'}\n2. allow ${capability} when approval=true → condition false\n3. default policy → deny\nFINAL: ${evaluation.toUpperCase()}`}</EuiCodeBlock></EuiAccordion></>}
      </EuiPanel>
    </div>

    {editorOpen && selected && <EuiFlyout onClose={closeEditor} ownFocus size="m" aria-labelledby="p26-editor-title">
      <EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p26-editor-title">{selected.id} policy editor</h2></EuiTitle></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <dl className="p26Definition"><div><dt>Revision</dt><dd>{selected.revision}</dd></div><div><dt>State</dt><dd>{selected.state}</dd></div><div><dt>Hits</dt><dd>{selected.hits}</dd></div><div><dt>Expiry</dt><dd>{selected.expiry}</dd></div><div><dt>Conflict</dt><dd>{selected.conflict}</dd></div></dl>
        {!draftExists ? <EuiCallOut title="No draft exists">Create a draft before editing conditions, reviewing a diff or publishing.</EuiCallOut> : <>
          <EuiFormRow label="Effect"><EuiSelect value={draftEffect} onChange={(event: ChangeEvent) => setDraftEffect(event.target.value)} options={['Allow','Deny'].map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiFormRow label="Conditions"><EuiTextArea value={draftConditions} onChange={(event: ChangeEvent) => setDraftConditions(event.target.value)} rows={4} /></EuiFormRow>
          <div className="p26Diff"><article><strong>Published</strong><code>{selected.effect} {selected.capability} on {selected.resource} when {selected.conditions}</code></article><article><strong>Draft</strong><code>{draftEffect} {selected.capability} on {selected.resource} when {draftConditions}</code></article></div>
          <EuiCallOut title="Running-task impact" color="warning">3 running tasks rely on the current effective decision. Revocation requires recovery planning and authoritative re-evaluation.</EuiCallOut>
        </>}
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiButtonEmpty onClick={closeEditor}>Close</EuiButtonEmpty>
        {!draftExists ? <EuiButton fill onClick={createDraft}>Create draft</EuiButton> : <><EuiButton onClick={saveDraft}>Save draft</EuiButton><EuiButton fill onClick={() => setPublishOpen(true)}>Review publish</EuiButton></>}
      </EuiFlyoutFooter>
    </EuiFlyout>}

    {publishOpen && selected && draftExists && <EuiModal onClose={() => setPublishOpen(false)} aria-labelledby="p26-publish-title"><EuiModalHeader><EuiModalHeaderTitle id="p26-publish-title">Policy publish and task impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="High-risk governance" color="warning">Critical capability grants and revocations require approval, conflict resolution and an audit receipt.</EuiCallOut><ul><li>Policy: {selected.id}</li><li>Risk: {selected.risk}</li><li>Conflict: {selected.conflict}</li><li>Running tasks impacted: 3</li><li>Rollback revision: {selected.revision}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setPublishOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={publish}>Queue publish</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}