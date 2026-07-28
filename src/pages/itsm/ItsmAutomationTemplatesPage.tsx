import { useMemo } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiPanel,
  EuiSpacer,
  EuiTable,
  EuiTableBody,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableRow,
  EuiTableRowCell,
} from '@elastic/eui';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CapabilityShell } from '../../itsm/components/CapabilityShell';
import { ItsmTabs } from '../../itsm/components/ItsmTabs';
import { automationTemplateApi } from '../../itsm/automation/api';
import { RunDetail } from '../../itsm/automation/components/RunDetail';
import { SchemaEditor } from '../../itsm/automation/components/SchemaEditor';
import { SimulationPanel } from '../../itsm/automation/components/SimulationPanel';
import { TemplateEditor } from '../../itsm/automation/components/TemplateEditor';
import { TemplateLibrary } from '../../itsm/automation/components/TemplateLibrary';
import { VersionPanel } from '../../itsm/automation/components/VersionPanel';
import { WorkflowGraph } from '../../itsm/automation/components/WorkflowGraph';
import type { AutomationTemplateVersion, ManagedAutomationRun, ManagedAutomationTemplate } from '../../itsm/automation/contracts';
import { formatDuration, runStateColor } from '../../itsm/automation/model';
import { useItsmQuery } from '../../itsm/hooks';

type TemplatePageData = {
  templates: ManagedAutomationTemplate[];
  template?: ManagedAutomationTemplate;
  versions: AutomationTemplateVersion[];
  runs: ManagedAutomationRun[];
};

const detailTabs = ['Metadata','Schema','Workflow','Versions','Simulation','Runs'];

export default function ItsmAutomationTemplatesPage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const section = detailTabs.includes(params.get('section') ?? '') ? params.get('section') as string : 'Metadata';
  const query = useItsmQuery<TemplatePageData>(async (signal) => {
    const templates = await automationTemplateApi.listTemplates({ limit: 200, sort: [{ field: 'updatedAt', direction: 'desc' }] }, signal);
    if (!templateId) return { templates: templates.items, versions: [], runs: [] };
    const [template, versions, runs] = await Promise.all([
      automationTemplateApi.getTemplate(templateId, signal),
      automationTemplateApi.listTemplateVersions(templateId, { limit: 100, sort: [{ field: 'number', direction: 'desc' }] }, signal),
      automationTemplateApi.listRuns({ filters: { templateId }, limit: 100, sort: [{ field: 'startedAt', direction: 'desc' }] }, signal),
    ]);
    return { templates: templates.items, template, versions: versions.items, runs: runs.items };
  }, [templateId ?? 'library']);
  const data = query.data;
  const selectedRun = useMemo(() => data?.runs.find((run) => run.id === params.get('runId')), [data?.runs, params]);
  const setSection = (next: string) => {
    const updated = new URLSearchParams(params);
    updated.set('section', next);
    updated.delete('runId');
    setParams(updated);
  };

  const title = templateId ? data?.template?.name ?? 'Automation template' : 'Automation Template Library';
  const description = templateId
    ? 'Metadata, typed schema, workflow graph, version lifecycle, simulation and template-scoped runs.'
    : 'Search, govern and version reusable ITSM automation templates without duplicating the broader P34 playbook surface.';

  return <CapabilityShell title={title} description={description} queryState={query.state} errorMessage={query.error?.message} management rightSideItems={[
    <EuiButtonEmpty key="automation" href="/itsm/automation">Automation overview</EuiButtonEmpty>,
    <EuiButtonEmpty key="runtime" href="/itsm/automation/runtime">Runtime settings</EuiButtonEmpty>,
    <EuiButtonEmpty key="p34" href="/knowledge/playbooks">P34 playbooks</EuiButtonEmpty>,
  ]}>
    {data && !templateId && <TemplateLibrary templates={data.templates} onOpen={(id) => navigate(`/itsm/automation/templates/${encodeURIComponent(id)}`)} onMutated={query.refresh} />}
    {data?.template && <>
      <EuiPanel paddingSize="none" hasBorder><ItsmTabs items={detailTabs} active={section} onChange={setSection} /></EuiPanel>
      <EuiSpacer size="m" />
      {section === 'Metadata' && <TemplateEditor template={data.template} onChanged={query.refresh} />}
      {section === 'Schema' && <SchemaEditor template={data.template} onChanged={query.refresh} />}
      {section === 'Workflow' && <WorkflowGraph template={data.template} onChanged={query.refresh} />}
      {section === 'Versions' && <VersionPanel template={data.template} versions={data.versions} onChanged={query.refresh} />}
      {section === 'Simulation' && <SimulationPanel template={data.template} />}
      {section === 'Runs' && <>
        {selectedRun ? <RunDetail run={selectedRun} onChanged={query.refresh} /> : <EuiPanel paddingSize="none" hasBorder>
          <EuiTable aria-label="Template execution runs">
            <EuiTableHeader><EuiTableHeaderCell>Run</EuiTableHeaderCell><EuiTableHeaderCell>Template / version</EuiTableHeaderCell><EuiTableHeaderCell>Trigger</EuiTableHeaderCell><EuiTableHeaderCell>Mode</EuiTableHeaderCell><EuiTableHeaderCell>State</EuiTableHeaderCell><EuiTableHeaderCell>Attempt</EuiTableHeaderCell><EuiTableHeaderCell>Duration</EuiTableHeaderCell><EuiTableHeaderCell>Audit</EuiTableHeaderCell></EuiTableHeader>
            <EuiTableBody>{data.runs.map((run) => <EuiTableRow key={run.id}><EuiTableRowCell><EuiButtonEmpty size="xs" onClick={() => { const updated = new URLSearchParams(params); updated.set('runId', run.id); setParams(updated); }}>{run.id}</EuiButtonEmpty></EuiTableRowCell><EuiTableRowCell>{run.templateName ?? run.templateId ?? data.template?.name}<small>{run.templateVersionId ?? run.versionId}</small></EuiTableRowCell><EuiTableRowCell>{run.triggerSource ?? 'TBD'}</EuiTableRowCell><EuiTableRowCell><EuiBadge color={run.contractMode === 'dry_run' ? 'warning' : 'hollow'}>{run.contractMode}</EuiBadge></EuiTableRowCell><EuiTableRowCell><EuiBadge color={runStateColor(run.state)}>{run.state}</EuiBadge><small>{run.failure?.kind}</small></EuiTableRowCell><EuiTableRowCell>{run.attempts}</EuiTableRowCell><EuiTableRowCell>{formatDuration(run.durationMs)}</EuiTableRowCell><EuiTableRowCell>{run.auditCorrelationId}</EuiTableRowCell></EuiTableRow>)}</EuiTableBody>
          </EuiTable>
        </EuiPanel>}
      </>}
    </>}
  </CapabilityShell>;
}
