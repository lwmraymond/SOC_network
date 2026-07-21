import { useMemo, useState } from 'react';
import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiFieldSearch,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import type { PrototypePageFixture } from '../types/prototype';

/*
 * P41 brief / difference contract
 * Archetype: Authentication provider topology and staged rollout workbench.
 * Hero: ordered Elasticsearch realm chain + prioritized Kibana provider path with explicit fallback.
 * First viewport: provider health, authentication outcomes, sync/mapping impact, and break-glass coverage.
 * Primary workflow: inspect provider -> test endpoint/TLS/login -> preview mapping/sync -> review staged rollout.
 * Closest pages: P37 Users and P40 Platform Settings Directory. P41 differs through provider topology,
 * identity lifecycle simulation, realm/provider ordering, login-path tests, and lockout-safe rollout controls.
 * Prototype writes create receipts only; no authentication realm, provider, secret, user, session, or role changes.
 */

type ProviderType = 'Native' | 'LDAP' | 'SAML' | 'OIDC';
type ProviderState = 'Enabled' | 'Pilot' | 'Disabled';
type HealthState = 'Healthy' | 'Degraded' | 'Failed' | 'Not tested';
type InspectorTab = 'Health & tests' | 'Mappings' | 'Provisioning' | 'Routing';
type ChangeEvent = { target: { value: string } };

type AuthProvider = {
  id: string;
  name: string;
  type: ProviderType;
  realmOrder: number;
  providerOrder: number;
  state: ProviderState;
  connection: HealthState;
  login: HealthState;
  sync: HealthState;
  certificate: HealthState;
  endpoint: string;
  domain: string;
  deploymentSupport: string;
  provisioning: string;
  mapping: string;
  owner: string;
  revision: string;
  users: number;
  groups: number;
  createCount: number;
  updateCount: number;
  disableCount: number;
  successRate: number;
  lastTest: string;
  fallback: boolean;
};

const providers: AuthProvider[] = [
  {
    id: 'native1',
    name: 'Native emergency access',
    type: 'Native',
    realmOrder: 0,
    providerOrder: 3,
    state: 'Enabled',
    connection: 'Healthy',
    login: 'Healthy',
    sync: 'Not tested',
    certificate: 'Not tested',
    endpoint: 'Internal Elasticsearch native realm',
    domain: 'break-glass only',
    deploymentSupport: 'Cluster / deployment',
    provisioning: 'Manual native users',
    mapping: 'Direct role assignment',
    owner: 'Security engineering',
    revision: 'r18',
    users: 4,
    groups: 0,
    createCount: 0,
    updateCount: 0,
    disableCount: 0,
    successRate: 100,
    lastTest: '2026-07-21 17:40 +08',
    fallback: true,
  },
  {
    id: 'saml-corp',
    name: 'Corporate SAML SSO',
    type: 'SAML',
    realmOrder: 1,
    providerOrder: 0,
    state: 'Enabled',
    connection: 'Healthy',
    login: 'Healthy',
    sync: 'Healthy',
    certificate: 'Degraded',
    endpoint: 'https://idp.example.test/metadata',
    domain: 'example.test',
    deploymentSupport: 'Kibana browser SSO',
    provisioning: 'Just-in-time identity',
    mapping: 'groups -> Elastic roles',
    owner: 'Identity operations',
    revision: 'r27',
    users: 428,
    groups: 18,
    createCount: 7,
    updateCount: 24,
    disableCount: 2,
    successRate: 98.7,
    lastTest: '2026-07-21 17:32 +08',
    fallback: false,
  },
  {
    id: 'ldap-ops',
    name: 'Operations LDAP',
    type: 'LDAP',
    realmOrder: 2,
    providerOrder: 1,
    state: 'Enabled',
    connection: 'Healthy',
    login: 'Degraded',
    sync: 'Healthy',
    certificate: 'Healthy',
    endpoint: 'ldaps://directory.example.test:636',
    domain: 'ou=operations,dc=example,dc=test',
    deploymentSupport: 'Self-managed / ECE / ECK',
    provisioning: 'Scheduled directory sync',
    mapping: 'memberOf -> operational roles',
    owner: 'Platform identity',
    revision: 'r14',
    users: 163,
    groups: 11,
    createCount: 3,
    updateCount: 9,
    disableCount: 1,
    successRate: 94.2,
    lastTest: '2026-07-21 17:28 +08',
    fallback: false,
  },
  {
    id: 'oidc-contractors',
    name: 'Contractor OIDC pilot',
    type: 'OIDC',
    realmOrder: 3,
    providerOrder: 2,
    state: 'Pilot',
    connection: 'Healthy',
    login: 'Healthy',
    sync: 'Not tested',
    certificate: 'Healthy',
    endpoint: 'https://login.example.test/.well-known/openid-configuration',
    domain: 'contractor.example.test',
    deploymentSupport: 'Kibana browser SSO',
    provisioning: 'Just-in-time identity',
    mapping: 'claims.groups -> restricted roles',
    owner: 'Third-party access',
    revision: 'r6',
    users: 37,
    groups: 4,
    createCount: 5,
    updateCount: 2,
    disableCount: 0,
    successRate: 97.1,
    lastTest: '2026-07-21 17:18 +08',
    fallback: false,
  },
];

