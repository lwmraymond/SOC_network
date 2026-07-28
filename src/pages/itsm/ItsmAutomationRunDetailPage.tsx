import { EuiButtonEmpty } from '@elastic/eui';
import { useParams } from 'react-router-dom';
import { CapabilityShell } from '../../itsm/components/CapabilityShell';
import { automationTemplateApi } from '../../itsm/automation/api';
import { RunDetail } from '../../itsm/automation/components/RunDetail';
import type { ManagedAutomationRun } from '../../itsm/automation/contracts';
import { useItsmQuery } from '../../itsm/hooks';

export default function ItsmAutomationRunDetailPage() {
  const { runId = '' } = useParams();
  const query = useItsmQuery<ManagedAutomationRun>((signal) => automationTemplateApi.getRun(runId, signal), [runId]);
  return <CapabilityShell title={query.data?.id ?? 'Automation run'} description="Template/version, trigger source, live or dry-run contract, attempts, duration, failure classification, audit correlation and step trace." queryState={query.state} errorMessage={query.error?.message} management rightSideItems={[
    <EuiButtonEmpty key="runs" href="/itsm/automation?section=Execution%20runs">Back to execution runs</EuiButtonEmpty>,
    <EuiButtonEmpty key="templates" href="/itsm/automation/templates">Template library</EuiButtonEmpty>,
  ]}>
    {query.data && <RunDetail run={query.data} onChanged={query.refresh} />}
  </CapabilityShell>;
}
