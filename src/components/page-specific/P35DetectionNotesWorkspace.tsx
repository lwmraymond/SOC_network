import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem,
  EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiFormRow, EuiModal,
  EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel, EuiProgress,
  EuiSelect, EuiSpacer, EuiStat, EuiTextArea, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P35DetectionNotesWorkspace.css';

type Note = { id: string; title: string; summary: string; status: string; technique: string; rule: string; dataset: string; author: string; reviewer: string; review: string; classification: string; usage: number; revision: string; assumption: string };
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const num = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildNotes = (rows: PrototypeRow[]): Note[] => rows.slice(0, 14).map((row, index) => ({
  id: text(row.note_id, `NOTE-${String(index + 1).padStart(4, '0')}`),
  title: text(row.title, ['Identity provider failover detection','Rare privileged shell activity','Cloud credential exposure','Endpoint defense bypass'][index % 4]),
  summary: text(row.summary, 'Detection intent, assumptions, evidence links, known limits and analyst guidance.'),
  status: text(row.status, index % 5 === 0 ? 'Review overdue' : index % 6 === 0 ? 'Draft' : 'Published'),
  technique: text(row.mitre_technique, ['T1078','T1059','T1552','T1562'][index % 4]),
  rule: text(row.rule_id, `RULE-${String(index + 1).padStart(4, '0')}`),
  dataset: text(row.dataset, ['logs-identity-*','logs-endpoint-*','logs-cloud-*','alerts-security-*'][index % 4]),
  author: text(row.author, ['A. Chen','M. Patel','S. Kim','J. Lin'][index % 4]),
  reviewer: text(row.reviewer, ['Detection review','Identity SME','Cloud SME','Endpoint SME'][index % 4]),
  review: text(row.review_due, index % 5 === 0 ? 'Overdue 12d' : `Due in ${7 + index}d`),
  classification: text(row.classification, index % 4 === 2 ? 'Restricted' : 'Internal'),
  usage: num(row.usage_count, 8 + index * 6),
  revision: text(row.revision, `r${10 - index % 4}`),
  assumption: text(row.assumptions, index % 5 === 0 ? 'Provider topology changed; assumption stale' : 'User and source fields remain normalized'),
}));

