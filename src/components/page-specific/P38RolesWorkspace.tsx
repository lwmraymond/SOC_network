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
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P38RolesWorkspace.css';

type Role = { key: string; id: string; name: string; lifecycle: string; owner: string; members: number; privileged: number; unused: number; conflicts: number; revision: string; scope: string; capabilities: string[] };
type Tab = 'Capabilities' | 'Scopes' | 'Members' | 'Diff';
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const number = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildRoles = (rows: PrototypeRow[]): Role[] => rows.slice(0, 14).map((row, index) => ({
  key: `${row.id}:${index}`,
  id: text(row.role_id, `ROLE-${200 + index}`),
  name: text(row.name, ['SOC analyst','Response operator','Detection engineer','Platform administrator'][index % 4]),
  lifecycle: text(row.lifecycle, index % 5 === 0 ? 'Draft' : 'Published'),
  owner: text(row.owner, 'Security governance'),
  members: number(row.member_count, 4 + index * 3),
  privileged: number(row.privileged_capabilities, index % 4 === 0 ? 3 : 0),
  unused: number(row.unused_capabilities, index % 5 === 0 ? 2 : 0),
  conflicts: number(row.sod_conflicts, index % 6 === 0 ? 1 : 0),
  revision: text(row.revision, `r${12 - index % 4}`),
  scope: text(row.scope, ['All security','Endpoint only','Detection content','Platform settings'][index % 4]),
  capabilities: ['read.alerts', index % 2 ? 'manage.cases' : 'execute.response', index % 3 ? 'read.events' : 'manage.rules'],
}));

