import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem,
  EuiPanel, EuiProgress, EuiSelect, EuiSpacer, EuiStat, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';

type RecordRow={id:string;service:string;priority:string;opened:string;resolved:string;duration:number;sla:string;excluded:boolean};
type ChangeEvent={target:{value:string}};
const text=(value:PrototypeValue|undefined,fallback:string)=>value===undefined?fallback:String(value);
const number=(value:PrototypeValue|undefined,fallback:number)=>Number.isFinite(Number(value))?Number(value):fallback;
const buildRecords=(rows:PrototypeRow[]):RecordRow[]=>rows.slice(0,16).map((row,index)=>({
  id:text(row.work_item_id,`INC-${7600+index}`),service:text(row.service_ci,['Identity','Endpoint','Customer API','Network'][index%4]),priority:text(row.priority,index<3?'P1':index<8?'P2':'P3'),opened:text(row.opened_at,`2026-07-${String(10+index%8).padStart(2,'0')} 09:00`),resolved:text(row.resolved_at,index%5===0?'Open':`2026-07-${String(11+index%8).padStart(2,'0')} 11:00`),duration:number(row.elapsed_minutes,35+index*7),sla:text(row.sla_state,index%4===0?'Breached':'Met'),excluded:Boolean(row.excluded??(index%7===0)),
}));

export function P20ItsmAnalyticsWorkspace({fixture}:{fixture:PrototypePageFixture}){
  const[metric,setMetric]=useState('Mean time to restore');
  const[population,setPopulation]=useState('Incidents');
  const[comparison,setComparison]=useState('Previous 30 days');
  const[service,setService]=useState('All services');
  const[query,setQuery]=useState('');
  const[receipt,setReceipt]=useState<string|undefined>(undefined);
  const records=useMemo(()=>buildRecords(fixture.rows),[fixture.rows]);
  const exact=useMemo(()=>records.filter((item)=>(service==='All services'||item.service===service)&&(!query.trim()||`${item.id} ${item.service} ${item.priority}`.toLowerCase().includes(query.trim().toLowerCase()))),[query,records,service]);
  const included=exact.filter((item)=>!item.excluded);
  const average=Math.round(included.reduce((sum,item)=>sum+item.duration,0)/Math.max(1,included.length));
  const breached=included.filter((item)=>item.sla==='Breached').length;
  const open=exact.filter((item)=>item.resolved==='Open').length;
  const points=fixture.chart.slice(0,10);
  const max=Math.max(1,...points.map((point)=>point.value));
  return <div className="pageComposition page-p20 differentiatedPage" data-page-specific-composition="P20-analytics-builder-exact-data">
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="analysis-definition-rail"><EuiTitle size="s"><h2>Analysis definition</h2></EuiTitle><EuiSelect value={metric} onChange={(event:ChangeEvent)=>setMetric(event.target.value)} options={['Mean time to restore','SLA attainment','Backlog age','Inflow vs completion'].map((value)=>({value,text:value}))}/><EuiSpacer size="s"/><EuiSelect value={population} onChange={(event:ChangeEvent)=>setPopulation(event.target.value)} options={['Incidents','Requests','Problems','Changes'].map((value)=>({value,text:value}))}/><EuiSpacer size="s"/><EuiSelect value={comparison} onChange={(event:ChangeEvent)=>setComparison(event.target.value)} options={['Previous 30 days','Previous quarter','Target','Peer service'].map((value)=>({value,text:value}))}/><EuiSpacer size="s"/><EuiSelect value={service} onChange={(event:ChangeEvent)=>setService(event.target.value)} options={['All services','Identity','Endpoint','Customer API','Network'].map((value)=>({value,text:value}))}/><EuiSpacer/><EuiButton fill fullWidth onClick={()=>setReceipt('Analysis recomputed from the normalized prototype scope.')}>Run analysis</EuiButton><EuiSpacer size="s"/><EuiButtonEmpty onClick={()=>setReceipt('Analysis saved as a prototype view; no production repository was written.')}>Save analysis</EuiButtonEmpty></EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={7}><div>{receipt&&<><EuiCallOut title="Prototype analysis receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m"/></>}<EuiPanel paddingSize="m" hasBorder data-visual-region="analytics-canvas"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiBadge color="primary">metric rev 12</EuiBadge><EuiTitle size="s"><h2>{metric} · {population}</h2></EuiTitle><p>{service} · compared with {comparison}</p></EuiFlexItem><EuiFlexItem grow={false}><strong className="analysisDelta">−14.2%</strong></EuiFlexItem></EuiFlexGroup><EuiSpacer size="m"/>
        <EuiFlexGroup gutterSize="s" wrap>{[['Current',`${average}m`],['Prior','49m'],['SLA attained',`${Math.round((1-breached/Math.max(1,included.length))*100)}%`],['Open backlog',open],['Coverage',`${Math.round(fixture.coverage*100)}%`]].map(([label,value])=><EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s"/></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>
        <EuiSpacer size="m"/><div className="analyticsChartLegend" aria-hidden="true"><span><i className="current"/>Current</span><span><i className="prior"/>Prior period</span></div><div className="analyticsComparisonChart" role="img" aria-label="Current and prior period metric comparison; exact records follow.">{points.map((point)=><div key={point.label}><span style={{height:`${Math.max(6,point.value/max*100)}%`}}/><i style={{height:`${Math.max(6,(point.secondary??point.value*1.15)/max*100)}%`}}/><small>{point.label}</small></div>)}</div>
        <table className="chartFallback"><caption>Exact trend data</caption><thead><tr><th>Period</th><th>Current</th><th>Comparison</th></tr></thead><tbody>{points.map((point)=><tr key={point.label}><td>{point.label}</td><td>{point.value}</td><td>{point.secondary??Math.round(point.value*1.15)}</td></tr>)}</tbody></table>
      </EuiPanel><EuiSpacer size="m"/><EuiPanel paddingSize="m" hasBorder data-visual-region="analytics-exact-records"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Exact analysis records</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event:ChangeEvent)=>setQuery(event.target.value)} placeholder="Filter exact records"/></EuiFlexItem></EuiFlexGroup><EuiSpacer size="s"/><table><thead><tr><th>Work item</th><th>Service</th><th>Priority</th><th>Duration</th><th>SLA</th><th>Exclusion</th></tr></thead><tbody>{exact.map((item)=><tr key={item.id}><td>{item.id}</td><td>{item.service}</td><td>{item.priority}</td><td>{item.duration}m</td><td><EuiBadge color={item.sla==='Breached'?'danger':'success'}>{item.sla}</EuiBadge></td><td>{item.excluded?'Excluded':'Included'}</td></tr>)}</tbody></table></EuiPanel></div></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="metric-contract-inspector"><EuiTitle size="xs"><h2>Metric contract</h2></EuiTitle><dl><div><dt>Numerator</dt><dd>Resolved elapsed minutes</dd></div><div><dt>Denominator</dt><dd>{included.length} included items</dd></div><div><dt>Business calendar</dt><dd>Global 24×7</dd></div><div><dt>Exclusions</dt><dd>{exact.length-included.length} cancelled/duplicate</dd></div><div><dt>Coverage</dt><dd>{Math.round(fixture.coverage*100)}%</dd></div><div><dt>Exact query</dt><dd>{population.toLowerCase()} AND service={service}</dd></div></dl><EuiProgress value={fixture.coverage*100} max={100} size="s" color="primary"/><EuiSpacer/><EuiCallOut title="Replayable analysis">Every KPI and chart resolves to the same exact record set and metric revision.</EuiCallOut></EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
  </div>;
}