export function P35DetectionNotesWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Published and review');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [body, setBody] = useState('## Detection intent\nIdentify suspicious authentication failover behavior while preserving known provider and normalization limits.\n\n## Analyst guidance\nValidate source freshness, linked rule revision and evidence citations before escalation.');
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const notes = useMemo(() => buildNotes(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => notes.filter((item) => (!query.trim() || `${item.id} ${item.title} ${item.summary} ${item.rule} ${item.technique} ${item.dataset} ${item.author}`.toLowerCase().includes(query.trim().toLowerCase())) && (status === 'All status' || (status === 'Published and review' ? item.status !== 'Draft' : item.status === status))), [notes, query, status]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? notes[0];
  if (!selected) return null;
  const metrics = { published: notes.filter((item) => item.status === 'Published').length, overdue: notes.filter((item) => item.status === 'Review overdue').length, withoutNotes: 7, stale: notes.filter((item) => item.assumption.includes('stale')).length };
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; knowledge revision, review and linked rule state remain independently authoritative.`);

  return <div className="pageComposition page-p35 differentiatedPage p35Notes" data-page-specific-composition="P35-note-search-editor-evidence">
    <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="KQL-like note search: title, body, rule.id, technique, dataset, field, author or Case" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={status} onChange={(event: ChangeEvent) => setStatus(event.target.value)} options={['Published and review','All status','Published','Review overdue','Draft'].map((value) => ({ value, text: value }))} /></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt('Create note editor opened in prototype mode; no knowledge revision was created.')}>Create note</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />{receipt && <><EuiCallOut title="Prototype note receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="s" wrap>{[['Published notes', metrics.published],['Review overdue', metrics.overdue],['Rules without notes', metrics.withoutNotes],['Stale assumptions', metrics.stale]].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>
    <EuiSpacer size="m" /><div className="p35Workspace">
      <EuiPanel paddingSize="m" hasBorder className="p35Taxonomy"><EuiTitle size="s"><h2>Detection taxonomy</h2></EuiTitle>{['Credential access','Execution','Defense evasion','Cloud','Endpoint','Identity'].map((item, index) => <button type="button" key={item} onClick={() => setQuery(item)}><strong>{item}</strong><span>{4 + index * 2}</span></button>)}<EuiSpacer /><EuiTitle size="xs"><h3>Coverage by technique</h3></EuiTitle>{['T1078','T1059','T1552','T1562'].map((item, index) => <div key={item}><strong>{item}</strong><EuiProgress value={[84,72,61,44][index]} max={100} size="s" color={index === 3 ? 'warning' : 'primary'} /></div>)}</EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p35Results"><EuiTitle size="s"><h2>Detection note research</h2></EuiTitle>{visible.map((item) => <button type="button" key={item.id} className={item.id === selected.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span><EuiBadge color={item.status === 'Published' ? 'success' : item.status === 'Review overdue' ? 'danger' : 'warning'}>{item.status}</EuiBadge><small>{item.id} · {item.revision}</small></span><strong>{item.title}</strong><p>{item.summary}</p><mark>{item.rule} · {item.technique} · {item.dataset}</mark><small>author {item.author} · used {item.usage} times</small></button>)}</EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p35Editor"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.title}</h2></EuiTitle><p>{selected.id} · {selected.revision} · {selected.classification}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.review.startsWith('Overdue') ? 'danger' : 'warning'}>{selected.review}</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiFormRow label="Detection knowledge body" helpText="Assumptions, limitations, validation evidence and audience classification must remain explicit."><EuiTextArea value={body} onChange={(event: ChangeEvent) => setBody(event.target.value)} rows={16} /></EuiFormRow><div className="p35Links"><article><strong>Linked rule</strong><span>{selected.rule}</span><small>{selected.technique}</small></article><article><strong>Dataset</strong><span>{selected.dataset}</span><small>stable contract ref</small></article><article><strong>Assumption</strong><span>{selected.assumption}</span><small>review evidence required</small></article></div><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton onClick={() => queue('Save draft')}>Save draft</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setEvidenceOpen(true)}>Evidence & links</EuiButtonEmpty></EuiFlexItem><EuiFlexItem /><EuiFlexItem grow={false}><EuiButton fill onClick={() => setReviewOpen(true)}>Submit review</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    </div>
    {evidenceOpen && <EuiFlyout onClose={() => setEvidenceOpen(false)} ownFocus size="m" aria-labelledby="p35-evidence-title"><EuiFlyoutHeader><EuiTitle><h2 id="p35-evidence-title">Evidence and stable links</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Cross-domain references">Rule, schema, Case, Problem and Change links retain stable IDs and revisions; they do not copy the other domain’s document source.</EuiCallOut><EuiSpacer />{fixture.timeline.slice(0, 7).map((item, index) => <div className="p35Evidence" key={`${item.time}-${index}`}><strong>{item.title}</strong><span>{index % 2 ? selected.rule : `CASE-${820 + index}`}@r{7 + index}</span><small>{item.detail}</small></div>)}</EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={() => setEvidenceOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {reviewOpen && <EuiModal onClose={() => setReviewOpen(false)} aria-labelledby="p35-review-title"><EuiModalHeader><EuiModalHeaderTitle id="p35-review-title">Review and publish note</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Knowledge review" color="warning">Published/expired knowledge status is independent of linked Rule or ITSM work-item status.</EuiCallOut><ul><li>Reviewer: {selected.reviewer}</li><li>Rule: {selected.rule}</li><li>Assumption: {selected.assumption}</li><li>Classification: {selected.classification}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setReviewOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue('Submit review'); setReviewOpen(false); }}>Queue review</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
