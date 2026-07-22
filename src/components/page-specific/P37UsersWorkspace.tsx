import { useMemo, useRef, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiStat,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P37UsersWorkspace.css';

type User = { key: string; id: string; name: string; principal: string; provider: string; status: string; mfa: string; roles: string[]; sessions: number; lastSignIn: string; manager: string; risk: string; binding: string };
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const buildUsers = (rows: PrototypeRow[]): User[] => rows.slice(0, 16).map((row, index) => ({
  key: `${row.id}:${index}`,
  id: text(row.user_id, `USR-${1000 + index}`),
  name: text(row.display_name, ['Avery Chen','Mina Patel','Jordan Kim','Riley Lin'][index % 4]),
  principal: text(row.email, `user${index + 1}@example.internal`),
  provider: text(row.provider, ['Native','SAML','OIDC','LDAP'][index % 4]),
  status: text(row.status, index % 6 === 0 ? 'Locked' : index % 5 === 0 ? 'Disabled' : 'Active'),
  mfa: text(row.mfa_state, index % 4 === 0 ? 'Gap' : 'Compliant'),
  roles: ['soc_analyst', index % 3 === 0 ? 'privileged_response' : 'case_reader'],
  sessions: index % 5,
  risk: index % 4 === 0 ? 'High' : 'Normal',
  lastSignIn: text(row.last_signin_at, `${index + 1}h ago`),
  manager: text(row.manager, 'Security Operations'),
  binding: text(row.provider_subject, `subject-${index + 1}`),
}));

export function P37UsersWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Attention first');
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [action, setAction] = useState('Disable user');
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const detailOpener = useRef<HTMLButtonElement | null>(null);
  const users = useMemo(() => buildUsers(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => users.filter((user) => (!query.trim() || `${user.id} ${user.name} ${user.principal} ${user.provider} ${user.roles.join(' ')}`.toLowerCase().includes(query.toLowerCase())) && (status === 'All status' || (status === 'Attention first' ? user.status !== 'Active' || user.mfa === 'Gap' || user.risk === 'High' : user.status === status))), [query, status, users]);
  const selected = visible.find((user) => user.key === selectedKey) ?? visible[0] ?? users[0];
  if (!selected) return null;
  const metrics = {
    active: users.filter((user) => user.status === 'Active').length,
    locked: users.filter((user) => user.status !== 'Active').length,
    mfa: users.filter((user) => user.mfa === 'Gap').length,
    dormant: users.filter((_, index) => index % 5 === 0).length,
    sessions: users.filter((user) => user.sessions > 2).length,
  };
  const queue = () => {
    setReceipt(`${action} queued for ${selected.id}. Identity, role, MFA and session services remain authoritative.`);
    setActionOpen(false);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    requestAnimationFrame(() => detailOpener.current?.focus());
  };

  return <div className="pageComposition differentiatedPage p37Users" data-page-specific-composition="P37-user-governance-detail-security">
    <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup gutterSize="m" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="User ID, name, principal, provider, role or scope" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={status} onChange={(event: ChangeEvent) => setStatus(event.target.value)} options={['Attention first','All status','Active','Locked','Disabled'].map((value) => ({ value, text: value }))} /></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">Directory fresh 3m</EuiBadge></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt('Invite user wizard opened in prototype mode.')}>Invite user</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    {receipt && <EuiCallOut title="Prototype identity receipt" color="warning">{receipt}</EuiCallOut>}
    <EuiFlexGroup gutterSize="m" wrap className="p37Stats">{[['Active users', metrics.active],['Locked / disabled', metrics.locked],['MFA gaps', metrics.mfa],['Dormant privileged', metrics.dormant],['Sessions at risk', metrics.sessions]].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>
    <div className="p37Layout">
      <EuiPanel paddingSize="m" hasBorder className="p37Table"><EuiTitle size="s"><h2>User governance</h2></EuiTitle><div className="p37TableWrap"><table><thead><tr><th>User</th><th>Provider</th><th>Status</th><th>MFA</th><th>Roles</th><th>Sessions</th><th>Last sign-in</th></tr></thead><tbody>{visible.map((user) => <tr key={user.key}><td><EuiButtonEmpty size="xs" onClick={() => setSelectedKey(user.key)}>{user.name}</EuiButtonEmpty><small>{user.id} · {user.principal}</small></td><td>{user.provider}<small>{user.binding}</small></td><td><EuiBadge color={user.status === 'Active' ? 'success' : 'danger'}>{user.status}</EuiBadge></td><td><EuiBadge color={user.mfa === 'Compliant' ? 'success' : 'warning'}>{user.mfa}</EuiBadge></td><td>{user.roles.join(', ')}</td><td>{user.sessions}</td><td>{user.lastSignIn}</td></tr>)}</tbody></table></div></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p37Detail"><EuiFlexGroup alignItems="center" wrap><EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · {selected.principal}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.risk === 'High' ? 'danger' : 'success'}>{selected.risk} risk</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer size="m" /><dl><div><dt>Identity source</dt><dd>{selected.provider} / {selected.binding}</dd></div><div><dt>Manager</dt><dd>{selected.manager}</dd></div><div><dt>Effective roles</dt><dd>{selected.roles.join(', ')}</dd></div><div><dt>Active sessions</dt><dd>{selected.sessions}</dd></div></dl><EuiCallOut title="Effective access">Direct and group roles are combined; privileged capabilities require separate review.</EuiCallOut><EuiSpacer size="m" /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton buttonRef={detailOpener} onClick={() => setDetailOpen(true)}>Sessions & activity</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => { setAction('Reset MFA'); setActionOpen(true); }}>Reset MFA</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty color="danger" onClick={() => { setAction('Disable user'); setActionOpen(true); }}>Disable</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p37Security"><EuiTitle size="s"><h2>Lifecycle & security</h2></EuiTitle>{[['Provider consistency', selected.status === 'Active' ? 'Aligned' : 'Review'],['MFA policy', selected.mfa],['Session risk', selected.sessions > 2 ? 'Elevated' : 'Normal'],['Privileged role', selected.roles.some((role) => role.includes('privileged')) ? 'Present' : 'None']].map(([label, value]) => <div key={label}><strong>{label}</strong><EuiBadge color={/Review|Gap|Elevated|Present/.test(value) ? 'warning' : 'success'}>{value}</EuiBadge></div>)}</EuiPanel>
    </div>
    {detailOpen && <EuiFlyout onClose={closeDetail} ownFocus size="m" aria-labelledby="p37-detail-title"><EuiFlyoutHeader><EuiTitle><h2 id="p37-detail-title">Sessions, activity and ownership</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody>{fixture.timeline.slice(0, 8).map((item, index) => <article key={`${item.time}-${index}`}><strong>{item.title}</strong><span>{item.time}</span><p>{item.detail}</p></article>)}</EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={closeDetail}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {actionOpen && <EuiModal onClose={() => setActionOpen(false)} aria-labelledby="p37-action-title"><EuiModalHeader><EuiModalHeaderTitle id="p37-action-title">{action} impact review</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="High-risk identity action" color="warning">Sessions, ownership, break-glass coverage and effective access must be reviewed before execution.</EuiCallOut><ul><li>User: {selected.id}</li><li>Sessions: {selected.sessions}</li><li>Roles: {selected.roles.join(', ')}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setActionOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={queue}>Queue action</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}