const healthColor = (health: HealthState): 'success' | 'warning' | 'danger' | 'hollow' => {
  if (health === 'Healthy') return 'success';
  if (health === 'Degraded') return 'warning';
  if (health === 'Failed') return 'danger';
  return 'hollow';
};

const stateColor = (state: ProviderState): 'success' | 'warning' | 'hollow' => {
  if (state === 'Enabled') return 'success';
  if (state === 'Pilot') return 'warning';
  return 'hollow';
};

function P41AuthenticationWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProviderType | 'All types'>('All types');
  const [selectedId, setSelectedId] = useState('saml-corp');
  const [tab, setTab] = useState<InspectorTab>('Health & tests');
  const [addOpen, setAddOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [rolloutOpen, setRolloutOpen] = useState(false);
  const [providerType, setProviderType] = useState<ProviderType>('SAML');
  const [providerName, setProviderName] = useState('New enterprise identity provider');
  const [endpoint, setEndpoint] = useState('https://idp.example.test/metadata');
  const [mappingRule, setMappingRule] = useState('groups contains "SOC-Analysts" -> soc_analyst');
  const [pilotPercent, setPilotPercent] = useState('10');
  const [changeRef, setChangeRef] = useState('CHG-2026-1842');
  const [breakGlassConfirmed, setBreakGlassConfirmed] = useState(true);
  const [connectionTested, setConnectionTested] = useState(false);
  const [loginTested, setLoginTested] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);

  const visible = useMemo(() => providers.filter((provider) => {
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || `${provider.id} ${provider.name} ${provider.type} ${provider.endpoint} ${provider.domain} ${provider.mapping} ${provider.owner}`.toLowerCase().includes(term);
    const matchesType = typeFilter === 'All types' || provider.type === typeFilter;
    return matchesQuery && matchesType;
  }), [query, typeFilter]);

  const selected = providers.find((provider) => provider.id === selectedId) ?? visible[0] ?? providers[0];
  const enabledProviders = providers.filter((provider) => provider.state === 'Enabled').length;
  const degradedProviders = providers.filter((provider) => [provider.connection, provider.login, provider.sync, provider.certificate].includes('Degraded')).length;
  const breakGlassProviders = providers.filter((provider) => provider.fallback && provider.state === 'Enabled').length;
  const projectedChanges = providers.reduce((total, provider) => total + provider.createCount + provider.updateCount + provider.disableCount, 0);

  const queueTest = (kind: string) => {
    setReceipt(`Prototype ${kind} test completed for ${selected.id}. Endpoint, TLS and synthetic login evidence are illustrative; no credentials, session or provider state changed.`);
  };

  const previewSync = () => {
    setSyncOpen(true);
  };

  const queueRollout = () => {
    setReceipt(`Prototype staged rollout queued for ${selected.id} at ${pilotPercent}% with ${changeRef}. Existing provider order and emergency native access remain authoritative; no authentication routing changed.`);
    setRolloutOpen(false);
  };

  const saveProviderDraft = () => {
    setReceipt(`Prototype provider draft saved for ${providerName}. No realm, Kibana provider, secret reference or role mapping was created.`);
    setAddOpen(false);
  };

  const orderedRealms = [...providers].sort((a, b) => a.realmOrder - b.realmOrder);
  const orderedLoginProviders = [...providers].sort((a, b) => a.providerOrder - b.providerOrder);

  return <div className="pageComposition differentiatedPage p41Authentication" data-page-specific-composition="P41-auth-provider-topology-testing-rollout">
    <style>{`
      .p41Authentication{display:flex;flex-direction:column;gap:24px;min-width:0}.p41Authentication *{box-sizing:border-box}.p41Authentication p,.p41Authentication small,.p41Authentication td,.p41Authentication dd{overflow-wrap:anywhere}.p41Hero{display:grid;grid-template-columns:minmax(280px,1.5fr) minmax(180px,.7fr) auto;gap:12px;align-items:end}.p41Summary{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:1px;padding:0;overflow:hidden}.p41Summary>div{padding:15px 18px;background:var(--euiColorEmptyShade,#fff)}.p41Summary strong{display:block;font-size:22px}.p41Summary span{display:block;margin-top:5px}.p41Topology{display:grid;grid-template-columns:1fr 1fr;gap:24px}.p41Chain{display:flex;align-items:stretch;gap:8px;overflow:auto;padding-bottom:4px}.p41Chain article{position:relative;min-width:170px;padding:12px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:6px;background:var(--euiColorEmptyShade,#fff)}.p41Chain article:not(:last-child)::after{content:'→';position:absolute;right:-18px;top:42%;font-weight:700}.p41Chain strong,.p41Chain small{display:block}.p41Chain small{margin-top:6px}.p41Workspace{display:grid;grid-template-columns:minmax(690px,1.7fr) minmax(360px,1fr);gap:24px;align-items:start;min-width:0}.p41TableWrap{overflow:auto}.p41Table{width:100%;min-width:980px;border-collapse:collapse}.p41Table th,.p41Table td{padding:10px 12px;border-bottom:1px solid var(--euiBorderColor,#d3dae6);text-align:left;vertical-align:top}.p41Table th{font-size:12px;text-transform:uppercase;letter-spacing:.04em}.p41Table tr[aria-selected=true]{background:var(--euiColorLightestShade,#f5f7fa)}.p41Identity{display:grid;gap:3px}.p41Badges{display:flex;flex-wrap:wrap;gap:5px}.p41Tabs{display:flex;gap:4px;margin:18px 0 14px;border-bottom:1px solid var(--euiBorderColor,#d3dae6);overflow:auto}.p41Tabs button{padding:9px 12px;border:0;border-bottom:2px solid transparent;background:transparent;color:inherit;white-space:nowrap}.p41Tabs button[aria-selected=true]{border-color:var(--euiColorPrimary,#006bb4);font-weight:600}.p41HealthGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.p41HealthGrid article{padding:12px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:6px}.p41HealthGrid header{display:flex;justify-content:space-between;gap:8px}.p41MappingList,.p41RoutingList{display:grid;gap:10px}.p41MappingList article,.p41RoutingList article{padding:12px;background:var(--euiColorLightestShade,#f5f7fa);border-left:3px solid var(--euiColorPrimary,#006bb4)}.p41MappingList strong,.p41MappingList small,.p41RoutingList strong,.p41RoutingList small{display:block}.p41Outcome{display:grid;gap:12px}.p41Outcome article{display:grid;grid-template-columns:minmax(150px,1fr) 2fr auto;gap:12px;align-items:center}.p41Outcome strong,.p41Outcome small{display:block}.p41FlyoutGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.p41Checklist{display:grid;gap:10px}.p41Checklist article{display:grid;grid-template-columns:28px 1fr;gap:10px;padding:12px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:6px}.p41Checklist b{display:flex;width:24px;height:24px;border-radius:50%;align-items:center;justify-content:center;background:var(--euiColorLightestShade,#f5f7fa)}@media(max-width:1450px){.p41Workspace{grid-template-columns:minmax(600px,1.5fr) minmax(330px,1fr)}.p41Topology{grid-template-columns:1fr}}@media(max-width:1050px){.p41Hero{grid-template-columns:1fr 1fr}.p41Workspace{grid-template-columns:1fr}.p41Summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.p41Hero,.p41Summary,.p41HealthGrid,.p41FlyoutGrid{grid-template-columns:1fr}.p41Outcome article{grid-template-columns:1fr}.p41Hero>button{width:max-content}}
    `}</style>

    <EuiPanel paddingSize="m" hasBorder data-visual-region="auth-provider-search-and-primary-action">
      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem>
          <EuiTitle size="s"><h2>Authentication providers</h2></EuiTitle>
          <p>Test realm/provider health, identity mapping, provisioning impact, session policy and fallback before a governed rollout.</p>
        </EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">Registry freshness {fixture.freshness}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div className="p41Hero">
        <EuiFormRow label="Search provider, endpoint, domain, mapping or owner">
          <EuiFieldSearch value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="SAML, LDAP, issuer, group mapping, error…" />
        </EuiFormRow>
        <EuiFormRow label="Provider type">
          <EuiSelect value={typeFilter} onChange={(event: ChangeEvent) => setTypeFilter(event.target.value as ProviderType | 'All types')} options={['All types','Native','LDAP','SAML','OIDC'].map((value) => ({ value, text: value }))} />
        </EuiFormRow>
        <EuiButton fill onClick={() => setAddOpen(true)}>Add provider</EuiButton>
      </div>
    </EuiPanel>

    {receipt && <EuiCallOut className="p41Receipt" title="Prototype authentication receipt" color="warning">{receipt}</EuiCallOut>}

    <EuiPanel paddingSize="none" hasBorder className="p41Summary" data-visual-region="auth-provider-operating-summary">
      <div><strong>{enabledProviders}</strong><span>Enabled providers</span></div>
      <div><strong>{degradedProviders}</strong><span>Providers needing attention</span></div>
      <div><strong>{projectedChanges}</strong><span>Projected identity changes</span></div>
      <div><strong>{breakGlassProviders}</strong><span>Enabled break-glass paths</span></div>
    </EuiPanel>

    <div className="p41Topology" data-visual-region="realm-and-kibana-provider-topology">
      <EuiPanel paddingSize="m" hasBorder>
        <EuiTitle size="xs"><h3>Elasticsearch realm chain</h3></EuiTitle>
        <p>Authentication is attempted in ascending realm order until one realm authenticates the request.</p>
        <div className="p41Chain">{orderedRealms.map((provider) => <article key={provider.id}>
          <EuiBadge color={stateColor(provider.state)}>Order {provider.realmOrder}</EuiBadge>
          <strong>{provider.name}</strong>
          <small>{provider.type} · {provider.connection}</small>
        </article>)}</div>
      </EuiPanel>
      <EuiPanel paddingSize="m" hasBorder>
        <EuiTitle size="xs"><h3>Kibana login provider path</h3></EuiTitle>
        <p>Browser login providers have their own priority and preserve an explicit emergency route.</p>
        <div className="p41Chain">{orderedLoginProviders.map((provider) => <article key={provider.id}>
          <EuiBadge color={provider.fallback ? 'warning' : stateColor(provider.state)}>Priority {provider.providerOrder}</EuiBadge>
          <strong>{provider.name}</strong>
          <small>{provider.fallback ? 'Emergency fallback' : provider.deploymentSupport}</small>
        </article>)}</div>
      </EuiPanel>
    </div>

    <div className="p41Workspace">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="provider-grid-and-auth-outcomes">
        <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
          <EuiFlexItem><EuiTitle size="s"><h2>Provider registry</h2></EuiTitle></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length} visible</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <div className="p41TableWrap"><table className="p41Table">
          <thead><tr><th>Provider</th><th>Status / health</th><th>Endpoint / domain</th><th>Provisioning</th><th>Mapping</th><th>Revision</th></tr></thead>
          <tbody>{visible.map((provider) => <tr key={provider.id} aria-selected={selected.id === provider.id}>
            <td><div className="p41Identity"><EuiButtonEmpty size="xs" onClick={() => setSelectedId(provider.id)}>{provider.name}</EuiButtonEmpty><small>{provider.id} · {provider.type}</small></div></td>
            <td><div className="p41Badges"><EuiBadge color={stateColor(provider.state)}>{provider.state}</EuiBadge><EuiBadge color={healthColor(provider.login)}>Login {provider.login}</EuiBadge></div></td>
            <td><strong>{provider.endpoint}</strong><small>{provider.domain}</small></td>
            <td>{provider.provisioning}</td>
            <td>{provider.mapping}</td>
            <td>{provider.revision}<small>{provider.owner}</small></td>
          </tr>)}</tbody>
        </table></div>
        <EuiSpacer size="l" />
        <EuiTitle size="xs"><h3>Authentication outcomes by provider · last hour</h3></EuiTitle>
        <div className="p41Outcome">{providers.filter((provider) => !provider.fallback).map((provider) => <article key={provider.id}>
          <div><strong>{provider.name}</strong><small>{provider.users} identities · last test {provider.lastTest}</small></div>
          <EuiProgress value={provider.successRate} max={100} color={provider.successRate >= 97 ? 'success' : 'warning'} size="m" />
          <span>{provider.successRate}%</span>
        </article>)}</div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder data-visual-region="selected-provider-inspector">
        <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
          <EuiFlexItem>
            <EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle>
            <p>{selected.id} · {selected.type} · owner {selected.owner}</p>
          </EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color={stateColor(selected.state)}>{selected.state}</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <div className="p41Tabs" role="tablist">{(['Health & tests','Mappings','Provisioning','Routing'] as InspectorTab[]).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{item}</button>)}</div>

        {tab === 'Health & tests' && <>
          <div className="p41HealthGrid">
            {[["Connection / TLS", selected.connection],["Synthetic login", selected.login],["Directory sync", selected.sync],["Certificate", selected.certificate]].map(([label, health]) => <article key={label}>
              <header><strong>{label}</strong><EuiBadge color={healthColor(health as HealthState)}>{health}</EuiBadge></header>
              <small>Last evidence {selected.lastTest}</small>
            </article>)}
          </div>
          <EuiSpacer size="m" />
          <EuiFlexGroup gutterSize="s" wrap>
            <EuiFlexItem grow={false}><EuiButton onClick={() => queueTest('connection and TLS')}>Test connection</EuiButton></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiButton onClick={() => queueTest('synthetic login')}>Test login</EuiButton></EuiFlexItem>
          </EuiFlexGroup>
        </>}

        {tab === 'Mappings' && <div className="p41MappingList">
          <article><strong>Principal claim</strong><span>principal = nameid / preferred_username</span><small>Required · unique identity key</small></article>
          <article><strong>Group mapping</strong><span>{selected.mapping}</span><small>{selected.groups} mapped groups</small></article>
          <article><strong>Privileged mapping guard</strong><span>Security-Admins requires explicit review</span><small>No implicit superuser mapping</small></article>
        </div>}

        {tab === 'Provisioning' && <>
          <EuiCallOut title="Projected directory impact" color={selected.disableCount > 0 ? 'warning' : 'success'}>
            Create {selected.createCount}, update {selected.updateCount}, disable {selected.disableCount}. Preview is not an authoritative sync.
          </EuiCallOut>
          <EuiSpacer size="m" />
          <EuiButton fill onClick={previewSync}>Preview mapping & sync</EuiButton>
        </>}

        {tab === 'Routing' && <div className="p41RoutingList">
          <article><strong>Realm order</strong><span>{selected.realmOrder}</span><small>Lower order is consulted first.</small></article>
          <article><strong>Kibana provider priority</strong><span>{selected.providerOrder}</span><small>Controls the login selector / redirect path.</small></article>
          <article><strong>Fallback</strong><span>{selected.fallback ? 'Emergency native path' : 'Native emergency access remains enabled'}</span><small>Last working path cannot be disabled in this prototype.</small></article>
          <article><strong>Session baseline</strong><span>Idle 30m · lifespan 12h · MFA inherited</span><small>Policy changes require a separate rollout review.</small></article>
        </div>}

        <EuiSpacer size="m" />
        <EuiCallOut title="Lockout protection" color="warning">Provider disablement or order changes require a tested emergency path, staged rollout, Change reference and rollback target.</EuiCallOut>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" wrap>
          <EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setReceipt(`Prototype secret rotation review opened for ${selected.id}. Secret values are never displayed or stored in this demo.`)}>Rotate secret reference</EuiButtonEmpty></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButton fill onClick={() => setRolloutOpen(true)}>Review rollout</EuiButton></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>

    <EuiAccordion id="p41-operating-guardrails" buttonContent="Provider support and operating guardrails" paddingSize="m">
      <EuiPanel paddingSize="m" color="subdued">
        <ul>
          <li>SAML and OIDC model Kibana browser SSO; REST/API authentication uses supported token or realm mechanisms.</li>
          <li>LDAP support depends on deployment model; the page exposes a support label instead of assuming universal availability.</li>
          <li>Realm and Kibana provider ordering are reviewed separately.</li>
          <li>Authentication success is followed by authorization; role mapping impact is previewed but not applied here.</li>
        </ul>
      </EuiPanel>
    </EuiAccordion>

    {addOpen && <EuiFlyout onClose={() => setAddOpen(false)} size="m" aria-labelledby="p41-add-provider-title">
      <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p41-add-provider-title">Add authentication provider</h2></EuiTitle><p>Create a draft, test it, preview mapping and then use a separate governed rollout.</p></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title="Secrets remain external" color="warning">Use a secret reference. Client secrets, bind passwords and private keys are never displayed in this UI.</EuiCallOut>
        <EuiSpacer size="m" />
        <div className="p41FlyoutGrid">
          <EuiFormRow label="Provider type"><EuiSelect value={providerType} onChange={(event: ChangeEvent) => setProviderType(event.target.value as ProviderType)} options={['LDAP','SAML','OIDC','Native'].map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiFormRow label="Display name"><EuiFieldText value={providerName} onChange={(event: ChangeEvent) => setProviderName(event.target.value)} /></EuiFormRow>
        </div>
        <EuiFormRow label="Metadata / directory endpoint"><EuiFieldText value={endpoint} onChange={(event: ChangeEvent) => setEndpoint(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Attribute / group mapping"><EuiTextArea value={mappingRule} onChange={(event: ChangeEvent) => setMappingRule(event.target.value)} rows={4} /></EuiFormRow>
        <EuiSpacer size="m" />
        <div className="p41Checklist">
          <article><b>1</b><div><strong>Endpoint and TLS</strong><small>Resolve endpoint, trust chain, hostname and certificate lifetime.</small><EuiButtonEmpty size="xs" onClick={() => setConnectionTested(true)}>{connectionTested ? 'Passed' : 'Run test'}</EuiButtonEmpty></div></article>
          <article><b>2</b><div><strong>Login path</strong><small>Use a synthetic test identity without creating a persistent session.</small><EuiButtonEmpty size="xs" isDisabled={!connectionTested} onClick={() => setLoginTested(true)}>{loginTested ? 'Passed' : 'Run test'}</EuiButtonEmpty></div></article>
          <article><b>3</b><div><strong>Mapping and provisioning preview</strong><small>Preview user/group changes before any enablement.</small></div></article>
        </div>
        <EuiSpacer size="m" />
        <EuiCodeBlock language="yaml" paddingSize="s">{`provider:
  type: ${providerType.toLowerCase()}
  endpoint: ${endpoint}
  order: proposed
  secret_ref: secure-ref://identity/pending
mapping:
  rule: ${mappingRule}`}</EuiCodeBlock>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setAddOpen(false)}>Cancel</EuiButtonEmpty></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButton fill isDisabled={!connectionTested || !loginTested} onClick={saveProviderDraft}>Save tested draft</EuiButton></EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>}

    {syncOpen && <EuiModal onClose={() => setSyncOpen(false)} aria-labelledby="p41-sync-preview-title">
      <EuiModalHeader><EuiModalHeaderTitle id="p41-sync-preview-title">Mapping and directory sync preview</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody>
        <EuiCallOut title="Preview only" color="warning">Counts are illustrative and do not create, update, disable or authorize users.</EuiCallOut>
        <EuiSpacer size="m" />
        <table><thead><tr><th>Outcome</th><th>Count</th><th>Example</th></tr></thead><tbody>
          <tr><td>Create</td><td>{selected.createCount}</td><td>New identities matching approved groups</td></tr>
          <tr><td>Update</td><td>{selected.updateCount}</td><td>Display name and group membership changes</td></tr>
          <tr><td>Disable</td><td>{selected.disableCount}</td><td>Missing directory identity after safeguard window</td></tr>
        </tbody></table>
        <EuiSpacer size="m" />
        <EuiCallOut title="Privileged mapping review">2 identities would enter a privileged mapping and require explicit approval before any authoritative sync.</EuiCallOut>
      </EuiModalBody>
      <EuiModalFooter><EuiButton onClick={() => setSyncOpen(false)}>Close preview</EuiButton></EuiModalFooter>
    </EuiModal>}

    {rolloutOpen && <EuiModal onClose={() => setRolloutOpen(false)} aria-labelledby="p41-rollout-title">
      <EuiModalHeader><EuiModalHeaderTitle id="p41-rollout-title">Staged authentication rollout</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody>
        <EuiCallOut title="High-risk routing change" color="warning">A queued receipt is not an enabled provider. Real rollout requires approval, deployment-specific configuration, health checks and authoritative rehydration.</EuiCallOut>
        <EuiSpacer size="m" />
        <div className="p41FlyoutGrid">
          <EuiFormRow label="Pilot traffic percentage"><EuiFieldText value={pilotPercent} onChange={(event: ChangeEvent) => setPilotPercent(event.target.value)} /></EuiFormRow>
          <EuiFormRow label="Change reference"><EuiFieldText value={changeRef} onChange={(event: ChangeEvent) => setChangeRef(event.target.value)} /></EuiFormRow>
        </div>
        <EuiSwitch checked={breakGlassConfirmed} onChange={() => setBreakGlassConfirmed((value) => !value)} label="Emergency native access tested and retained" />
        <EuiSpacer size="m" />
        <ul>
          <li>Provider: {selected.name} ({selected.revision})</li>
          <li>Pilot: {pilotPercent}% before wider routing</li>
          <li>Success gate: connection, login, mapping and certificate health</li>
          <li>Rollback: restore prior provider and realm order</li>
          <li>Emergency route: native1 remains enabled</li>
        </ul>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={() => setRolloutOpen(false)}>Cancel</EuiButtonEmpty>
        <EuiButton fill isDisabled={!breakGlassConfirmed || !changeRef.trim()} onClick={queueRollout}>Queue staged rollout</EuiButton>
      </EuiModalFooter>
    </EuiModal>}
  </div>;
}

const spec = pageSpecById.P41;

export default function P41AuthenticationLdapSso() {
  const page = usePrototypePage(spec.id);
  return <PageFrame
    spec={spec}
    fixture={page.fixture}
    adapterError={page.adapterError}
    viewState={page.viewState}
    setViewState={page.setViewState}
  >
    {page.fixture && <P41AuthenticationWorkspace fixture={page.fixture} />}
  </PageFrame>;
}
