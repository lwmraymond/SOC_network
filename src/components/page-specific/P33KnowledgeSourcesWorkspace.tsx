import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem,
  EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiModal, EuiModalBody,
  EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel, EuiProgress, EuiSelect,
  EuiSpacer, EuiStat, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P33KnowledgeSourcesWorkspace.css';

type Source = { key: string; id: string; name: string; type: string; location: string; owner: string; classification: string; state: string; freshness: string; documents: number; failures: number; acl: string; citation: number; quality: string; lastSync: string };
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const num = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildSources = (rows: PrototypeRow[]): Source[] => rows.slice(0, 14).map((row, index) => ({
  key: `${row.id}:${index}`,
  id: text(row.knowledge_source_id, `KN-${String(index + 1).padStart(3, '0')}`),
  name: text(row.name, ['Detection engineering handbook','Incident response wiki','Cloud security runbooks','Vendor advisory feed'][index % 4]),
  type: text(row.source_type, ['Confluence','Git repository','Object storage','External feed'][index % 4]),
  location: text(row.location, ['secops/handbook','github://knowledge/runbooks','s3://knowledge-secure','https://vendor.example/feed'][index % 4]),
  owner: text(row.owner, ['SOC enablement','Incident response','Cloud security','Threat research'][index % 4]),
  classification: text(row.classification, index % 4 === 2 ? 'Restricted' : 'Internal'),
  state: text(row.sync_state, index % 5 === 0 ? 'Failed' : index % 6 === 0 ? 'Paused' : 'Active'),
  freshness: text(row.freshness, index % 5 === 0 ? 'Stale 4d' : `${2 + index}h`),
  documents: num(row.document_count, 120 + index * 43),
  failures: num(row.index_failures, index % 5 === 0 ? 18 : index % 3),
  acl: text(row.acl_state, index % 6 === 0 ? 'Conflict' : 'Synchronized'),
  citation: num(row.citation_coverage, Math.max(38, 94 - index * 4)),
  quality: text(row.quality, index % 5 === 0 ? 'Review' : 'Good'),
  lastSync: text(row.last_sync_at, `${1 + index}h ago`),
}));

