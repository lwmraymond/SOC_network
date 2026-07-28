import { EuiButtonEmpty } from '@elastic/eui';
import { CapabilityShell } from '../../itsm/components/CapabilityShell';
import { automationTemplateApi } from '../../itsm/automation/api';
import { RuntimeSettings } from '../../itsm/automation/components/RuntimeSettings';
import type { AutomationRuntimeSettingsSnapshot } from '../../itsm/automation/contracts';
import { useItsmQuery } from '../../itsm/hooks';

export default function ItsmAutomationRuntimePage() {
  const query = useItsmQuery<AutomationRuntimeSettingsSnapshot>((signal) => automationTemplateApi.getRuntimeSettings(signal), []);
  return <CapabilityShell title="Automation Runtime Settings" description="Queue, concurrency, timeout, retry, dead-letter, idempotency, approval, compensation, retention and audit-correlation contracts." queryState={query.state} errorMessage={query.error?.message} management rightSideItems={[
    <EuiButtonEmpty key="automation" href="/itsm/automation">Automation overview</EuiButtonEmpty>,
    <EuiButtonEmpty key="templates" href="/itsm/automation/templates">Template library</EuiButtonEmpty>,
  ]}>
    {query.data && <RuntimeSettings snapshot={query.data} onChanged={query.refresh} />}
  </CapabilityShell>;
}
