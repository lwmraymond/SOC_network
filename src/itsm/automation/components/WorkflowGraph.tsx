import { useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiCallOut,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSteps,
  EuiSwitch,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { GovernedAction } from '../../components/GovernedAction';
import { createDemoMutationContext } from '../../components/demoContext';
import { automationTemplateApi } from '../api';
import type { AutomationCompensationPolicy, AutomationNodeType, AutomationSideEffectClass, ManagedAutomationNode, ManagedAutomationTemplate } from '../contracts';

const nodeTypes: AutomationNodeType[] = ['trigger','condition','action','approval','wait','notification'];
const sideEffects: AutomationSideEffectClass[] = ['none','read','reversible_write','irreversible_write','external_notification'];
const compensationPolicies: AutomationCompensationPolicy[] = ['none','best_effort','required','manual'];

export function WorkflowGraph({ template, onChanged }: { template: ManagedAutomationTemplate; onChanged: (template: ManagedAutomationTemplate) => void }) {
  const [nodes, setNodes] = useState(template.workflow);
  const [selectedId, setSelectedId] = useState(template.workflow[0]?.id ?? '');
  const [configurationText, setConfigurationText] = useState('{}');
  useEffect(() => { setNodes(template.workflow); setSelectedId(template.workflow[0]?.id ?? ''); }, [template]);
  const selected = useMemo(() => nodes.find((node) => node.id === selectedId) ?? nodes[0], [nodes, selectedId]);
  useEffect(() => { setConfigurationText(JSON.stringify(selected?.configuration ?? {}, null, 2)); }, [selected]);

  const updateSelected = (patch: Partial<ManagedAutomationNode>) => {
    if (!selected) return;
    setNodes((current) => current.map((node) => node.id === selected.id ? { ...node, ...patch } : node));
  };
  const updateConfiguration = (text: string) => {
    setConfigurationText(text);
    try { updateSelected({ configuration: JSON.parse(text) as Record<string, unknown> }); } catch { /* Keep invalid draft text visible; validation appears below. */ }
  };
  const configValid = (() => { try { JSON.parse(configurationText); return true; } catch { return false; } })();
  const editable = template.status === 'draft' || template.status === 'validating';
  const action = { action: 'save_workflow' as const, templateId: template.id, workflow: nodes };

  return <>
    <EuiCallOut title="Stable workflow editor">The graph is an ordered EUI step model with a typed inspector. It does not call connectors, execute actions or provide browser-side drag-and-drop.</EuiCallOut>
    <EuiSpacer size="m" />
    <div className="itsmWorkflowWorkspace">
      <EuiPanel paddingSize="m" hasBorder className="itsmWorkflowGraph">
        <EuiFlexGroup alignItems="center" gutterSize="s"><EuiFlexItem><EuiTitle size="s"><h2>Workflow graph</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{nodes.length} nodes</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiSteps steps={nodes.map((node) => ({
          title: node.name,
          status: selected?.id === node.id ? 'current' as const : 'incomplete' as const,
          children: <button type="button" className={`itsmWorkflowNode ${selected?.id === node.id ? 'selected' : ''}`} onClick={() => setSelectedId(node.id)}>
            <EuiBadge color="hollow">{node.type}</EuiBadge>
            <span>{node.capability ?? 'No capability declared'}</span>
            <small>timeout {node.timeoutMs ?? 0} ms · retry {node.retry.maxAttempts} · {node.sideEffectClass} · compensation {node.compensationPolicy}</small>
          </button>,
        }))} />
      </EuiPanel>
      {selected && <EuiPanel paddingSize="m" hasBorder className="itsmWorkflowInspector">
        <EuiFlexGroup alignItems="center" gutterSize="s" wrap><EuiFlexItem><EuiTitle size="s"><h2>Node inspector</h2></EuiTitle><small>{selected.name}</small></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="primary">{selected.type}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <EuiSpacer size="s" />
        <div className="itsmFormGrid itsmWorkflowInspectorGrid">
          <EuiFormRow label="Node ID"><EuiFieldText compressed value={selected.id} readOnly /></EuiFormRow>
          <EuiFormRow label="Node type"><EuiSelect compressed disabled={!editable} value={selected.type} onChange={(event) => updateSelected({ type: event.target.value as AutomationNodeType })} options={nodeTypes.map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiFormRow label="Name"><EuiFieldText compressed disabled={!editable} value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} /></EuiFormRow>
          <EuiFormRow label="Capability"><EuiFieldText compressed disabled={!editable} value={selected.capability ?? ''} placeholder="TBD capability" onChange={(event) => updateSelected({ capability: event.target.value || undefined })} /></EuiFormRow>
          <EuiFormRow label="Timeout (ms)"><EuiFieldNumber compressed disabled={!editable} min={0} value={selected.timeoutMs ?? 0} onChange={(event) => updateSelected({ timeoutMs: Number(event.target.value) || 0 })} /></EuiFormRow>
          <EuiFormRow label="Retry attempts"><EuiFieldNumber compressed disabled={!editable} min={1} value={selected.retry.maxAttempts} onChange={(event) => updateSelected({ retry: { ...selected.retry, maxAttempts: Math.max(1, Number(event.target.value) || 1) } })} /></EuiFormRow>
          <EuiFormRow label="Backoff"><EuiSelect compressed disabled={!editable} value={selected.retry.backoff} onChange={(event) => updateSelected({ retry: { ...selected.retry, backoff: event.target.value as ManagedAutomationNode['retry']['backoff'] } })} options={['none','fixed','exponential'].map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiFormRow label="Initial delay (ms)"><EuiFieldNumber compressed disabled={!editable} min={0} value={selected.retry.initialDelayMs ?? 0} onChange={(event) => updateSelected({ retry: { ...selected.retry, initialDelayMs: Number(event.target.value) || undefined } })} /></EuiFormRow>
          <EuiFormRow label="Maximum delay (ms)"><EuiFieldNumber compressed disabled={!editable} min={0} value={selected.retry.maxDelayMs ?? 0} onChange={(event) => updateSelected({ retry: { ...selected.retry, maxDelayMs: Number(event.target.value) || undefined } })} /></EuiFormRow>
          <EuiFormRow label="Side-effect class"><EuiSelect compressed disabled={!editable} value={selected.sideEffectClass} onChange={(event) => updateSelected({ sideEffectClass: event.target.value as AutomationSideEffectClass })} options={sideEffects.map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiFormRow label="Compensation"><EuiSelect compressed disabled={!editable} value={selected.compensationPolicy} onChange={(event) => updateSelected({ compensationPolicy: event.target.value as AutomationCompensationPolicy })} options={compensationPolicies.map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiFormRow label="Approval timeout (s)"><EuiFieldNumber compressed disabled={!editable || selected.type !== 'approval'} min={0} value={selected.approvalTimeoutSeconds ?? 0} onChange={(event) => updateSelected({ approvalTimeoutSeconds: Number(event.target.value) || undefined })} /></EuiFormRow>
          <EuiFormRow label="Idempotency window (s)"><EuiFieldNumber compressed disabled={!editable} min={0} value={selected.idempotency.windowSeconds ?? 0} onChange={(event) => updateSelected({ idempotency: { ...selected.idempotency, windowSeconds: Number(event.target.value) || undefined } })} /></EuiFormRow>
        </div>
        <EuiSwitch label="Idempotency key required" disabled={!editable} checked={selected.idempotency.required} onChange={(event) => updateSelected({ idempotency: { ...selected.idempotency, required: event.target.checked } })} />
        <EuiSpacer size="s" />
        <EuiFormRow label="Idempotency key expression"><EuiFieldText compressed disabled={!editable} value={selected.idempotency.keyExpression ?? ''} onChange={(event) => updateSelected({ idempotency: { ...selected.idempotency, keyExpression: event.target.value || undefined } })} /></EuiFormRow>
        <EuiFormRow label="Configuration JSON" isInvalid={!configValid} error={!configValid ? 'Configuration must be valid JSON before the workflow can be saved.' : undefined}><EuiTextArea disabled={!editable} rows={6} value={configurationText} onChange={(event) => updateConfiguration(event.target.value)} /></EuiFormRow>
      </EuiPanel>}
    </div>
    <EuiSpacer size="m" />
    <GovernedAction label="Review workflow draft" fill isDisabled={!editable || !configValid} preview={(signal) => automationTemplateApi.previewTemplateAction(action, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction(action, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} />
  </>;
}
