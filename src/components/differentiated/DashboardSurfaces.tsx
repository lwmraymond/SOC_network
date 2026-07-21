import {
  EuiBadge,
  EuiButtonEmpty,
  EuiProgress,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture } from '../../types/prototype';

const percentage = (value: number) => `${Math.max(4, Math.min(100, value))}%`;

export function SecurityCommandCanvas({ fixture }: { fixture: PrototypePageFixture }) {
  const critical = fixture.rows.slice(0, 6);
  return (
    <div className="securityCommandCanvas" data-visual-region="security-command-canvas">
      <section className="socAttentionBoard" data-visual-region="critical-attention-board">
        <header><div><EuiBadge color="danger">Shift priority</EuiBadge><h2>Critical attention board</h2><p>Ranked by risk, evidence confidence and SLA pressure.</p></div><strong>{critical.length} active</strong></header>
        <ol>{critical.map((row, index) => <li key={row.id}>
          <span className={`riskRank risk-${index < 2 ? 'critical' : index < 4 ? 'high' : 'guarded'}`}>{index + 1}</span>
          <div><strong>{String(row.title ?? row.id)}</strong><small>{String(row.primary_entity ?? row.owner)} · {String(row.classification ?? row.status)}</small></div>
          <div className="evidenceMeter"><span style={{ width: percentage(82 - index * 8) }} /><small>{82 - index * 8}% evidence</small></div>
          <EuiBadge color={index < 2 ? 'danger' : index < 4 ? 'warning' : 'hollow'}>{String(row.severity)}</EuiBadge>
        </li>)}</ol>
      </section>
      <aside className="attackCoverageMap" data-visual-region="attack-coverage-map">
        <EuiTitle size="xs"><h2>Attack coverage</h2></EuiTitle>
        <div className="techniqueMatrix">{fixture.chart.slice(0, 12).map((point, index) => <span key={point.label} className={index % 5 === 0 ? 'coverageGap' : index % 3 === 0 ? 'coverageWarn' : 'coverageGood'}><b>{point.label}</b><small>{point.value}%</small></span>)}</div>
        <p>Three techniques depend on degraded network telemetry.</p>
      </aside>
      <aside className="analystWorkloadBoard" data-visual-region="analyst-workload-board">
        <EuiTitle size="xs"><h2>Analyst workload</h2></EuiTitle>
        {['Tier 1','Tier 2','Threat hunt','Response'].map((team, index) => <div key={team}><span>{team}</span><EuiProgress value={74 - index * 11} max={100} size="s" color={index === 0 ? 'warning' : 'primary'} /><small>{8 + index * 3} open</small></div>)}
      </aside>
      <section className="sourceIntegrityMatrix" data-visual-region="source-integrity-matrix">
        <EuiTitle size="xs"><h2>Required-source integrity</h2></EuiTitle>
        {['Endpoint','Identity','Network','Cloud audit'].map((source, index) => <div key={source}><strong>{source}</strong><span>{98 - index * 4}%</span><EuiBadge color={index === 2 ? 'warning' : 'success'}>{index === 2 ? 'Degraded' : 'Ready'}</EuiBadge></div>)}
      </section>
      <footer className="shiftDecisionRail" data-visual-region="shift-decision-rail"><div><strong>Next shift decision</strong><span>Assign the top two unowned cases and restore network coverage before widening the hunt.</span></div><EuiButtonEmpty>Open handoff context</EuiButtonEmpty></footer>
    </div>
  );
}

