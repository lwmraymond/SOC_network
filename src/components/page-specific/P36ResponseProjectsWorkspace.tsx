import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
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
  EuiStat,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P36ResponseProjectsWorkspace.css';

type PortfolioView = 'Portfolio' | 'Milestones' | 'Outcomes';
type ChangeEvent = { target: { value: string } };
type Project = {
  id: string;
  name: string;
  objective: string;
  status: string;
  health: string;
  owner: string;
  service: string;
  due: string;
  progress: number;
  expectedRiskReduction: number;
  milestones: number;
  overdueMilestones: number;
  blockedWorkstreams: number;
  outcomeState: string;
  risk: string;
  criticalPath: string;
  linkedObjects: string[];
  updated: string;
};
type Milestone = {
  id: string;
  name: string;
  owner: string;
  due: string;
  status: string;
  dependency: string;
  evidence: string;
  position: number;
  span: number;
};

const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const number = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const projectNames = ['Identity resilience programme', 'Endpoint containment uplift', 'Cloud credential remediation', 'Major incident recovery assurance'];
const services = ['Identity', 'Endpoint', 'Cloud foundation', 'Customer API'];

const buildProjects = (rows: PrototypeRow[]): Project[] => rows.slice(0, 12).map((row, index) => ({
  id: text(row.project_id, `PRJ-${String(index + 1).padStart(4, '0')}`),
  name: text(row.name, `${projectNames[index % projectNames.length]} ${index > 3 ? index + 1 : ''}`.trim()),
  objective: text(row.objective_scope, ['Reduce identity failover risk and prove recovery outcomes.', 'Standardize endpoint containment with governed evidence.', 'Remove exposed cloud credentials and validate rotation.', 'Close recovery gaps identified during major incidents.'][index % 4]),
  status: text(row.status, index % 6 === 0 ? 'At risk' : index % 5 === 0 ? 'Planning' : 'Active'),
  health: text(row.health, index % 6 === 0 ? 'Red' : index % 4 === 0 ? 'Amber' : 'Green'),
  owner: text(row.owner_team ?? row.owner, ['Response programme', 'Endpoint response', 'Cloud security', 'Service resilience'][index % 4]),
  service: text(row.service, services[index % services.length]),
  due: text(row.due_at, `2026-0${8 + (index % 2)}-${String(12 + index).padStart(2, '0')}`),
  progress: Math.min(96, number(row.progress, 22 + index * 6)),
  expectedRiskReduction: Math.min(95, number(row.expected_risk_reduction, 72 + (index % 4) * 6)),
  milestones: number(row.milestone_count, 5 + (index % 5)),
  overdueMilestones: number(row.overdue_milestones, index % 4 === 0 ? 2 : index % 3 === 0 ? 1 : 0),
  blockedWorkstreams: number(row.blocked_workstreams, index % 5 === 0 ? 2 : index % 4 === 0 ? 1 : 0),
  outcomeState: text(row.outcome_state, index % 5 === 0 ? 'Evidence incomplete' : index % 4 === 0 ? 'Verification pending' : 'On track'),
  risk: text(row.risk, index % 6 === 0 ? 'High' : index % 3 === 0 ? 'Medium' : 'Low'),
  criticalPath: text(row.critical_path, index % 4 === 0 ? 'Change approval → recovery test' : 'Milestone sequence healthy'),
  linkedObjects: [`CASE-${810 + index}`, `CHG-${850 + index}`, index % 2 ? `PRB-${3300 + index}` : `INC-${7000 + index}`],
  updated: text(row.updated_at, `${3 + index * 2}h ago`),
}));

