import { useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  EuiAccordion,
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
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P36ResponseProjectsWorkspace.css';

type PortfolioView = 'Portfolio' | 'Milestones' | 'Outcomes';
type ChangeEvent = { target: { value: string } };
type Project = {
  key: string;
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
  key: `${row.id}:${index}`,
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

const statusColor = (status: string): 'danger' | 'warning' | 'success' | 'hollow' => {
  if (/blocked|risk|incomplete/i.test(status)) return 'danger';
  if (/complete|track/i.test(status)) return 'success';
  if (/progress|planned|pending/i.test(status)) return 'warning';
  return 'hollow';
};

export function P36ResponseProjectsWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [view, setView] = useState<PortfolioView>('Portfolio');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Active portfolio');
  const [risk, setRisk] = useState('All risk');
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(undefined);
  const [linkedObject, setLinkedObject] = useState<string | undefined>(undefined);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const detailOpener = useRef<HTMLButtonElement | null>(null);
  const projects = useMemo(() => buildProjects(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => projects.filter((item) => {
    const haystack = `${item.id} ${item.name} ${item.objective} ${item.owner} ${item.service} ${item.linkedObjects.join(' ')}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (status === 'All status' || (status === 'Active portfolio' ? item.status !== 'Complete' : item.status === status))
      && (risk === 'All risk' || item.risk === risk);
  }), [projects, query, risk, status]);
  const selected = visible.find((item) => item.key === selectedKey) ?? visible[0] ?? projects[0];
  if (!selected) return null;
  const milestones = buildMilestones(selected);
  const selectedMilestone = milestones.find((item) => item.id === selectedMilestoneId);
  const activeProjects = projects.filter((item) => item.status !== 'Complete').length;
  const attentionProjects = projects.filter((item) => item.health !== 'Green' || item.blockedWorkstreams || item.overdueMilestones).length;
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}. Linked ITSM objects and project outcome evidence remain independently authoritative.`);

  const openMilestone = (milestone: Milestone, trigger: HTMLButtonElement) => {
    detailOpener.current = trigger;
    setLinkedObject(undefined);
    setSelectedMilestoneId(milestone.id);
  };
  const openLinkedObject = (objectId: string, trigger: HTMLButtonElement) => {
    detailOpener.current = trigger;
    setSelectedMilestoneId(undefined);
    setLinkedObject(objectId);
  };
  const closeEvidence = () => {
    setSelectedMilestoneId(undefined);
    setLinkedObject(undefined);
    requestAnimationFrame(() => detailOpener.current?.focus());
  };

  return <div className="pageComposition page-p36 differentiatedPage p36Projects" data-page-specific-composition="P36-state-driven-portfolio-milestone-outcome">
    <EuiPanel paddingSize="m" hasBorder className="p36ScopePanel" data-visual-region="project-command-and-mode">
      <div className="p36ModeTabs" role="tablist" aria-label="Response project work mode">
        {(['Portfolio', 'Milestones', 'Outcomes'] as PortfolioView[]).map((item) => <button type="button" role="tab" aria-selected={view === item} key={item} onClick={() => setView(item)}>{item}</button>)}
      </div>
      <div className="p36Filters">
        <EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Project, objective, owner, Case, Change or outcome" aria-label="Search response projects" />
        <EuiSelect compressed value={status} onChange={(event: ChangeEvent) => setStatus(event.target.value)} options={['Active portfolio', 'All status', 'Active', 'At risk', 'Planning', 'Complete'].map((value) => ({ value, text: value }))} aria-label="Project status" />
        <EuiSelect compressed value={risk} onChange={(event: ChangeEvent) => setRisk(event.target.value)} options={['All risk', 'High', 'Medium', 'Low'].map((value) => ({ value, text: value }))} aria-label="Project risk" />
        <EuiButton fill onClick={() => setReceipt('Create project workbench opened in prototype mode; no production project was created.')}>Create project</EuiButton>
      </div>
      <div className="p36StatusStrip" aria-label="Portfolio status">
        <span><strong>{activeProjects}</strong> active</span>
        <span><strong>{attentionProjects}</strong> need attention</span>
        <span><strong>{selected.blockedWorkstreams}</strong> blockers on selected project</span>
        <span><strong>{selected.expectedRiskReduction}%</strong> expected risk reduction</span>
      </div>
    </EuiPanel>

    {receipt && <EuiCallOut title="Prototype project receipt" color="warning">{receipt}</EuiCallOut>}

    <div className="p36Workspace">
      <EuiPanel paddingSize="m" hasBorder className="p36PortfolioRail" data-visual-region="project-rail">
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Response portfolio</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <EuiSpacer size="s" />
        <div className="p36ProjectList" role="listbox" aria-label="Response projects">
          {visible.map((item) => <button type="button" role="option" aria-selected={item.key === selected.key} key={item.key} onClick={() => setSelectedKey(item.key)}>
            <header><EuiBadge color={item.health === 'Green' ? 'success' : item.health === 'Amber' ? 'warning' : 'danger'}>{item.health}</EuiBadge><small>{item.updated}</small></header>
            <strong>{item.name}</strong>
            <small>{item.id} · {item.owner}</small>
            <footer><span>{item.progress}% complete</span><span>{item.overdueMilestones} overdue</span></footer>
            <EuiProgress value={item.progress} max={100} size="s" color={item.health === 'Red' ? 'danger' : item.health === 'Amber' ? 'warning' : 'primary'} />
          </button>)}
        </div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder className="p36PrimaryWorkspace" data-visual-region={`project-${view.toLowerCase()}-workspace`}>
        <EuiFlexGroup alignItems="center" gutterSize="m" wrap>
          <EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · {selected.service} · owner {selected.owner}</p></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color={selected.status === 'At risk' ? 'danger' : 'primary'}>{selected.status}</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />

        {view === 'Portfolio' && <div className="p36PortfolioSummary">
          <EuiCallOut title="Objective and independent success criteria">{selected.objective} Linked Change or Task closure is supporting evidence, not project completion.</EuiCallOut>
          <div className="p36DecisionGrid">
            <article><span>Progress</span><strong>{selected.progress}%</strong><EuiProgress value={selected.progress} max={100} size="s" color="primary" /></article>
            <article><span>Critical path</span><strong>{selected.criticalPath}</strong></article>
            <article><span>Outcome state</span><strong>{selected.outcomeState}</strong></article>
            <article><span>Target date</span><strong>{selected.due}</strong></article>
          </div>
          <div className="p36AttentionRow">
            <EuiBadge color={selected.blockedWorkstreams ? 'danger' : 'success'}>{selected.blockedWorkstreams} blocked workstreams</EuiBadge>
            <EuiBadge color={selected.overdueMilestones ? 'warning' : 'success'}>{selected.overdueMilestones} overdue milestones</EuiBadge>
            <EuiBadge color={selected.risk === 'High' ? 'danger' : selected.risk === 'Medium' ? 'warning' : 'hollow'}>{selected.risk} project risk</EuiBadge>
          </div>
          <div className="p36LinkedRow" aria-label="Linked project evidence">
            {selected.linkedObjects.map((item) => <button type="button" key={item} onClick={(event) => openLinkedObject(item, event.currentTarget)}>{item}</button>)}
          </div>
          <EuiFlexGroup gutterSize="s" wrap>
            <EuiFlexItem grow={false}><EuiButton onClick={() => queue('Record blocker or decision')}>Record decision</EuiButton></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiButton fill onClick={() => setDecisionOpen(true)}>Review outcome gate</EuiButton></EuiFlexItem>
          </EuiFlexGroup>
        </div>}

        {view === 'Milestones' && <div className="p36MilestoneWorkspace">
          <EuiTitle size="xs"><h3>Critical-path timeline</h3></EuiTitle>
          <p>Select a milestone to inspect evidence without leaving the current project.</p>
          <div className="p36TimelineScroller"><div className="p36Timeline"><header><span>Milestone</span>{['Aug 01', 'Aug 15', 'Sep 01', 'Sep 15', 'Oct 01', 'Oct 15'].map((label) => <b key={label}>{label}</b>)}</header>{milestones.map((item) => <div className="p36TimelineRow" key={item.id}><div><strong>{item.name}</strong><small>{item.owner} · due {item.due}</small></div><button type="button" className={item.status.toLowerCase().replaceAll(' ', '-')} style={{ gridColumn: `${item.position + 1} / span ${item.span}` }} onClick={(event) => openMilestone(item, event.currentTarget)}><span>{item.status}</span><small>{item.dependency}</small></button></div>)}</div></div>
          <EuiSpacer size="m" />
          <EuiAccordion id={`p36-exact-${selected.key}`} buttonContent="Show exact milestone table" paddingSize="s">
            <div className="p36TableWrap"><table><thead><tr><th>Milestone</th><th>Owner</th><th>Due</th><th>Status</th><th>Dependency</th></tr></thead><tbody>{milestones.map((item) => <tr key={item.id}><td><EuiButtonEmpty size="xs" onClick={(event: MouseEvent<HTMLButtonElement>) => openMilestone(item, event.currentTarget)}>{item.id}</EuiButtonEmpty><small>{item.name}</small></td><td>{item.owner}</td><td>{item.due}</td><td><EuiBadge color={statusColor(item.status)}>{item.status}</EuiBadge></td><td>{item.dependency}</td></tr>)}</tbody></table></div>
          </EuiAccordion>
        </div>}

        {view === 'Outcomes' && <div className="p36OutcomeCanvas">
          <EuiTitle size="xs"><h3>Risk and outcome burn-down</h3></EuiTitle>
          {[['Initial residual risk', 92], ['Current residual risk', 54], ['Expected at completion', 21], ['Evidence confidence', selected.outcomeState === 'On track' ? 84 : 48]].map(([label, value]) => <div key={String(label)}><strong>{label}</strong><EuiProgress value={Number(value)} max={100} size="m" color={Number(value) > 75 ? 'danger' : Number(value) > 45 ? 'warning' : 'success'} /><span>{value}</span></div>)}
          <EuiSpacer size="m" />
          <div className="p36OutcomeCriteria">{['Recovery telemetry meets target for 14 days', 'No unresolved high-risk dependency', 'Linked Change and Tasks have authoritative receipts', 'Sponsor accepts independent outcome evidence'].map((item, index) => <article key={item}><EuiBadge color={index < 2 ? 'success' : 'warning'}>{index < 2 ? 'Verified' : 'Pending'}</EuiBadge><span>{item}</span></article>)}</div>
          <EuiSpacer size="m" />
          <EuiButton fill onClick={() => setDecisionOpen(true)}>Review outcome gate</EuiButton>
        </div>}
      </EuiPanel>
    </div>

    {(selectedMilestone || linkedObject) && <EuiFlyout onClose={closeEvidence} ownFocus size="m" aria-labelledby="p36-evidence-title">
      <EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p36-evidence-title">{selectedMilestone ? 'Milestone evidence' : 'Linked evidence'}</h2></EuiTitle></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title="Context preserved">The selected project and active work mode remain unchanged after this Flyout closes.</EuiCallOut>
        <EuiSpacer />
        {selectedMilestone ? <>
          <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h3>{selectedMilestone.name}</h3></EuiTitle><p>{selectedMilestone.id} · {selectedMilestone.owner}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={statusColor(selectedMilestone.status)}>{selectedMilestone.status}</EuiBadge></EuiFlexItem></EuiFlexGroup>
          <dl className="p36EvidenceDefinition"><div><dt>Due</dt><dd>{selectedMilestone.due}</dd></div><div><dt>Dependency</dt><dd>{selectedMilestone.dependency}</dd></div><div><dt>Evidence</dt><dd>{selectedMilestone.evidence}</dd></div><div><dt>Authoritative state</dt><dd>Pending source rehydration</dd></div></dl>
          <EuiCallOut title="Completion boundary" color="warning">A queued or accepted Change, Task, or agent receipt is not milestone completion until authoritative evidence is rehydrated.</EuiCallOut>
        </> : <>
          <EuiTitle size="s"><h3>{linkedObject}</h3></EuiTitle>
          <p>{linkedObject?.startsWith('CHG') ? 'Change evidence' : linkedObject?.startsWith('PRB') ? 'Problem record' : linkedObject?.startsWith('INC') ? 'Incident context' : 'Security Case'}</p>
          <dl className="p36EvidenceDefinition"><div><dt>Project</dt><dd>{selected.id}</dd></div><div><dt>Relationship</dt><dd>Supporting evidence</dd></div><div><dt>Freshness</dt><dd>{fixture.freshness}</dd></div><div><dt>Completion effect</dt><dd>Does not independently complete the project</dd></div></dl>
        </>}
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiButton onClick={closeEvidence}>Close evidence</EuiButton></EuiFlyoutFooter>
    </EuiFlyout>}

    {decisionOpen && <EuiModal onClose={() => setDecisionOpen(false)} aria-labelledby="p36-outcome-title"><EuiModalHeader><EuiModalHeaderTitle id="p36-outcome-title">Outcome verification gate</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Project completion is independent" color="warning">Closing a Change, Task, Problem or Incident does not complete this project. All success criteria and evidence freshness must pass.</EuiCallOut><ul><li>Project: {selected.id}</li><li>Outcome state: {selected.outcomeState}</li><li>Unresolved blockers: {selected.blockedWorkstreams}</li><li>Overdue milestones: {selected.overdueMilestones}</li><li>Rollback/reopen path: retained</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setDecisionOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={() => { queue('Outcome verification'); setDecisionOpen(false); }}>Queue verification</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}