import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiProgress,
  EuiSpacer,
  EuiStat,
  EuiTitle,
} from '@elastic/eui';
import type { AutomationRule, AutomationRun, AutomationTemplate, AutomationVersion, CapabilitySnapshot } from '../../itsm/contracts';
import { itsmApi } from '../../itsm/client';
import { useItsmQuery } from '../../itsm/hooks';
import { CapabilityShell } from '../../itsm/components/CapabilityShell';
import { createDemoMutationContext } from '../../itsm/components/demoContext';
import { GovernedAction } from '../../itsm/components/GovernedAction';
import { ItsmTabs } from '../../itsm/components/ItsmTabs';

type AutomationData = {
  templates: AutomationTemplate[];
  rules: AutomationRule[];
  versions: AutomationVersion[];
  runs: AutomationRun[];
  capabilities: CapabilitySnapshot;
};

const automationTabs = ['Templates', 'Rule editor', 'Execution runs'] as const;

function runColor(state: AutomationRun['state']): 'success' | 'danger' | 'warning' {
  if (state === 'succeeded') return 'success';
  if (state === 'failed' || state === 'partial') return 'danger';
  return 'warning';
}

export default function ItsmAutomationManagementPage() {
  const query = useItsmQuery<AutomationData>(async (signal) => {
    const [templates, rules, versions, runs, capabilities] = await Promise.all([
      itsmApi.listAutomationTemplates({}, signal),
      itsmApi.listAutomationRules({}, signal),
      itsmApi.listAutomationVersions('rule-major-incident', {}, signal),
      itsmApi.listAutomationRuns({}, signal),
      itsmApi.getCapabilities(signal),
    ]);
    return { templates: templates.items, rules: rules.items, versions: versions.items, runs: runs.items, capabilities };
  }, []);
  const [tab, setTab] = useState('Rule editor');
  const [selectedId, setSelectedId] = useState('rule-major-incident');
  const data = query.data;
  const rule = data?.rules.find((item) => item.id === selectedId) ?? data?.rules[0];
  const summary = useMemo(() => {
    if (!data) return undefined;
    return {
      published: data.rules.filter((item) => item.status === 'published').length,
      drafts: data.rules.filter((item) => item.status === 'draft').length,
      failures: data.runs.filter((item) => item.state === 'failed' || item.state === 'partial').length,
      dryRuns: data.runs.filter((item) => item.dryRun).length,
      retryable: data.runs.filter((item) => item.failure?.retryable).length,
    };
  }, [data]);

  return <CapabilityShell
    title="Automation administration"
    description="Template library, versioned rule editor, dry-run trace, execution history, retry and cancel governance."
    queryState={query.state}
    errorMessage={query.error?.message}
    management
    rightSideItems={[
      <EuiButtonEmpty key="settings" href="/itsm/settings">ITSM settings</EuiButtonEmpty>,
      <EuiButtonEmpty key="p34" href="/knowledge/playbooks">Open P34 playbooks</EuiButtonEmpty>,
    ]}
  >
    {data && summary && <>
      <EuiFlexGroup gutterSize="m" wrap className="itsmKpiStrip" data-management-summary="automation">
        {[
          ['Published rules', summary.published],
          ['Draft rules', summary.drafts],
          ['Failed / partial runs', summary.failures],
          ['Dry-runs', summary.dryRuns],
          ['Retryable failures', summary.retryable],
        ].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="m" hasBorder><EuiStat title={String(value)} description={String(label)} titleSize="s" /></EuiPanel></EuiFlexItem>)}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="none" hasBorder><ItsmTabs items={automationTabs} active={tab} onChange={setTab} /></EuiPanel>
      <EuiSpacer size="m" />

      {tab === 'Templates' && <div className="itsmCardGrid">{data.templates.map((template) => <EuiPanel paddingSize="m" hasBorder key={template.id}><EuiBadge color={template.status === 'published' ? 'success' : 'warning'}>{template.status}</EuiBadge><EuiTitle size="xs"><h2>{template.name}</h2></EuiTitle><p>{template.description}</p><small>{template.category} · latest {template.latestVersionId} · revision {template.version}</small></EuiPanel>)}</div>}

      {tab === 'Rule editor' && rule && <div className="itsmAutomationGrid itsmPrimaryAdminGrid">
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="s"><h2>Rules</h2></EuiTitle>
          {data.rules.map((item) => <button type="button" className={`itsmResourceButton ${item.id === rule.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelectedId(item.id)}><span><strong>{item.name}</strong><small>{item.status} · revision {item.version}</small></span><EuiBadge color={item.status === 'published' ? 'success' : 'warning'}>{item.status}</EuiBadge></button>)}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{rule.name}</h2></EuiTitle><small>{rule.id} · version {rule.version} · {rule.etag}</small></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={rule.status === 'published' ? 'success' : 'warning'}>{rule.status}</EuiBadge></EuiFlexItem></EuiFlexGroup>
          <div className="itsmRuleCanvas">
            <article><b>Trigger</b><span>{rule.trigger.name}</span><small>{JSON.stringify(rule.trigger.config)}</small></article>
            {rule.nodes.map((node) => <article key={node.id}><b>{node.type}</b><span>{node.name}</span><small>{JSON.stringify(node.config)}</small></article>)}
          </div>
          <EuiSpacer />
          <EuiFlexGroup gutterSize="s" wrap>
            <EuiFlexItem grow={false}><GovernedAction
              label="Dry-run"
              preview={async () => ({ operation: 'automation.rule.dry-run', summary: `Simulate ${rule.name}`, affectedResources: [{ type: 'automation-run', id: 'new', effect: 'dry-run only' }], permissions: [{ capability: 'automation.run.dry', decision: rule.status === 'published' ? 'allow' : 'conditional' }], validation: [], warnings: ['No connector action or ticket write will execute.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })}
              execute={async (signal) => {
                const run = await itsmApi.dryRunAutomationRule(rule.id, { ticketId: 'inc-7001' }, createDemoMutationContext(rule.etag, rule.version), signal);
                return { receipt: { receiptId: run.id, operation: 'automation.rule.dry-run', state: 'accepted', submittedAt: run.createdAt, authoritative: false } };
              }}
              rehydrate={async (_receipt, signal) => (await itsmApi.listAutomationRuns({}, signal)).items}
            /></EuiFlexItem>
            <EuiFlexItem grow={false}><GovernedAction
              label="Publish version"
              fill
              preview={(signal) => itsmApi.previewAutomationRule(rule, signal)}
              execute={async (signal) => ({ receipt: await itsmApi.publishAutomationRule(rule.id, rule.publishedVersionId ?? rule.version, createDemoMutationContext(rule.etag, rule.version), signal) })}
              rehydrate={async (_receipt, signal) => (await itsmApi.listAutomationRules({}, signal)).items}
            /></EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </div>}

      {tab === 'Execution runs' && <EuiPanel paddingSize="m" hasBorder><table><thead><tr><th>Run</th><th>Rule</th><th>Ticket</th><th>Mode</th><th>State</th><th>Attempts</th><th>Failure / actions</th></tr></thead><tbody>{data.runs.map((run) => <tr key={run.id}><td>{run.id}<small>{run.auditCorrelationId}</small></td><td>{run.ruleId}</td><td>{run.ticketId ?? '—'}</td><td>{run.dryRun ? 'dry-run' : 'live contract'}</td><td><EuiBadge color={runColor(run.state)}>{run.state}</EuiBadge></td><td>{run.attempts}</td><td>{run.failure?.message ?? '—'} {run.failure?.retryable && <GovernedAction label="Retry" preview={async () => ({ operation: 'automation.run.retry', summary: `Retry ${run.id}`, affectedResources: [{ type: 'automation-run', id: run.id, effect: 'new attempt' }], permissions: [{ capability: 'automation.run.retry', decision: 'conditional' }], validation: [], warnings: ['A retry may repeat external side effects; idempotency ownership remains with the backend executor.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })} execute={async (signal) => ({ receipt: await itsmApi.retryAutomationRun(run.id, createDemoMutationContext(run.etag, run.version), signal) })} rehydrate={async (_receipt, signal) => (await itsmApi.listAutomationRuns({}, signal)).items} />}</td></tr>)}</tbody></table></EuiPanel>}

      <EuiSpacer size="m" />
      <div className="itsmManagementSecondary" data-management-secondary="automation">
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Recent execution and failure health</h2></EuiTitle>
          {data.runs.map((run) => <div className="itsmHealthRow" key={run.id}><span><strong>{run.id}</strong><small>{run.ruleId} · {run.dryRun ? 'dry-run' : 'execution contract'} · attempts {run.attempts}</small></span><EuiProgress value={run.state === 'succeeded' ? 100 : run.state === 'partial' ? 65 : run.state === 'failed' ? 35 : 50} max={100} size="s" color={runColor(run.state)} /><EuiBadge color={runColor(run.state)}>{run.state}</EuiBadge></div>)}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Version and publication state</h2></EuiTitle>
          {data.versions.length === 0 ? <EuiCallOut title="No version history returned" color="warning">The version endpoint is unmapped or empty for this rule.</EuiCallOut> : data.versions.map((version) => <div className="itsmHealthRow" key={version.id}><span><strong>Version {version.number}</strong><small>{version.releaseNotes ?? 'No release notes'} · {version.publishedAt ?? 'Not published'}</small></span><EuiBadge color={version.publishedAt ? 'success' : 'warning'}>{version.publishedAt ? 'Published' : 'Draft'}</EuiBadge></div>)}
          {data.rules.map((item) => <div className="itsmHealthRow" key={item.id}><span><strong>{item.name}</strong><small>effective {item.publishedVersionId ?? 'none'} · revision {item.version}</small></span><EuiBadge color={item.status === 'published' ? 'success' : 'warning'}>{item.status}</EuiBadge></div>)}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Dependencies, permissions and side effects</h2></EuiTitle>
          <EuiCallOut title={`${data.capabilities.permissions.length} capability decisions`} color="primary">Adapter {data.capabilities.adapter}; authoritative {String(data.capabilities.authoritative)}. The browser does not execute connectors or compensate partial side effects.</EuiCallOut>
          <EuiSpacer size="s" />
          {rule && [rule.trigger, ...rule.nodes].map((node) => <div className="itsmHealthRow" key={node.id}><span><strong>{node.name}</strong><small>{node.type} · {JSON.stringify(node.config)}</small></span><EuiBadge color={node.type === 'approval' ? 'warning' : 'hollow'}>{node.type === 'approval' ? 'Policy gate' : 'Dependency'}</EuiBadge></div>)}
        </EuiPanel>
      </div>
    </>}
  </CapabilityShell>;
}
