import { useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';

export type ItsmTicketType = 'Incident' | 'Request' | 'Change' | 'Problem';

type TicketDraft = {
  type: ItsmTicketType;
  title: string;
  description: string;
  requester: string;
  service: string;
  assignmentGroup: string;
  impact: string;
  urgency: string;
};

const blankDraft = (type: ItsmTicketType): TicketDraft => ({
  type,
  title: '',
  description: '',
  requester: 'SOC Operations',
  service: 'Identity',
  assignmentGroup: '',
  impact: 'Multiple users',
  urgency: 'High',
});

const stages = ['Draft', 'Preflight', 'Governed preview'];

export function ItsmCreateTicketModal({
  open,
  onClose,
  initialType = 'Incident',
  onCreated,
}: {
  open: boolean;
  onClose(): void;
  initialType?: ItsmTicketType;
  onCreated(receipt: string): void;
}) {
  const [stage, setStage] = useState(0);
  const [draft, setDraft] = useState<TicketDraft>(() => blankDraft(initialType));

  useEffect(() => {
    if (open) {
      setStage(0);
      setDraft(blankDraft(initialType));
    }
  }, [initialType, open]);

  const checks = useMemo(() => [
    { label: 'Title is present', passed: draft.title.trim().length >= 8 },
    { label: 'Description contains operational context', passed: draft.description.trim().length >= 24 },
    { label: 'Requester identity is present', passed: Boolean(draft.requester.trim()) },
    { label: 'Assignment group is selected', passed: Boolean(draft.assignmentGroup) },
    { label: 'Service, impact and urgency are classified', passed: Boolean(draft.service && draft.impact && draft.urgency) },
  ], [draft]);
  const ready = checks.every((check) => check.passed);

  if (!open) return null;

  const update = <Key extends keyof TicketDraft>(key: Key, value: TicketDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const finish = () => {
    const id = `${draft.type.slice(0, 3).toUpperCase()}-PREVIEW-${Date.now().toString(36).toUpperCase()}`;
    onCreated(`${id} passed local validation and policy preview. No production ITSM object was created.`);
    onClose();
  };

  return (
    <EuiModal className="itsmCreateTicketModal" maxWidth={980} onClose={onClose} aria-labelledby="itsm-create-ticket-title">
      <EuiModalHeader>
        <EuiModalHeaderTitle id="itsm-create-ticket-title">Create ticket</EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <div className="itsmCreateStages" aria-label="Ticket creation progress">
          {stages.map((label, index) => (
            <div key={label} className={index === stage ? 'isCurrent' : index < stage ? 'isComplete' : ''}>
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
        <EuiSpacer size="m" />

        {stage === 0 && (
          <div className="itsmCreateDraft">
            <EuiPanel paddingSize="m" hasBorder>
              <EuiTitle size="s"><h2>Ticket identity and routing</h2></EuiTitle>
              <EuiText size="xs" color="subdued"><p>Start with a typed template so lifecycle, SLA and required fields remain explicit.</p></EuiText>
              <EuiSpacer size="m" />
              <div className="itsmCreateFormGrid">
                <EuiFormRow label="Ticket type">
                  <EuiSelect value={draft.type} onChange={(event) => update('type', event.target.value as ItsmTicketType)} options={(['Incident', 'Request', 'Change', 'Problem'] as ItsmTicketType[]).map((value) => ({ value, text: value }))} />
                </EuiFormRow>
                <EuiFormRow label="Requester">
                  <EuiFieldText value={draft.requester} onChange={(event) => update('requester', event.target.value)} />
                </EuiFormRow>
                <EuiFormRow label="Service">
                  <EuiSelect value={draft.service} onChange={(event) => update('service', event.target.value)} options={['Identity', 'Endpoint', 'Customer API', 'Network'].map((value) => ({ value, text: value }))} />
                </EuiFormRow>
                <EuiFormRow label="Assignment group">
                  <EuiSelect value={draft.assignmentGroup} onChange={(event) => update('assignmentGroup', event.target.value)} options={[{ value: '', text: 'Select group…' }, ...['Service desk', 'Major incident', 'Identity ops', 'Network ops', 'CAB', 'Problem management'].map((value) => ({ value, text: value }))]} />
                </EuiFormRow>
                <EuiFormRow className="itsmCreateWide" label="Title" helpText="Use a concise observable symptom and affected service.">
                  <EuiFieldText value={draft.title} maxLength={180} placeholder="Network authentication failures affecting branch users" onChange={(event) => update('title', event.target.value)} />
                </EuiFormRow>
                <EuiFormRow className="itsmCreateWide" label="Description">
                  <EuiTextArea rows={6} value={draft.description} placeholder="Symptoms, scope, evidence, business impact, and requested outcome" onChange={(event) => update('description', event.target.value)} />
                </EuiFormRow>
                <EuiFormRow label="Impact">
                  <EuiSelect value={draft.impact} onChange={(event) => update('impact', event.target.value)} options={['Single user', 'Multiple users', 'Business service', 'Enterprise'].map((value) => ({ value, text: value }))} />
                </EuiFormRow>
                <EuiFormRow label="Urgency">
                  <EuiSelect value={draft.urgency} onChange={(event) => update('urgency', event.target.value)} options={['Low', 'Medium', 'High', 'Critical'].map((value) => ({ value, text: value }))} />
                </EuiFormRow>
              </div>
            </EuiPanel>
            <EuiPanel paddingSize="m" hasBorder>
              <EuiTitle size="s"><h2>Template contract</h2></EuiTitle>
              <EuiSpacer size="s" />
              <dl className="itsmCreateDefinitionList">
                <div><dt>Lifecycle</dt><dd>{draft.type} state model</dd></div>
                <div><dt>SLA policy</dt><dd>{draft.urgency} urgency · {draft.impact}</dd></div>
                <div><dt>Write boundary</dt><dd>BFF validation and governed preview</dd></div>
                <div><dt>Provider</dt><dd>Resolved server-side; never called by the browser</dd></div>
              </dl>
            </EuiPanel>
          </div>
        )}

        {stage === 1 && (
          <div className="itsmCreateReviewGrid">
            <EuiPanel paddingSize="m" hasBorder>
              <EuiTitle size="s"><h2>Preflight checks</h2></EuiTitle>
              <EuiSpacer size="s" />
              <div className="itsmPreflightList">
                {checks.map((check) => <div key={check.label}><EuiBadge color={check.passed ? 'success' : 'warning'}>{check.passed ? 'Passed' : 'Required'}</EuiBadge><span>{check.label}</span></div>)}
              </div>
            </EuiPanel>
            <EuiPanel paddingSize="m" hasBorder>
              <EuiTitle size="s"><h2>Draft summary</h2></EuiTitle>
              <EuiSpacer size="s" />
              <dl className="itsmCreateDefinitionList">
                <div><dt>Type</dt><dd>{draft.type}</dd></div>
                <div><dt>Service</dt><dd>{draft.service}</dd></div>
                <div><dt>Requester</dt><dd>{draft.requester || 'Missing'}</dd></div>
                <div><dt>Assignment</dt><dd>{draft.assignmentGroup || 'Missing'}</dd></div>
                <div><dt>Priority inputs</dt><dd>{draft.impact} · {draft.urgency}</dd></div>
              </dl>
            </EuiPanel>
          </div>
        )}

        {stage === 2 && (
          <div className="itsmCreateGovernedPreview">
            <EuiCallOut title="Governed write preview" color="warning">
              This review shows the intended object and policy boundary. The prototype creates a receipt only; it cannot mutate a production provider.
            </EuiCallOut>
            <EuiSpacer size="m" />
            <EuiPanel paddingSize="m" hasBorder>
              <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart" responsive={false}>
                <EuiFlexItem><EuiBadge color="primary">{draft.type}</EuiBadge><EuiTitle size="s"><h2>{draft.title}</h2></EuiTitle><EuiText size="s"><p>{draft.description}</p></EuiText></EuiFlexItem>
                <EuiFlexItem grow={false}><EuiBadge color="success">Preflight passed</EuiBadge></EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="m" />
              <dl className="itsmCreateDefinitionList itsmCreateDefinitionListColumns">
                <div><dt>Requester</dt><dd>{draft.requester}</dd></div>
                <div><dt>Service</dt><dd>{draft.service}</dd></div>
                <div><dt>Assignment group</dt><dd>{draft.assignmentGroup}</dd></div>
                <div><dt>Impact / urgency</dt><dd>{draft.impact} / {draft.urgency}</dd></div>
                <div><dt>Approval</dt><dd>Required before provider commit</dd></div>
                <div><dt>Evidence</dt><dd>Attached after authoritative rehydration</dd></div>
              </dl>
            </EuiPanel>
          </div>
        )}
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        {stage > 0 && <EuiButtonEmpty onClick={() => setStage((current) => current - 1)}>Back</EuiButtonEmpty>}
        {stage < 2 && <EuiButton fill isDisabled={stage === 1 && !ready} onClick={() => setStage((current) => current + 1)}>{stage === 0 ? 'Run preflight' : 'Open governed preview'}</EuiButton>}
        {stage === 2 && <EuiButton fill onClick={finish}>Create preview receipt</EuiButton>}
      </EuiModalFooter>
    </EuiModal>
  );
}
