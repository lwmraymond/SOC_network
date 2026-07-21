import type { PrototypeRow } from '../../../types/prototype';

export type ActionRisk = 'Low' | 'Medium' | 'High' | 'Destructive';
export type ApprovalState = 'Not required' | 'Pending' | 'Approved' | 'Declined' | 'Expired';
export type ExecutionState = 'Draft' | 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Partial' | 'Cancelled' | 'Rollback pending';

export type GovernedAction = PrototypeRow & {
  actionType: string;
  target: string;
  requester: string;
  approver: string;
  caseRef: string;
  risk: ActionRisk;
  approval: ApprovalState;
  execution: ExecutionState;
  authoritativeStatus: string;
  adapter: string;
  receipt: string;
  rollback: string;
  expires: string;
};

export const approvalStates: ApprovalState[] = ['Pending', 'Approved', 'Not required', 'Declined', 'Expired'];
export const executionStates: ExecutionState[] = ['Queued', 'Running', 'Failed', 'Partial', 'Completed', 'Rollback pending', 'Draft', 'Cancelled'];
export const risks: ActionRisk[] = ['Destructive', 'High', 'Medium', 'Low'];
export const detailTabs = ['Governance', 'Execution attempts', 'Receipts', 'Rollback'];

const actionTypes = ['Isolate endpoint', 'Disable identity', 'Block destination', 'Collect triage', 'Rollback isolation'];
const adapters = ['Endpoint response', 'Identity control', 'Network enforcement', 'Evidence collector'];
const text = (value: unknown, fallback: string) => value === undefined || value === null || value === '' ? fallback : String(value);

export function actionRows(rows: PrototypeRow[]): GovernedAction[] {
  return rows.slice(0, 10).map((row, index) => ({
    ...row,
    actionType: text(row.action_type, actionTypes[index % actionTypes.length]),
    target: text(row.target, `asset-${String(index + 21).padStart(3, '0')}`),
    requester: text(row.requester, ['SOC Tier 2', 'Detection playbook', 'Case owner'][index % 3]),
    approver: ['Duty manager', 'Identity owner', 'Network approver', 'Not required'][index % 4],
    caseRef: text(row.case_ref, `CASE-${String(4100 + index)}`),
    risk: risks[index % risks.length],
    approval: approvalStates[index % approvalStates.length],
    execution: executionStates[index % executionStates.length],
    authoritativeStatus: text(row.authoritative_status, index % 3 === 0 ? 'Awaiting external confirmation' : index % 3 === 1 ? 'Observed by adapter' : 'No final state yet'),
    adapter: adapters[index % adapters.length],
    receipt: `rcpt-${String(7600 + index)}`,
    rollback: index % 3 === 0 ? 'Available for 25m' : index % 3 === 1 ? 'Not supported' : 'Requires change approval',
    expires: `2026-07-18 ${String(14 + (index % 5)).padStart(2, '0')}:30 +08`,
  }));
}

export const badgeColorForRisk = (risk: ActionRisk): 'danger' | 'warning' | 'hollow' => risk === 'Destructive' ? 'danger' : risk === 'High' ? 'warning' : 'hollow';
export const badgeColorForExecution = (state: ExecutionState): 'success' | 'danger' | 'warning' | 'hollow' => state === 'Completed' ? 'success' : state === 'Failed' || state === 'Partial' ? 'danger' : state === 'Running' || state === 'Rollback pending' ? 'warning' : 'hollow';