export function P33KnowledgeSourcesWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('Attention first');
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const sources = useMemo(() => buildSources(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => sources.filter((item) => (!query.trim() || `${item.id} ${item.name} ${item.type} ${item.location} ${item.owner}`.toLowerCase().includes(query.trim().toLowerCase())) && (state === 'All states' || (state === 'Attention first' ? item.state !== 'Active' || item.acl !== 'Synchronized' || item.freshness.startsWith('Stale') : item.state === state))), [query, sources, state]);
  const selected = visible.find((item) => item.key === selectedKey) ?? visible[0] ?? sources[0];
  if (!selected) return null;
  const metrics = { active: sources.filter((item) => item.state === 'Active').length, stale: sources.filter((item) => item.freshness.startsWith('Stale')).length, failures: sources.filter((item) => item.failures > 0).length, acl: sources.filter((item) => item.acl !== 'Synchronized').length, low: sources.filter((item) => item.citation < 60).length };
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; sync, indexing, ACL and retrieval state remain authoritative.`);

  return <div className="pageComposition page-p33 differentiatedPage p33Knowledge" data-page-specific-composition="P33-source-sync-acl-citation">
    <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Source ID, name, document path, owner, language, index error or citation" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={state} onChange={(event: ChangeEvent) => setState(event.target.value)} options={['Attention first','All states','Active','Paused','Failed'].map((value) => ({ value, text: value }))} /></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt('Add knowledge source wizard opened in prototype mode; no connector was created.')}>Add source</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />{receipt && <><EuiCallOut title="Prototype knowledge receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="s" wrap>{[['Active sources', metrics.active],['Stale sources', metrics.stale],['Sync/index failures', metrics.failures],['ACL conflicts', metrics.acl],['Low citation coverage', metrics.low]].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>
    <EuiSpacer size="m" /><div className="p33Workspace">
      <EuiPanel paddingSize="m" hasBorder className="p33Grid"><EuiTitle size="s"><h2>Knowledge source library</h2></EuiTitle><table><thead><tr><th>Source</th><th>Type</th><th>Sync</th><th>Freshness</th><th>Documents</th><th>ACL</th><th>Citation</th></tr></thead><tbody>{visible.map((item) => <tr key={item.key}><td><EuiButtonEmpty size="xs" onClick={() => setSelectedKey(item.key)}>{item.id}</EuiButtonEmpty><small>{item.name}</small></td><td>{item.type}</td><td><EuiBadge color={item.state === 'Active' ? 'success' : item.state === 'Failed' ? 'danger' : 'warning'}>{item.state}</EuiBadge></td><td>{item.freshness}</td><td>{item.documents}</td><td>{item.acl}</td><td>{item.citation}%</td></tr>)}</tbody></table></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p33Detail"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · {selected.location}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.classification === 'Restricted' ? 'warning' : 'hollow'}>{selected.classification}</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer /><dl><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Last sync</dt><dd>{selected.lastSync}</dd></div><div><dt>Index failures</dt><dd>{selected.failures}</dd></div><div><dt>ACL</dt><dd>{selected.acl}</dd></div></dl><EuiTitle size="xs"><h3>Retrieval trust</h3></EuiTitle>{[['Freshness', selected.freshness.startsWith('Stale') ? 44 : 92],['Citation coverage', selected.citation],['Document quality', selected.quality === 'Good' ? 88 : 51],['ACL alignment', selected.acl === 'Synchronized' ? 96 : 36]].map(([label, value]) => <div key={String(label)}><strong>{label}</strong><EuiProgress value={Number(value)} max={100} size="s" color={Number(value) < 60 ? 'warning' : 'primary'} /><span>{value}</span></div>)}<EuiSpacer /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton onClick={() => queue('Sync now')}>Sync now</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => queue('Reindex')}>Reindex</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setAccessOpen(true)}>Manage access</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setDetailOpen(true)}>Documents</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p33Coverage"><EuiTitle size="xs"><h2>Knowledge coverage</h2></EuiTitle>{['Identity','Endpoint','Cloud','Network','ITSM'].map((item, index) => <div key={item}><strong>{item}</strong><EuiProgress value={[91,83,72,64,47][index]} max={100} size="s" color={index > 3 ? 'warning' : 'primary'} /><span>{[128,96,84,61,39][index]} docs</span></div>)}<EuiSpacer /><EuiCallOut title="ACL-first retrieval" size="s">Document content and citations remain permission-trimmed by source ACL, classification and tenant scope.</EuiCallOut></EuiPanel>
    </div>
    {detailOpen && <EuiFlyout onClose={() => setDetailOpen(false)} ownFocus size="m" aria-labelledby="p33-doc-title"><EuiFlyoutHeader><EuiTitle><h2 id="p33-doc-title">Documents and citations</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody>{fixture.timeline.slice(0, 7).map((item, index) => <div key={`${item.time}-${index}`} className="p33Doc"><strong>{item.title}</strong><span>{selected.location}/doc-{index + 1}.md</span><small>citation usage {3 + index} · indexed {item.time}</small></div>)}</EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={() => setDetailOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {accessOpen && <EuiModal onClose={() => setAccessOpen(false)} aria-labelledby="p33-access-title"><EuiModalHeader><EuiModalHeaderTitle id="p33-access-title">Source access impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="ACL governance" color="warning">Access changes require source-side authorization and reindex validation; a queued request does not expand retrieval scope.</EuiCallOut><ul><li>Source: {selected.id}</li><li>Classification: {selected.classification}</li><li>Current ACL: {selected.acl}</li><li>Documents: {selected.documents}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setAccessOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue('Access change'); setAccessOpen(false); }}>Queue review</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}