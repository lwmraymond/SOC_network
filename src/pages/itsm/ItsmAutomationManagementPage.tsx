import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiTable,
  EuiTableBody,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableRow,
  EuiTableRowCell,
  EuiTitle,
} from '@elastic/eui';
import { useSearchParams } from 'react-router-dom';
import { CapabilityShell } from '../../itsm/components/CapabilityShell';
import { GovernedAction } from '../../itsm/components/GovernedAction';
import { ItsmTabs } from '../../itsm/components/ItsmTabs';
import { createDemoMutationContext } from '../../itsm/components/demoContext';
import { automationTemplateApi } from '../../itsm/automation/api';
import type { ManagedAutomationRun, ManagedAutomationTemplate } from '../../itsm/automation/contracts';
import { formatDuration, runStateColor, templateStatusColor } from '../../itsm/automation/model';
import { itsmApi } from '../../itsm/client';
import type { AutomationRule } from '../../itsm/contracts';
import { useItsmQuery } from '../../itsm/hooks';

type AutomationOverviewData = { templates: ManagedAutomationTemplate[]; rules: AutomationRule[]; runs: ManagedAutomationRun[] };
const sections = ['Overview','Rule editor','Execution runs'];

export default function ItsmAutomationManagementPage() {
  const [params, setParams] = useSearchParams();
  const section = sections.includes(params.get('section') ?? '') ? params.get('section') as string : 'Overview';
  const selectedRuleId = params.get('ruleId');
  const query = useItsmQuery<AutomationOverviewData>(async (signal) => {
    const [templates, rules, runs] = await Promise.all([
      automationTemplateApi.listTemplates({ limit: 200 }, signal),
      itsmApi.listAutomationRules({}, signal),
      automationTemplateApi.listRuns({ limit: 100, sort: [{ field: 'startedAt', direction: 'desc' }] }, signal),
    ]);
    return { templates: templates.items, rules: rules.items, runs: runs.items };
  }, []);
  const data = query.data;
  const rule = data?.rules.find((item) => item.id === selectedRuleId) ?? data?.rules[0];
  const setSection = (next: string) => {
    const updated = new URLSearchParams(params);
    updated.set('section', next);
    setParams(updated);
  };
  const setRule = (ruleId: string) => {
    const updated = new URLSearchParams(params);
    updated.set('section', 'Rule editor');
    updated.set('ruleId', ruleId);
    setParams(updated);
  };

  return <CapabilityShell title="Automation administration" description="Operational overview, rule editor and execution history. Reusable Template management and Runtime settings use dedicated stable routes." queryState={query.state} errorMessage={query.error?.message} management rightSideItems={[
    <EuiButtonEmpty key="templates" href="/itsm/automation/templates">Template library</EuiButtonEmpty>,
    <EuiButtonEmpty key="runtime" href="/itsm/automation/runtime">Runtime settings</EuiButtonEmpty>,
    <EuiButtonEmpty key="p34" href="/knowledge/playbooks">P34 playbooks</EuiButtonEmpty>,
  ]}>
    {data && <>
      <EuiPanel paddingSize="none" hasBorder><ItsmTabs items={sections} active={section} onChange={setSection} /></EuiPanel>
      <EuiSpacer size="m" />
      {section === 'Overview' && <>
        <div className="itsmAutomationKpiGrid">
          <EuiPanel paddingSize="s" hasBorder><EuiStat title={String(data.templates.length)} description="Templates" titleSize="s" /></EuiPanel>
          <EuiPanel paddingSize="s" hasBorder><EuiStat title={String(data.templates.filter((item) => item.status === 'published').length)} description="Published templates" titleSize="s" /></EuiPanel>
          <EuiPanel paddingSize="s" hasBorder><EuiStat title={String(data.rules.length)} description="Rules" titleSize="s" /></EuiPanel>
          <EuiPanel paddingSize="s" hasBorder><EuiStat title={String(data.runs.filter((item) => item.state === 'failed' || item.state === 'partial').length)} description="Failed / partial runs" titleSize="s" /></EuiPanel>
        </div>
        <EuiSpacer size="m" />
        <div className="itsmAutomationOverviewGrid">
          <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Template lifecycle</h2></EuiTitle><EuiSpacer size="s" />{data.templates.slice(0, 5).map((template) => <div className="itsmCapabilityRow" key={template.id}><span><strong>{template.name}</strong><small>{template.category} · {template.owner} · {template.publishedVersionId ?? 'not published'}</small></span><EuiBadge color={templateStatusColor(template.status)}>{template.status}</EuiBadge></div>)}<EuiSpacer size="s" /><EuiButtonEmpty href="/itsm/automation/templates">Open Template Library</EuiButtonEmpty></EuiPanel>
          <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Recent execution health</h2></EuiTitle><EuiSpacer size="s" />{data.runs.slice(0, 5).map((run) => <div className="itsmCapabilityRow" key={run.id}><span><strong>{run.id}</strong><small>{run.templateName ?? run.templateId ?? run.ruleId} · {run.triggerSource ?? 'TBD'} · {formatDuration(run.durationMs)}</small></span><EuiBadge color={runStateColor(run.state)}>{run.state}</EuiBadge></div>)}<EuiSpacer size="s" /><EuiButtonEmpty onClick={() => setSection('Execution runs')}>Open execution runs</EuiButtonEmpty></EuiPanel>
          <EuiPanel paddingSize="m" hasBorder className="itsmAutomationRuntimeOverview"><div><EuiTitle size="s"><h2>Runtime governance</h2></EuiTitle><EuiCallOut title="Execution engine settings">Queue/concurrency, timeout, retry, dead-letter, idempotency, approval, compensation, retention and audit correlation remain explicit configuration contracts.</EuiCallOut></div><dl className="itsmDefinitionGrid"><div><dt>Queue / concurrency</dt><dd>Configured source + effective value</dd></div><div><dt>Retry / dead-letter</dt><dd>Validation and apply requirement</dd></div><div><dt>Idempotency</dt><dd>Window and correlation contract</dd></div><div><dt>Deployment boundary</dt><dd>No browser restart or redeploy</dd></div></dl><EuiButtonEmpty href="/itsm/automation/runtime">Open Runtime Settings</EuiButtonEmpty></EuiPanel>
        </div>
      </>}
      {section === 'Rule editor' && rule && <div className="itsmAutomationGrid">
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Rules</h2></EuiTitle>{data.rules.map((item) => <button type="button" className={`itsmResourceButton ${item.id === rule.id ? 'selected' : ''}`} key={item.id} onClick={() => setRule(item.id)}><span><strong>{item.name}</strong><small>{item.status} · {item.version} · template {item.templateId ?? 'none'}</small></span><EuiBadge color={item.status === 'published' ? 'success' : 'warning'}>{item.status}</EuiBadge></button>)}</EuiPanel>
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>{rule.name}</h2></EuiTitle><div className="itsmRuleCanvas"><article><b>Trigger</b><span>{rule.trigger.name}</span></article>{rule.nodes.map((node) => <article key={node.id}><b>{node.type}</b><span>{node.name}</span><small>{JSON.stringify(node.config)}</small></article>)}</div><EuiSpacer /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><GovernedAction label="Dry-run" preview={async () => ({ operation: 'automation.rule.dry-run', summary: `Simulate ${rule.name}`, affectedResources: [{ type: 'automation-run', id: 'new', effect: 'dry-run only' }], permissions: [{ capability: 'automation.run.dry', decision: rule.status === 'published' ? 'allow' : 'conditional' }], validation: [], warnings: ['Simulation only. No connector or ticket mutation executes.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })} execute={async (signal) => { const run = await itsmApi.dryRunAutomationRule(rule.id, { ticketId: 'inc-7001' }, createDemoMutationContext(rule.etag, rule.version), signal); return { receipt: { receiptId: run.id, operation: 'automation.rule.dry-run', state: 'accepted', submittedAt: run.createdAt, authoritative: false } }; }} rehydrate={async (_receipt, signal) => (await automationTemplateApi.listRuns({}, signal)).items} onComplete={query.refresh} /></EuiFlexItem><EuiFlexItem grow={false}><GovernedAction label="Publish version" fill preview={(signal) => itsmApi.previewAutomationRule(rule, signal)} execute={async (signal) => ({ receipt: await itsmApi.publishAutomationRule(rule.id, rule.publishedVersionId ?? rule.version, createDemoMutationContext(rule.etag, rule.version), signal) })} rehydrate={async (_receipt, signal) => (await itsmApi.listAutomationRules({}, signal)).items} onComplete={query.refresh} /></EuiFlexItem></EuiFlexGroup></EuiPanel>
      </div>}
      {section === 'Execution runs' && <EuiPanel paddingSize="none" hasBorder className="itsmAutomationRunTracePanel">
        <EuiTable responsiveBreakpoint={false} aria-label="Automation execution runs">
          <EuiTableHeader><EuiTableHeaderCell>Run</EuiTableHeaderCell><EuiTableHeaderCell>Template / version</EuiTableHeaderCell><EuiTableHeaderCell>Trigger source</EuiTableHeaderCell><EuiTableHeaderCell>Mode</EuiTableHeaderCell><EuiTableHeaderCell>State</EuiTableHeaderCell><EuiTableHeaderCell>Attempts</EuiTableHeaderCell><EuiTableHeaderCell>Duration</EuiTableHeaderCell><EuiTableHeaderCell>Failure</EuiTableHeaderCell><EuiTableHeaderCell>Audit</EuiTableHeaderCell></EuiTableHeader>
          <EuiTableBody>{data.runs.map((run) => <EuiTableRow key={run.id}><EuiTableRowCell><EuiButtonEmpty size="xs" href={`/itsm/automation/runs/${encodeURIComponent(run.id)}`}>{run.id}</EuiButtonEmpty></EuiTableRowCell><EuiTableRowCell>{run.templateName ?? run.templateId ?? 'TBD'}<small>{run.templateVersionId ?? run.versionId}</small></EuiTableRowCell><EuiTableRowCell>{run.triggerSource ?? 'TBD'}</EuiTableRowCell><EuiTableRowCell><EuiBadge color={run.contractMode === 'dry_run' ? 'warning' : 'hollow'}>{run.contractMode}</EuiBadge></EuiTableRowCell><EuiTableRowCell><EuiBadge color={runStateColor(run.state)}>{run.state}</EuiBadge></EuiTableRowCell><EuiTableRowCell>{run.attempts}</EuiTableRowCell><EuiTableRowCell>{formatDuration(run.durationMs)}</EuiTableRowCell><EuiTableRowCell>{run.failure?.kind ?? '—'}<small>{run.failure?.message}</small></EuiTableRowCell><EuiTableRowCell>{run.auditCorrelationId}</EuiTableRowCell></EuiTableRow>)}</EuiTableBody>
        </EuiTable>
      </EuiPanel>}
    </>}
  </CapabilityShell>;
}