export function ServiceOperationsCommand({ fixture }: { fixture: PrototypePageFixture }) {
  const services = fixture.rows.slice(0, 5);
  return (
    <div className="serviceOperationsCommand" data-visual-region="service-operations-command">
      <section className="serviceHealthMap" data-visual-region="service-health-map">
        <header><div><EuiBadge color="warning">Service operations</EuiBadge><h2>Business service health</h2><p>Impact, SLA risk and active work are grouped by service—not by security signal.</p></div><strong>3 at risk</strong></header>
        {services.map((row, index) => <article key={row.id}>
          <div className={`servicePulse pulse-${index % 3}`}><span /></div>
          <div><strong>{String(row.service_ref ?? row.id)}</strong><small>{String(row.owner)} · {String(row.status)}</small></div>
          <div className="slaClock"><b>{24 - index * 3}m</b><small>to breach</small></div>
          <EuiBadge color={index < 2 ? 'danger' : index === 2 ? 'warning' : 'success'}>{index < 3 ? 'At risk' : 'Stable'}</EuiBadge>
        </article>)}
      </section>
      <aside className="slaRiskLane" data-visual-region="sla-risk-lane">
        <EuiTitle size="xs"><h2>SLA risk lane</h2></EuiTitle>
        {['Incident response','Request fulfilment','Change approval','Problem review'].map((label,index)=><div key={label}><span>{label}</span><b>{6 + index * 4}</b><small>{index % 2 ? 'within target' : 'needs assignment'}</small></div>)}
      </aside>
      <section className="typedWorkObjectBoard" data-visual-region="typed-work-object-board">
        <EuiTitle size="xs"><h2>Typed work objects</h2></EuiTitle>
        {['Major incidents','Changes today','Problem investigations','Requests awaiting owner'].map((label,index)=><article key={label}><span className={`objectType type-${index}`}>{label.slice(0,1)}</span><div><strong>{label}</strong><small>{12 + index * 5} records · {index + 1} escalated</small></div><EuiButtonEmpty size="xs">Open queue</EuiButtonEmpty></article>)}
      </section>
      <section className="changeWindowBoard" data-visual-region="change-window-board"><EuiTitle size="xs"><h2>Change window</h2></EuiTitle><div className="changeTimeline"><span style={{left:'12%',width:'18%'}}>Network</span><span style={{left:'38%',width:'26%'}}>Identity</span><span style={{left:'72%',width:'15%'}}>Endpoint</span></div><p>Two collision risks overlap active incidents.</p></section>
      <section className="syncConflictBoard" data-visual-region="sync-conflict-board"><EuiTitle size="xs"><h2>SOC / ITSM synchronization</h2></EuiTitle>{['Owner mapping','State transition','CI identity'].map((item,index)=><div key={item}><strong>{item}</strong><span>{index + 1} conflicts</span><EuiBadge color={index === 0 ? 'danger' : 'warning'}>Review</EuiBadge></div>)}</section>
    </div>
  );
}

export function AnalyticsBuilderWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  return (
    <div className="analyticsBuilderWorkspace" data-visual-region="analytics-builder-workspace">
      <aside className="analysisDefinitionRail" data-visual-region="analysis-definition-rail">
        <EuiTitle size="xs"><h2>Analysis definition</h2></EuiTitle>
        {['Metric','Population','Time grain','Comparison','Confidence'].map((label,index)=><label key={label}><span>{label}</span><button type="button">{['MTTR','Major incidents','Weekly','Prior period','Coverage ≥ 90%'][index]}</button></label>)}
        <button type="button" className="runAnalysis">Run analysis</button>
      </aside>
      <section className="analyticsCanvas" data-visual-region="analytics-canvas">
        <header><div><EuiBadge color="primary">Saved analysis</EuiBadge><h2>MTTR by service cohort</h2><p>Normalized scope is shared by the chart, exact records and export job.</p></div><strong>−14.2%</strong></header>
        <div className="comparisonChart" role="img" aria-label="Weekly MTTR comparison. Exact data follows.">{fixture.chart.slice(0,10).map((point)=><div key={point.label}><i style={{height:percentage(point.value)}} /><b style={{height:percentage(point.secondary ?? point.value/2)}} /><small>{point.label}</small></div>)}</div>
        <div className="analysisSummaryCards">{['Current cohort','Prior cohort','Target','Confidence'].map((label,index)=><article key={label}><span>{label}</span><strong>{['42m','49m','38m','94%'][index]}</strong><small>{['18 records','21 records','service target','coverage qualified'][index]}</small></article>)}</div>
      </section>
      <aside className="metricDefinitionInspector" data-visual-region="metric-definition-inspector"><EuiTitle size="xs"><h2>Metric contract</h2></EuiTitle><dl><div><dt>Numerator</dt><dd>Resolved duration</dd></div><div><dt>Denominator</dt><dd>Closed incidents</dd></div><div><dt>Clock</dt><dd>Business elapsed</dd></div><div><dt>Exclusions</dt><dd>Cancelled / duplicate</dd></div></dl><EuiBadge color="success">Definition valid</EuiBadge></aside>
      <section className="cohortComparison" data-visual-region="cohort-comparison"><EuiTitle size="xs"><h2>Cohort comparison</h2></EuiTitle>{['Identity','Network','Endpoint','Cloud'].map((service,index)=><div key={service}><strong>{service}</strong><span>{36 + index * 8}m</span><span>{44 + index * 6}m prior</span><EuiBadge color={index < 2 ? 'success' : 'warning'}>{index < 2 ? 'Improved' : 'Review'}</EuiBadge></div>)}</section>
      <section className="exactAnalysisRecords" data-visual-region="exact-analysis-records"><EuiTitle size="xs"><h2>Exact analysis records</h2></EuiTitle><table><thead><tr><th>Service</th><th>Current</th><th>Prior</th><th>Coverage</th></tr></thead><tbody>{['Identity','Network','Endpoint','Cloud'].map((service,index)=><tr key={service}><td>{service}</td><td>{36 + index * 8}m</td><td>{44 + index * 6}m</td><td>{92 - index}%</td></tr>)}</tbody></table></section>
    </div>
  );
}