const buildMilestones = (project: Project): Milestone[] => [
  { id: `${project.id}-M1`, name: 'Scope and success criteria', owner: project.owner, due: 'Aug 05', status: 'Complete', dependency: 'None', evidence: 'Approved objective revision', position: 1, span: 1 },
  { id: `${project.id}-M2`, name: 'Change and task execution', owner: 'Delivery workstream', due: 'Aug 19', status: project.blockedWorkstreams ? 'Blocked' : 'In progress', dependency: 'M1 + CHG approval', evidence: project.blockedWorkstreams ? 'Dependency unresolved' : 'Execution receipts arriving', position: 2, span: 2 },
  { id: `${project.id}-M3`, name: 'Recovery validation', owner: 'Service assurance', due: 'Sep 02', status: project.outcomeState === 'On track' ? 'Planned' : 'At risk', dependency: 'M2 authoritative completion', evidence: 'Telemetry window required', position: 4, span: 1 },
  { id: `${project.id}-M4`, name: 'Outcome verification', owner: 'Executive sponsor', due: 'Sep 16', status: project.outcomeState, dependency: 'M3 evidence gate', evidence: 'Independent success criteria', position: 5, span: 2 },
];

export function P36ResponseProjectsWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [view, setView] = useState<PortfolioView>('Portfolio');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Active portfolio');
  const [risk, setRisk] = useState('All risk');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const projects = useMemo(() => buildProjects(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => projects.filter((item) => {
    const haystack = `${item.id} ${item.name} ${item.objective} ${item.owner} ${item.service} ${item.linkedObjects.join(' ')}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (status === 'All status' || (status === 'Active portfolio' ? item.status !== 'Complete' : item.status === status))
      && (risk === 'All risk' || item.risk === risk);
  }), [projects, query, risk, status]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? projects[0];
  if (!selected) return null;
  const milestones = buildMilestones(selected);
  const metrics = {
    active: projects.filter((item) => item.status !== 'Complete').length,
    overdue: projects.reduce((sum, item) => sum + item.overdueMilestones, 0),
    blocked: projects.reduce((sum, item) => sum + item.blockedWorkstreams, 0),
    unverified: projects.filter((item) => item.outcomeState !== 'On track').length,
    reduction: Math.round(projects.reduce((sum, item) => sum + item.expectedRiskReduction, 0) / Math.max(1, projects.length)),
  };
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}. Linked ITSM objects and project outcome evidence remain independently authoritative.`);

  return <div className="pageComposition page-p36 differentiatedPage p36Projects" data-page-specific-composition="P36-portfolio-milestone-outcome-workbench">
    <EuiPanel paddingSize="m" hasBorder className="p36ScopePanel">
      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem grow={false}><div className="p36ViewTabs" role="tablist">{(['Portfolio', 'Milestones', 'Outcomes'] as PortfolioView[]).map((item) => <button type="button" role="tab" aria-selected={view === item} key={item} onClick={() => setView(item)}>{item}</button>)}</div></EuiFlexItem>
        <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Project, objective, owner, milestone, blocker, Case, Problem, Change or outcome" /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed value={status} onChange={(event: ChangeEvent) => setStatus(event.target.value)} options={['Active portfolio', 'All status', 'Active', 'At risk', 'Planning', 'Complete'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed value={risk} onChange={(event: ChangeEvent) => setRisk(event.target.value)} options={['All risk', 'High', 'Medium', 'Low'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt('Create project workbench opened in prototype mode; no production project was created.')}>Create project</EuiButton></EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>

    {receipt && <EuiCallOut title="Prototype project receipt" color="warning">{receipt}</EuiCallOut>}

    <EuiFlexGroup gutterSize="m" wrap className="p36Metrics">
      {[
        ['Active projects', metrics.active, 'Portfolio in delivery'],
        ['Overdue milestones', metrics.overdue, 'Requires owner action'],
        ['Blocked workstreams', metrics.blocked, 'Dependency or approval'],
        ['Unverified outcomes', metrics.unverified, 'Evidence gate incomplete'],
        ['Expected risk reduction', `${metrics.reduction}%`, 'Weighted project target'],
      ].map(([label, value, note]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /><small>{note}</small></EuiPanel></EuiFlexItem>)}
    </EuiFlexGroup>

    <div className="p36PortfolioLayout">
      <EuiPanel paddingSize="m" hasBorder className="p36PortfolioRail">
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Response portfolio</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <EuiSpacer size="s" />
        <div className="p36ProjectList">{visible.map((item) => <button type="button" key={item.id} className={item.id === selected.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span><EuiBadge color={item.health === 'Green' ? 'success' : item.health === 'Amber' ? 'warning' : 'danger'}>{item.health}</EuiBadge><small>{item.updated}</small></span><strong>{item.name}</strong><p>{item.objective}</p><div><small>{item.id} · {item.owner}</small><b>{item.progress}%</b></div><EuiProgress value={item.progress} max={100} size="s" color={item.health === 'Red' ? 'danger' : item.health === 'Amber' ? 'warning' : 'primary'} /></button>)}</div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder className="p36ProjectWorkspace">
        <EuiFlexGroup alignItems="center" gutterSize="m" wrap>
          <EuiFlexItem><EuiTitle size="m"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · {selected.service} · owner {selected.owner}</p></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color={selected.status === 'At risk' ? 'danger' : 'primary'}>{selected.status}</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiCallOut title="Objective and independent success criteria">{selected.objective} Project completion requires outcome evidence; linked Change or Task closure is supporting evidence only.</EuiCallOut>
        <EuiSpacer size="l" />

        {view === 'Portfolio' && <>
          <EuiTitle size="s"><h3>Milestone and dependency timeline</h3></EuiTitle>
          <div className="p36TimelineScroller"><div className="p36Timeline"><header><span>Milestone</span>{['Aug 01', 'Aug 15', 'Sep 01', 'Sep 15', 'Oct 01', 'Oct 15'].map((label) => <b key={label}>{label}</b>)}</header>{milestones.map((item) => <div className="p36TimelineRow" key={item.id}><div><strong>{item.name}</strong><small>{item.owner} · due {item.due}</small></div><button type="button" className={item.status.toLowerCase().replaceAll(' ', '-')} style={{ gridColumn: `${item.position + 1} / span ${item.span}` }} onClick={() => setDetailOpen(true)}><span>{item.status}</span><small>{item.dependency}</small></button></div>)}</div></div>
          <EuiSpacer size="l" />
          <EuiTitle size="s"><h3>Milestone evidence</h3></EuiTitle>
          <div className="p36TableWrap"><table><thead><tr><th>Milestone</th><th>Owner</th><th>Due</th><th>Status</th><th>Dependency</th><th>Evidence</th></tr></thead><tbody>{milestones.map((item) => <tr key={item.id}><td><EuiButtonEmpty size="xs" onClick={() => setDetailOpen(true)}>{item.id}</EuiButtonEmpty><small>{item.name}</small></td><td>{item.owner}</td><td>{item.due}</td><td><EuiBadge color={item.status === 'Blocked' || item.status === 'At risk' ? 'danger' : item.status === 'Complete' ? 'success' : 'warning'}>{item.status}</EuiBadge></td><td>{item.dependency}</td><td>{item.evidence}</td></tr>)}</tbody></table></div>
        </>}

        {view === 'Milestones' && <div className="p36MilestoneBoard">{milestones.map((item, index) => <article key={item.id}><header><span>{index + 1}</span><div><strong>{item.name}</strong><small>{item.id} · {item.owner}</small></div><EuiBadge color={item.status === 'Blocked' ? 'danger' : item.status === 'Complete' ? 'success' : 'warning'}>{item.status}</EuiBadge></header><dl><div><dt>Dependency</dt><dd>{item.dependency}</dd></div><div><dt>Completion evidence</dt><dd>{item.evidence}</dd></div><div><dt>Due</dt><dd>{item.due}</dd></div></dl><EuiButtonEmpty size="xs" onClick={() => setDetailOpen(true)}>Review milestone</EuiButtonEmpty></article>)}</div>}

        {view === 'Outcomes' && <div className="p36OutcomeCanvas"><EuiTitle size="s"><h3>Risk and outcome burn-down</h3></EuiTitle>{[['Initial residual risk', 92], ['Current residual risk', 54], ['Expected at completion', 21], ['Evidence confidence', selected.outcomeState === 'On track' ? 84 : 48]].map(([label, value]) => <div key={String(label)}><strong>{label}</strong><EuiProgress value={Number(value)} max={100} size="m" color={Number(value) > 75 ? 'danger' : Number(value) > 45 ? 'warning' : 'success'} /><span>{value}</span></div>)}<EuiSpacer size="l" /><div className="p36OutcomeCriteria">{['Recovery telemetry meets target for 14 days', 'No unresolved high-risk dependency', 'Linked Change and Tasks have authoritative receipts', 'Sponsor accepts independent outcome evidence'].map((item, index) => <article key={item}><EuiBadge color={index < 2 ? 'success' : 'warning'}>{index < 2 ? 'Verified' : 'Pending'}</EuiBadge><span>{item}</span></article>)}</div></div>}
      </EuiPanel>

      <div className="p36SideColumn">
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="s"><h2>Risk and outcome</h2></EuiTitle>
          <EuiSpacer size="m" />
          <dl className="p36DefinitionList"><div><dt>Critical path</dt><dd>{selected.criticalPath}</dd></div><div><dt>Project risk</dt><dd>{selected.risk}</dd></div><div><dt>Outcome state</dt><dd>{selected.outcomeState}</dd></div><div><dt>Expected reduction</dt><dd>{selected.expectedRiskReduction}%</dd></div><div><dt>Target date</dt><dd>{selected.due}</dd></div></dl>
          <EuiSpacer size="m" />
          <EuiTitle size="xs"><h3>Active blockers</h3></EuiTitle>
          <div className="p36Blockers"><article><EuiBadge color={selected.blockedWorkstreams ? 'danger' : 'success'}>{selected.blockedWorkstreams || 0}</EuiBadge><span>Workstream dependencies</span></article><article><EuiBadge color={selected.overdueMilestones ? 'warning' : 'success'}>{selected.overdueMilestones || 0}</EuiBadge><span>Overdue milestones</span></article></div>
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="s"><h2>Linked evidence</h2></EuiTitle>
          <EuiSpacer size="s" />
          <div className="p36LinkedObjects">{selected.linkedObjects.map((item) => <button type="button" key={item} onClick={() => setDetailOpen(true)}><strong>{item}</strong><span>{item.startsWith('CHG') ? 'Change evidence' : item.startsWith('PRB') ? 'Problem record' : item.startsWith('INC') ? 'Incident context' : 'Security Case'}</span></button>)}</div>
          <EuiSpacer size="m" />
          <EuiButton fullWidth onClick={() => queue('Record blocker or decision')}>Record decision</EuiButton>
          <EuiSpacer size="s" />
          <EuiButton fill fullWidth onClick={() => setDecisionOpen(true)}>Review outcome gate</EuiButton>
        </EuiPanel>
      </div>
    </div>

    {detailOpen && <EuiFlyout onClose={() => setDetailOpen(false)} ownFocus size="m" aria-labelledby="p36-detail-title"><EuiFlyoutHeader><EuiTitle><h2 id="p36-detail-title">Project and milestone evidence</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Context preserved">The portfolio, filters and selected project remain visible after this Flyout closes.</EuiCallOut><EuiSpacer />{milestones.map((item) => <article className="p36EvidenceCard" key={item.id}><header><strong>{item.name}</strong><EuiBadge color={item.status === 'Blocked' ? 'danger' : 'hollow'}>{item.status}</EuiBadge></header><p>{item.evidence}</p><small>{item.dependency} · {item.owner} · due {item.due}</small></article>)}</EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={() => setDetailOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}

    {decisionOpen && <EuiModal onClose={() => setDecisionOpen(false)} aria-labelledby="p36-outcome-title"><EuiModalHeader><EuiModalHeaderTitle id="p36-outcome-title">Outcome verification gate</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Project completion is independent" color="warning">Closing a Change, Task, Problem or Incident does not complete this project. All success criteria and evidence freshness must pass.</EuiCallOut><ul><li>Project: {selected.id}</li><li>Outcome state: {selected.outcomeState}</li><li>Unresolved blockers: {selected.blockedWorkstreams}</li><li>Overdue milestones: {selected.overdueMilestones}</li><li>Rollback/reopen path: retained</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setDecisionOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue('Outcome verification'); setDecisionOpen(false); }}>Queue verification</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
