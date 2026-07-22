import { useMemo, useRef, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHealth,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { useSearchParams } from 'react-router-dom';
import type { PrototypePageFixture, PrototypeRow } from '../../types/prototype';

const caseTabs = ['Overview', 'Timeline', 'Evidence', 'Entities', 'Work', 'Response', 'ITSM', 'Audit'];

function caseRows(rows: PrototypeRow[]) {
  return rows.slice(0, 9).map((row, index) => ({
    ...row,
    title: String(row.title ?? `Security investigation ${index + 1}`),
    classification: String(row.classification ?? ['Credential access', 'Execution', 'Persistence'][index % 3]),
    entities: String(row.entities ?? `${3 + index} entities`),
    mitre: String(row.mitre_techniques ?? ['T1078', 'T1059', 'T1547'][index % 3]),
    sla: String(row.sla ?? (index < 2 ? 'At risk' : `${40 + index * 12}m left`)),
    response: String(row.response_state ?? ['Not requested', 'Approval pending', 'Executing'][index % 3]),
    activity: String(row.last_activity_at ?? `2026-07-18 ${String(11 - index).padStart(2, '0')}:20 +08`),
    risk: Number(row.risk_score ?? 92 - index * 6),
  }));
}

export function P04CaseInvestigationWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Open and investigating');
  const [owner, setOwner] = useState('All owners');
  const [slaRiskOnly, setSlaRiskOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewOpener = useRef<HTMLButtonElement | null>(null);
  const cases = useMemo(() => caseRows(fixture.rows), [fixture.rows]);
  const selectedId = searchParams.get('case') ?? cases[0]?.id;
  const selectedCase = cases.find((item) => item.id === selectedId) ?? cases[0];

  const visibleCases = useMemo(() => cases.filter((item) => {
    const matchesQuery = !query.trim() || `${item.id} ${item.title} ${item.classification} ${item.owner} ${item.entities}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesOwner = owner === 'All owners' || String(item.owner) === owner;
    const matchesSla = !slaRiskOnly || item.sla === 'At risk';
    return matchesQuery && matchesOwner && matchesSla;
  }), [cases, owner, query, slaRiskOnly]);

  const selectCase = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('case', id);
      return next;
    }, { replace: true });
    setActiveTab('Overview');
  };
  const closePreview = () => {
    setPreviewOpen(false);
    requestAnimationFrame(() => previewOpener.current?.focus());
  };

  if (!selectedCase) return null;

  return (
    <div className="pageComposition page-p04 differentiatedPage" data-page-specific-composition="P04-case-investigation-tabs">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="case-scope-toolbar">
        <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
          <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search case, entity or IOC" aria-label="Search security cases" /></EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 180 }}><EuiSelect compressed aria-label="Case status" value={status} onChange={(event) => setStatus(event.target.value)} options={['Open and investigating', 'Awaiting response', 'Pending closure', 'All active states'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 160 }}><EuiSelect compressed aria-label="Case owner" value={owner} onChange={(event) => setOwner(event.target.value)} options={['All owners', 'SOC Tier 2', 'Identity Ops', 'Network Response', 'Unassigned'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiFilterGroup><EuiFilterButton hasActiveFilters={slaRiskOnly} numActiveFilters={slaRiskOnly ? 1 : 0} onClick={() => setSlaRiskOnly((value) => !value)}>SLA at risk</EuiFilterButton></EuiFilterGroup></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Last activity · 24h</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={false}><EuiText size="xs" color="subdued"><p>Saved views:</p></EuiText></EuiFlexItem>{['My critical cases', 'Unassigned high risk', 'Evidence gaps', 'Response pending'].map((view, index) => <EuiFlexItem key={view} grow={false}><EuiButtonEmpty size="xs" color={index === 0 ? 'primary' : 'text'}>{view}</EuiButtonEmpty></EuiFlexItem>)}</EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
        <EuiFlexItem grow={2} style={{ minWidth: 280 }}>
          <EuiPanel paddingSize="s" hasBorder data-visual-region="analyst-case-queue">
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}><EuiFlexItem><EuiTitle size="xs"><h2>Analyst queue</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{visibleCases.length}</EuiBadge></EuiFlexItem></EuiFlexGroup>
            <EuiSpacer size="s" />
            {visibleCases.map((item, index) => <button type="button" key={item.id} onClick={() => selectCase(item.id)} aria-pressed={item.id === selectedCase.id} style={{ width: '100%', textAlign: 'left', border: item.id === selectedCase.id ? '2px solid currentColor' : '1px solid rgba(128,128,128,.35)', borderRadius: 8, padding: 12, marginBottom: 8, background: 'transparent', color: 'inherit', cursor: 'pointer' }}><EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}><EuiFlexItem grow={false}><EuiBadge color={index < 2 ? 'danger' : index < 5 ? 'warning' : 'hollow'}>{item.severity}</EuiBadge></EuiFlexItem><EuiFlexItem><strong>{item.title}</strong><EuiText size="xs" color="subdued"><p>{item.id} · {item.classification}</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><strong>{item.risk}</strong><small style={{ display: 'block' }}>risk</small></EuiFlexItem></EuiFlexGroup><EuiFlexGroup gutterSize="s" responsive={false}><EuiFlexItem><small>{String(item.owner)}</small></EuiFlexItem><EuiFlexItem grow={false}><small>{item.sla}</small></EuiFlexItem></EuiFlexGroup></button>)}
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={5}>
          <EuiPanel paddingSize="m" hasBorder data-visual-region="selected-case-investigation">
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart" responsive={false}><EuiFlexItem><EuiBadge color="danger">{selectedCase.severity} · Risk {selectedCase.risk}</EuiBadge><EuiSpacer size="s" /><EuiTitle size="m"><h2>{selectedCase.title}</h2></EuiTitle><EuiText size="s" color="subdued"><p>{selectedCase.id} · {selectedCase.classification} · owner {String(selectedCase.owner)}</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty buttonRef={previewOpener} onClick={() => setPreviewOpen(true)}>Preview case facts</EuiButtonEmpty><EuiButton fill>Open full case</EuiButton></EuiFlexItem></EuiFlexGroup>
            <EuiSpacer size="m" /><EuiTabs size="s">{caseTabs.map((tab) => <EuiTab key={tab} isSelected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</EuiTab>)}</EuiTabs><EuiSpacer size="m" />
            {activeTab === 'Overview' && <EuiFlexGroup gutterSize="m" responsive={false}><EuiFlexItem grow={3}><EuiPanel paddingSize="m" hasBorder><EuiTitle size="xs"><h3>Working hypothesis</h3></EuiTitle><EuiText><p>Credential misuse followed by privileged access from a newly observed host. Confidence is high, but network corroboration remains incomplete.</p></EuiText><EuiBadge color="warning">Confidence 78%</EuiBadge><EuiBadge color="hollow">2 alternatives</EuiBadge></EuiPanel></EuiFlexItem><EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder><EuiTitle size="xs"><h3>Closure blockers</h3></EuiTitle><ul><li>Endpoint capture pending</li><li>Identity conflict unresolved</li><li>Response approval required</li></ul></EuiPanel></EuiFlexItem></EuiFlexGroup>}
            {activeTab === 'Timeline' && <div>{fixture.timeline.slice(0, 7).map((event) => <EuiPanel key={`${event.time}-${event.title}`} paddingSize="s" hasBorder style={{ marginBottom: 8 }}><EuiFlexGroup gutterSize="m" responsive={false}><EuiFlexItem grow={false}><time>{event.time}</time></EuiFlexItem><EuiFlexItem><strong>{event.title}</strong><EuiText size="xs" color="subdued"><p>{event.detail}</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{event.status}</EuiBadge></EuiFlexItem></EuiFlexGroup></EuiPanel>)}</div>}
            {activeTab === 'Evidence' && <><EuiFlexGroup gutterSize="m" wrap>{['Alert cluster', 'Identity audit', 'Endpoint triage', 'Network session', 'Cloud event', 'Analyst note'].map((item, index) => <EuiFlexItem key={item} grow={1} style={{ minWidth: 220 }}><EuiPanel paddingSize="m" hasBorder><EuiHealth color={index === 3 ? 'warning' : 'success'}>{index === 3 ? 'Gap' : 'Available'}</EuiHealth><EuiTitle size="xs"><h3>{item}</h3></EuiTitle><EuiText size="xs" color="subdued"><p>Revision r{8 - index} · source confidence {92 - index * 4}%</p></EuiText></EuiPanel></EuiFlexItem>)}</EuiFlexGroup><EuiSpacer size="m" /><EuiTitle size="xs"><h3>Evidence readiness</h3></EuiTitle><EuiSpacer size="s" />{['Identity', 'Endpoint', 'Network', 'Cloud'].map((source, index) => <div key={source} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 48px', gap: 10, alignItems: 'center', marginBottom: 10 }}><span>{source}</span><EuiProgress value={94 - index * 13} max={100} size="s" color={index === 2 ? 'warning' : 'primary'} /><small>{94 - index * 13}%</small></div>)}</>}
            {!['Overview', 'Timeline', 'Evidence'].includes(activeTab) && <EuiCallOut title={`${activeTab} workspace`} color="primary">The {activeTab.toLowerCase()} tab preserves the selected case, normalized scope and prototype-only action boundary.</EuiCallOut>}
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={2} style={{ minWidth: 260 }}><EuiPanel paddingSize="m" hasBorder data-visual-region="case-next-decision"><EuiTitle size="s"><h2>Next decision</h2></EuiTitle><EuiSpacer size="s" />{[['Validate identity pivot', '2 conflicting values', 'warning'], ['Request endpoint capture', 'Eligible now', 'success'], ['Prepare containment', 'Approval required', 'warning']].map(([title, detail, color], index) => <EuiPanel key={title} paddingSize="s" hasBorder style={{ marginBottom: 10 }}><EuiFlexGroup gutterSize="s" responsive={false}><EuiFlexItem grow={false}><strong>{index + 1}</strong></EuiFlexItem><EuiFlexItem><strong>{title}</strong><EuiText size="xs" color="subdued"><p>{detail}</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><EuiHealth color={color}>{index === 1 ? 'Ready' : 'Review'}</EuiHealth></EuiFlexItem></EuiFlexGroup></EuiPanel>)}<EuiSpacer size="m" /><EuiCallOut title="Response boundary" color="warning">Requesting response or linking an ITSM incident creates a prototype receipt only. Queued or accepted is not completed.</EuiCallOut></EuiPanel></EuiFlexItem>
      </EuiFlexGroup>
      {previewOpen && <EuiFlyout ownFocus size="m" onClose={closePreview} aria-labelledby="p04-case-preview-title"><EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p04-case-preview-title">{selectedCase.title}</h2></EuiTitle><EuiText size="s" color="subdued"><p>{selectedCase.id} · {selectedCase.classification}</p></EuiText></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Case preview" color="primary">Preview supports triage without changing case state. Full investigation remains in the selected case workspace.</EuiCallOut><EuiSpacer size="m" /><EuiFlexGroup gutterSize="m" wrap><EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Key entities</p></EuiText><strong>{selectedCase.entities}</strong></EuiPanel></EuiFlexItem><EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>MITRE</p></EuiText><strong>{selectedCase.mitre}</strong></EuiPanel></EuiFlexItem><EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Response</p></EuiText><strong>{selectedCase.response}</strong></EuiPanel></EuiFlexItem></EuiFlexGroup><EuiSpacer size="m" /><EuiTitle size="xs"><h3>Latest activity</h3></EuiTitle><p>{selectedCase.activity}</p></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={closePreview}>Close preview</EuiButtonEmpty><EuiButton fill onClick={closePreview}>Continue investigation</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    </div>
  );
}