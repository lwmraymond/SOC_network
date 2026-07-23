import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiCheckbox, EuiCodeBlock, EuiFieldSearch,
  EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader,
  EuiModalHeaderTitle, EuiPanel, EuiSelect, EuiSpacer, EuiTextArea, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture } from '../../types/prototype';

type Session = { id: string; title: string; linked: string; updated: string; status: string };
type Citation = { id: string; source: string; age: string; coverage: string; conflict: boolean };
type ChangeEvent = { target: { value: string } };
const sessions: Session[] = [
  { id: 'cop-1042', title: 'Identity outage evidence review', linked: 'INC-7000 · CASE-810', updated: '4m', status: 'Active' },
  { id: 'cop-1038', title: 'Generate high-risk event query', linked: 'P07 saved query', updated: '1h', status: 'Draft' },
  { id: 'cop-1029', title: 'Change impact summary', linked: 'CHG-8200', updated: '3h', status: 'Approval' },
  { id: 'cop-1017', title: 'Endpoint isolation proposal', linked: 'ACT-260', updated: '1d', status: 'Receipt' },
];
const citations: Citation[] = [
  { id: 'cit-01', source: 'INC-7000 timeline', age: '2m', coverage: 'Complete', conflict: false },
  { id: 'cit-02', source: 'CASE-810 evidence', age: '7m', coverage: 'Partial', conflict: false },
  { id: 'cit-03', source: 'Identity service telemetry', age: '11m', coverage: 'Conflicting', conflict: true },
];
const analystPrompts = [
  'Compare the incident timeline with the attached Case evidence.',
  'Identify the strongest conflicting telemetry source.',
  'Draft a validation query without executing it.',
];
const copilotResponses = [
  'The incident and Case agree on the failover window. Identity telemetry conflicts with the endpoint timeline, so I have kept that source unresolved.',
  'I prepared a draft-only validation query scoped to INC-7000 and CASE-810. It still requires governed approval before execution.',
];

export function P23CopilotWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [selectedId, setSelectedId] = useState(sessions[0].id);
  const [query, setQuery] = useState('Summarize the evidence and draft a query to validate the suspected identity-provider failover.');
  const [scope, setScope] = useState('Explicit incident + case context');
  const [includeTelemetry, setIncludeTelemetry] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const selected = sessions.find((item) => item.id === selectedId) ?? sessions[0];
  const messages = useMemo(() => fixture.timeline.slice(0, 4), [fixture.timeline]);
  const send = () => setReceipt(`Message accepted for ${selected.id}; answer generation remains a prototype and no evidence or work item was mutated.`);
  const approveTool = () => { setReceipt('Tool proposal queued for governed approval. No query, Case, ITSM item or response action was executed.'); setApprovalOpen(false); };

  return <div className="pageComposition page-p23 differentiatedPage" data-page-specific-composition="P23-conversation-evidence-tool-governance">
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="copilot-session-rail">
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Sessions</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty size="xs">New</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup>
        <EuiFieldSearch compressed placeholder="Session, Case, Asset or ITSM ID" />
        <EuiSpacer size="s" />{sessions.map((item) => <button type="button" key={item.id} className={item.id === selectedId ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><strong>{item.title}</strong><span>{item.linked}</span><small>{item.updated} · {item.status}</small></button>)}
      </EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={6}><div data-visual-region="copilot-conversation-workbench">
        {receipt && <><EuiCallOut title="Prototype Copilot receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
        <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.title}</h2></EuiTitle><p>{selected.linked} · session {selected.id}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="warning">Evidence conflict</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer size="m" />
          <div className="conversationTranscript">{messages.map((item, index) => <article key={`${item.time}-${index}`} className={index % 2 ? 'assistant' : 'user'}><header><strong>{index % 2 ? 'Copilot' : 'Analyst'}</strong><time>{item.time}</time></header><p>{index % 2 ? copilotResponses[Math.floor(index / 2)] : analystPrompts[Math.floor(index / 2)]}</p>{index % 2 === 1 && <div>{citations.map((citation) => <EuiBadge key={citation.id} color={citation.conflict ? 'danger' : 'hollow'}>{citation.id} · {citation.source}</EuiBadge>)}</div>}</article>)}</div>
          <EuiSpacer size="m" /><EuiFormRow label="Message"><EuiTextArea value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} rows={4} /></EuiFormRow>
          <EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={false}><EuiButtonEmpty>Attach context</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setReceipt('A normalized P07 query draft was prepared; it has not been executed.')}>Generate query</EuiButtonEmpty></EuiFlexItem><EuiFlexItem /><EuiFlexItem grow={false}><EuiButton fill isDisabled={!query.trim()} onClick={send}>Send message</EuiButton></EuiFlexItem></EuiFlexGroup>
        </EuiPanel>
      </div></EuiFlexItem>
      <EuiFlexItem grow={3}><EuiPanel paddingSize="m" hasBorder data-visual-region="copilot-evidence-tool-context">
        <EuiTitle size="s"><h2>Evidence & tool context</h2></EuiTitle>
        <div className="p23ContextGrid">
          <section><EuiTitle size="xs"><h3>Authorized scope</h3></EuiTitle><EuiSelect value={scope} onChange={(event: ChangeEvent) => setScope(event.target.value)} options={['Explicit incident + case context','Current Asset 360 context','Current ITSM work item','No attached context'].map((value) => ({ value, text: value }))} />
            <EuiCheckbox id="p23-include-authorized-telemetry" checked={includeTelemetry} onChange={() => setIncludeTelemetry((value) => !value)} label="Include authorized telemetry" />
            <EuiCallOut title="Permission-trimmed scope" size="s">{scope}. Hidden fields and unauthorized datasets are excluded; scope never expands silently.</EuiCallOut>
          </section>
          <section><EuiTitle size="xs"><h3>Citations</h3></EuiTitle>{citations.map((item) => <div className="copilotCitationRow" key={item.id}><strong>{item.source}</strong><span>{item.age} · {item.coverage}</span><EuiBadge color={item.conflict ? 'danger' : 'success'}>{item.conflict ? 'Conflict' : 'Fresh'}</EuiBadge></div>)}</section>
          <section><EuiTitle size="xs"><h3>Tool proposal</h3></EuiTitle><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ tool: 'event_search.create_query', scope: 'INC-7000', mode: 'draft_only', policy: 'copilot-tools@r12' }, null, 2)}</EuiCodeBlock><EuiSpacer size="s" /><EuiButton fill fullWidth onClick={() => setApprovalOpen(true)}>Review tool request</EuiButton></section>
        </div>
      </EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    {approvalOpen && <EuiModal onClose={() => setApprovalOpen(false)} aria-labelledby="p23-tool-title"><EuiModalHeader><EuiModalHeaderTitle id="p23-tool-title">Tool approval and impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Draft-only proposal" color="warning">Approval queues a governed request. It does not execute the query, create a Case, or mutate ITSM state.</EuiCallOut><ul><li>Tool: event_search.create_query</li><li>Scope: explicit INC-7000 + CASE-810 context</li><li>Policy: copilot-tools@r12</li><li>Resulting state: pending approval</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setApprovalOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={approveTool}>Queue approval</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
