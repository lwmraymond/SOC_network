import { useEffect, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiCallOut,
  EuiCodeBlock,
  EuiPanel,
  EuiSpacer,
  EuiTable,
  EuiTableBody,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableRow,
  EuiTableRowCell,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { createDemoMutationContext } from '../../components/demoContext';
import { automationTemplateApi } from '../api';
import type { AutomationSimulationResult, ManagedAutomationTemplate } from '../contracts';

export function SimulationPanel({ template }: { template: ManagedAutomationTemplate }) {
  const [sampleText, setSampleText] = useState(() => JSON.stringify({ ticketId: 'INC-7001', serviceId: 'svc-identity', message: 'Fixture simulation input' }, null, 2));
  const [result, setResult] = useState<AutomationSimulationResult>();
  const [error, setError] = useState<string>();
  const [running, setRunning] = useState(false);
  useEffect(() => { setResult(undefined); setError(undefined); }, [template.id]);
  const parsed = (() => { try { return JSON.parse(sampleText) as Record<string, unknown>; } catch { return undefined; } })();

  const run = async () => {
    if (!parsed) return;
    setRunning(true); setError(undefined);
    try {
      setResult(await automationTemplateApi.simulateTemplate({ templateId: template.id, versionId: template.latestVersionId, sampleInput: parsed }, createDemoMutationContext(template.etag, template.version)));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setRunning(false); }
  };

  return <div className="itsmSimulationWorkspace">
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Dry-run input</h2></EuiTitle><EuiSpacer size="s" />
      <EuiCallOut title="Simulation only / no connector executed" color="warning">The browser submits a sample contract to the configured simulation adapter. No connector, notification, approval decision or ticket mutation is executed.</EuiCallOut>
      <EuiSpacer size="m" />
      <EuiTextArea aria-label="Automation simulation sample input" rows={16} value={sampleText} onChange={(event) => setSampleText(event.target.value)} isInvalid={!parsed} />
      {!parsed && <><EuiSpacer size="s" /><EuiCallOut title="Invalid JSON" color="danger">Correct the sample input before starting the simulation.</EuiCallOut></>}
      <EuiSpacer size="m" /><EuiButton fill onClick={() => void run()} isLoading={running} isDisabled={!parsed}>Run simulation</EuiButton>
      {error && <><EuiSpacer size="m" /><EuiCallOut title="Simulation unavailable" color="danger">{error}</EuiCallOut></>}
    </EuiPanel>
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Simulation trace</h2></EuiTitle><EuiSpacer size="s" />
      {!result && <EuiCallOut title="No simulation result">Provide sample input and run the simulation to inspect step outcomes, approval gates, expected receipts and side-effect warnings.</EuiCallOut>}
      {result && <>
        <EuiCallOut title="Non-authoritative simulation result" color="warning">connectorExecuted: {String(result.connectorExecuted)} · authoritative: {String(result.authoritative)} · {result.id}</EuiCallOut>
        <EuiSpacer size="m" />
        <EuiTable aria-label="Automation simulation step trace">
          <EuiTableHeader><EuiTableHeaderCell>#</EuiTableHeaderCell><EuiTableHeaderCell>Step</EuiTableHeaderCell><EuiTableHeaderCell>Result</EuiTableHeaderCell><EuiTableHeaderCell>Condition / approval</EuiTableHeaderCell><EuiTableHeaderCell>Expected receipt</EuiTableHeaderCell><EuiTableHeaderCell>Warning</EuiTableHeaderCell></EuiTableHeader>
          <EuiTableBody>{result.steps.map((step) => <EuiTableRow key={step.nodeId}><EuiTableRowCell>{step.sequence}</EuiTableRowCell><EuiTableRowCell><strong>{step.name}</strong><small>{step.nodeType} · {step.nodeId}</small></EuiTableRowCell><EuiTableRowCell><EuiBadge color={step.state === 'warning' || step.state === 'blocked' ? 'warning' : step.state === 'waiting' ? 'primary' : 'success'}>{step.state}</EuiBadge></EuiTableRowCell><EuiTableRowCell>{step.conditionResult === undefined ? step.approvalGate ?? '—' : String(step.conditionResult)}</EuiTableRowCell><EuiTableRowCell>{step.expectedReceipt ?? 'None'}</EuiTableRowCell><EuiTableRowCell>{step.warning ?? '—'}</EuiTableRowCell></EuiTableRow>)}</EuiTableBody>
        </EuiTable>
        <EuiSpacer size="m" /><EuiTitle size="xs"><h3>Expected contract</h3></EuiTitle><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ expectedReceipts: result.expectedReceipts, warnings: result.warnings, sampleInput: result.sampleInput }, null, 2)}</EuiCodeBlock>
      </>}
    </EuiPanel>
  </div>;
}
