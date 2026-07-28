import {
  EuiBadge,
  EuiCallOut,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiTable,
  EuiTableBody,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableRow,
  EuiTableRowCell,
  EuiTitle,
} from '@elastic/eui';
import { GovernedAction } from '../../components/GovernedAction';
import { createDemoMutationContext } from '../../components/demoContext';
import { automationTemplateApi } from '../api';
import type { ManagedAutomationRun } from '../contracts';
import { formatDuration, runStateColor } from '../model';

export function RunDetail({ run, onChanged }: { run: ManagedAutomationRun; onChanged: () => void }) {
  const retryPreview = async () => ({
    operation: 'automation.run.retry',
    summary: `Retry ${run.id}`,
    affectedResources: [{ type: 'automation-run', id: run.id, effect: 'new attempt' }],
    permissions: [{ capability: 'automation.run.retry', decision: 'conditional' as const, obligations: ['impact_preview', 'idempotency_key'] }],
    validation: [],
    warnings: ['Retry may repeat external side effects. Review issued receipts, idempotency windows and compensation state before confirmation.'],
    authoritative: false as const,
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
  });
  const cancelPreview = async () => ({
    operation: 'automation.run.cancel',
    summary: `Cancel ${run.id}`,
    affectedResources: [{ type: 'automation-run', id: run.id, effect: 'cancellation request' }],
    permissions: [{ capability: 'automation.run.cancel', decision: 'conditional' as const, obligations: ['impact_preview'] }],
    validation: run.state === 'queued' || run.state === 'running' ? [] : [{ field: 'state', code: 'RUN_NOT_ACTIVE', message: `Run state ${run.state} cannot be cancelled.`, severity: 'error' as const }],
    warnings: ['Cancellation cannot undo already completed side effects. Compensation remains a separate executor responsibility.'],
    authoritative: false as const,
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
  });

  return <>
    <div className="itsmAutomationRunSummary">
      <EuiPanel paddingSize="m" hasBorder>
        <EuiFlexGroup alignItems="center" gutterSize="s"><EuiFlexItem><EuiTitle size="s"><h2>{run.id}</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={runStateColor(run.state)}>{run.state}</EuiBadge></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={run.contractMode === 'dry_run' ? 'warning' : 'hollow'}>{run.contractMode}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <EuiSpacer size="m" />
        <dl className="itsmDefinitionGrid">
          <div><dt>Template</dt><dd>{run.templateName ?? run.templateId ?? 'TBD'}</dd></div><div><dt>Template version</dt><dd>{run.templateVersionId ?? run.versionId}</dd></div>
          <div><dt>Rule</dt><dd>{run.ruleId}</dd></div><div><dt>Trigger source</dt><dd>{run.triggerSource ?? 'TBD'}</dd></div>
          <div><dt>Ticket</dt><dd>{run.ticketId ?? '—'}</dd></div><div><dt>Attempts</dt><dd>{run.attempts}</dd></div>
          <div><dt>Duration</dt><dd>{formatDuration(run.durationMs)}</dd></div><div><dt>Audit correlation</dt><dd>{run.auditCorrelationId}</dd></div>
          <div><dt>Started</dt><dd>{run.startedAt ?? '—'}</dd></div><div><dt>Completed</dt><dd>{run.completedAt ?? '—'}</dd></div>
        </dl>
      </EuiPanel>
      <EuiPanel paddingSize="m" hasBorder>
        <EuiTitle size="s"><h2>Failure and governed actions</h2></EuiTitle><EuiSpacer size="s" />
        {run.failure ? <EuiCallOut title={run.failure.kind} color="danger">{run.failure.message}</EuiCallOut> : <EuiCallOut title="No classified failure" color="success">The run contract has no failure object.</EuiCallOut>}
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" wrap>
          <EuiFlexItem grow={false}><GovernedAction label="Retry" color="warning" isDisabled={run.state !== 'failed' && run.state !== 'partial'} preview={retryPreview} execute={async (signal) => ({ receipt: await automationTemplateApi.retryRun(run.id, createDemoMutationContext(run.etag, run.version), signal) })} rehydrate={async (_receipt, signal) => automationTemplateApi.getRun(run.id, signal)} onComplete={onChanged} /></EuiFlexItem>
          <EuiFlexItem grow={false}><GovernedAction label="Cancel" color="danger" isDisabled={run.state !== 'queued' && run.state !== 'running'} preview={cancelPreview} execute={async (signal) => ({ receipt: await automationTemplateApi.cancelRun(run.id, createDemoMutationContext(run.etag, run.version), signal) })} rehydrate={async (_receipt, signal) => automationTemplateApi.getRun(run.id, signal)} onComplete={onChanged} /></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ failure: run.failure, auditCorrelationId: run.auditCorrelationId }, null, 2)}</EuiCodeBlock>
      </EuiPanel>
    </div>
    <EuiSpacer size="m" />
    <EuiPanel paddingSize="none" hasBorder>
      <EuiTable aria-label="Automation run step trace">
        <EuiTableHeader><EuiTableHeaderCell>#</EuiTableHeaderCell><EuiTableHeaderCell>Step</EuiTableHeaderCell><EuiTableHeaderCell>State</EuiTableHeaderCell><EuiTableHeaderCell>Attempt</EuiTableHeaderCell><EuiTableHeaderCell>Duration</EuiTableHeaderCell><EuiTableHeaderCell>Receipt</EuiTableHeaderCell><EuiTableHeaderCell>Failure</EuiTableHeaderCell></EuiTableHeader>
        <EuiTableBody>{run.steps.map((step) => <EuiTableRow key={`${step.sequence}-${step.nodeId}`}><EuiTableRowCell>{step.sequence}</EuiTableRowCell><EuiTableRowCell><strong>{step.name}</strong><small>{step.nodeType} · {step.nodeId}</small></EuiTableRowCell><EuiTableRowCell><EuiBadge color={step.state === 'succeeded' ? 'success' : step.state === 'failed' || step.state === 'partial' ? 'danger' : step.state === 'running' ? 'primary' : 'warning'}>{step.state}</EuiBadge></EuiTableRowCell><EuiTableRowCell>{step.attempt}</EuiTableRowCell><EuiTableRowCell>{formatDuration(step.durationMs)}</EuiTableRowCell><EuiTableRowCell>{step.receiptId ?? step.expectedReceipt ?? '—'}</EuiTableRowCell><EuiTableRowCell>{step.failure?.message ?? '—'}</EuiTableRowCell></EuiTableRow>)}</EuiTableBody>
      </EuiTable>
    </EuiPanel>
  </>;
}