export function P38RolesWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [lifecycle, setLifecycle] = useState('Active');
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('Capabilities');
  const [validationOpen, setValidationOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const validationOpener = useRef<HTMLButtonElement | null>(null);
  const roles = useMemo(() => buildRoles(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => roles.filter((role) => (!query || `${role.id} ${role.name} ${role.owner} ${role.scope} ${role.capabilities.join(' ')}`.toLowerCase().includes(query.toLowerCase())) && (lifecycle === 'All lifecycle' || (lifecycle === 'Active' ? role.lifecycle !== 'Deprecated' : role.lifecycle === lifecycle))), [query, lifecycle, roles]);
  const selected = visible.find((role) => role.key === selectedKey) ?? visible[0] ?? roles[0];
  if (!selected) return null;
  const queue = (label: string) => setReceipt(`${label} queued for ${selected.id}; published role and effective access remain unchanged until authoritative rehydration.`);
  const closeValidation = () => {
    setValidationOpen(false);
    requestAnimationFrame(() => validationOpener.current?.focus());
  };

  return <div className="pageComposition differentiatedPage p38Roles" data-page-specific-composition="P38-role-catalog-tabs-governed-impact">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="role-command-bar">
      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Role, capability, scope, owner or conflict" aria-label="Search roles" /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed value={lifecycle} onChange={(event: ChangeEvent) => setLifecycle(event.target.value)} options={['Active','All lifecycle','Published','Draft','Deprecated'].map((value) => ({ value, text: value }))} aria-label="Role lifecycle" /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt('Create role editor opened in prototype mode; no role was created.')}>Create role</EuiButton></EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>

    {receipt && <EuiCallOut title="Prototype role receipt" color="warning">{receipt}</EuiCallOut>}

    <div className="p38Layout">
      <EuiPanel paddingSize="m" hasBorder className="p38Catalog" data-visual-region="role-catalog">
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Role catalog</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <div className="p38RoleList" role="listbox" aria-label="Roles">
          {visible.map((role) => <button type="button" role="option" aria-selected={role.key === selected.key} key={role.key} onClick={() => setSelectedKey(role.key)}>
            <header><EuiBadge color={role.lifecycle === 'Published' ? 'success' : 'warning'}>{role.lifecycle}</EuiBadge><small>{role.revision}</small></header>
            <strong>{role.name}</strong>
            <small>{role.id} · {role.scope}</small>
            <footer><span>{role.members} members</span><span>{role.conflicts ? `${role.conflicts} conflicts` : 'Validated'}</span></footer>
          </button>)}
        </div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder className="p38Workspace" data-visual-region="selected-role-workspace">
        <EuiFlexGroup alignItems="center" wrap>
          <EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · owner {selected.owner} · {selected.revision}</p></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color={selected.conflicts ? 'danger' : 'success'}>{selected.conflicts ? 'SoD conflict' : 'Validated'}</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <div className="p38SummaryStrip">
          <span><strong>{selected.members}</strong> members</span>
          <span><strong>{selected.privileged}</strong> privileged capabilities</span>
          <span><strong>{selected.unused}</strong> unused capabilities</span>
          <span><strong>{selected.scope}</strong> primary scope</span>
        </div>
        <div className="p38Tabs" role="tablist" aria-label="Role detail">
          {(['Capabilities','Scopes','Members','Diff'] as Tab[]).map((item) => <button type="button" role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}
        </div>

        {tab === 'Capabilities' && <div className="p38Matrix" aria-label="Capability matrix">
          {['Alerts','Cases','Response actions','Detection rules','Platform settings'].map((resource, index) => <div key={resource}><strong>{resource}</strong>{['None','Read','All'].map((level, levelIndex) => <button type="button" key={level} aria-pressed={(index + levelIndex) % 3 === 1}>{level}</button>)}</div>)}
        </div>}
        {tab === 'Scopes' && <div className="p38Scope"><article><strong>Primary scope</strong><span>{selected.scope}</span></article><article><strong>Index patterns</strong><span>logs-security-* · alerts-security-*</span></article><article><strong>Spaces</strong><span>Security operations · Detection engineering</span></article><article><strong>Tenant boundary</strong><span>Global security tenant</span></article></div>}
        {tab === 'Members' && <div className="p38Members">{Array.from({ length: Math.min(8, selected.members) }, (_, index) => <article key={`${selected.key}:member:${index}`}><div><strong>User {index + 1}</strong><span>{index % 3 ? 'Direct assignment' : 'Group assignment'}</span></div><EuiBadge color={index === 0 ? 'warning' : 'hollow'}>{index === 0 ? 'Privileged' : 'Standard'}</EuiBadge></article>)}</div>}
        {tab === 'Diff' && <div className="p38Diff"><div><span>Published · {selected.revision}</span><code>read alerts / manage cases</code></div><div><span>Draft</span><code>read alerts / manage cases / execute response</code></div><EuiCallOut title="Privilege union" color="warning">Additional roles cannot reduce existing access. Publication may increase effective access for {selected.members} members.</EuiCallOut></div>}

        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" wrap>
          <EuiFlexItem grow={false}><EuiButton buttonRef={validationOpener} onClick={() => setValidationOpen(true)}>Validate role</EuiButton></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => queue('Clone role')}>Clone role</EuiButtonEmpty></EuiFlexItem>
          <EuiFlexItem />
          <EuiFlexItem grow={false}><EuiButton fill onClick={() => setPublishOpen(true)}>Review publish</EuiButton></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>

    {validationOpen && <EuiFlyout onClose={closeValidation} ownFocus size="s" aria-labelledby="p38-validation-title">
      <EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p38-validation-title">Role validation impact</h2></EuiTitle></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title={selected.conflicts ? 'Validation requires review' : 'Validation passed'} color={selected.conflicts ? 'warning' : 'success'}>Schema, scope, role mapping, separation-of-duties and member impact checks are simulated only.</EuiCallOut>
        <EuiSpacer />
        {[['Privileged capabilities', selected.privileged],['Unused capabilities', selected.unused],['SoD conflicts', selected.conflicts],['Affected members', selected.members]].map(([label, value]) => <div className="p38ImpactRow" key={String(label)}><span>{label}</span><strong>{value}</strong><EuiProgress value={Math.min(100, Number(value) * 10)} max={100} size="s" color={Number(value) > 1 ? 'warning' : 'primary'} /></div>)}
        <EuiCallOut title="Effective access remains unchanged" color="warning">Validation does not publish the role or alter member authorization.</EuiCallOut>
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiButton onClick={closeValidation}>Close validation</EuiButton></EuiFlyoutFooter>
    </EuiFlyout>}

    {publishOpen && <EuiModal onClose={() => setPublishOpen(false)} aria-labelledby="p38-publish-title"><EuiModalHeader><EuiModalHeaderTitle id="p38-publish-title">Role publication impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Privilege union" color="warning">Publishing may increase effective access for all members; it cannot reduce access granted by another role.</EuiCallOut><ul><li>Role: {selected.id}</li><li>Members: {selected.members}</li><li>Privileged capabilities: {selected.privileged}</li><li>SoD conflicts: {selected.conflicts}</li><li>Rollback: {selected.revision}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setPublishOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill isDisabled={selected.conflicts > 0} onClick={() => { queue('Publish role'); setPublishOpen(false); }}>Queue publish</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}