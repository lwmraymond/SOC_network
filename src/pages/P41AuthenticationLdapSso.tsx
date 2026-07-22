import { useMemo, useRef, useState } from 'react';
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

const spec = pageSpecById.P41;
type ProviderType = 'Native' | 'LDAP' | 'SAML' | 'OIDC';
type Tab = 'Health & tests' | 'Mappings' | 'Provisioning' | 'Routing';
type ChangeEvent = { target: { value: string } };
type Provider = { id: string; name: string; type: ProviderType; realmOrder: number; providerOrder: number; state: string; connection: string; login: string; sync: string; certificate: string; endpoint: string; support: string; mapping: string; users: number; groups: number; changes: number; success: number; fallback: boolean };
const providers: Provider[] = [
  { id: 'native1', name: 'Native emergency access', type: 'Native', realmOrder: 0, providerOrder: 3, state: 'Enabled', connection: 'Healthy', login: 'Healthy', sync: 'Not tested', certificate: 'Not tested', endpoint: 'Internal native realm', support: 'Cluster / deployment', mapping: 'Direct role assignment', users: 4, groups: 0, changes: 0, success: 100, fallback: true },
  { id: 'saml-corp', name: 'Corporate SAML SSO', type: 'SAML', realmOrder: 1, providerOrder: 0, state: 'Enabled', connection: 'Healthy', login: 'Healthy', sync: 'Healthy', certificate: 'Degraded', endpoint: 'https://idp.example.test/metadata', support: 'Kibana browser SSO', mapping: 'groups → Elastic roles', users: 428, groups: 18, changes: 33, success: 98.7, fallback: false },
  { id: 'ldap-ops', name: 'Operations LDAP', type: 'LDAP', realmOrder: 2, providerOrder: 1, state: 'Enabled', connection: 'Healthy', login: 'Degraded', sync: 'Healthy', certificate: 'Healthy', endpoint: 'ldaps://directory.example.test:636', support: 'Self-managed / ECE / ECK', mapping: 'memberOf → operational roles', users: 163, groups: 11, changes: 13, success: 94.2, fallback: false },
  { id: 'oidc-contractors', name: 'Contractor OIDC pilot', type: 'OIDC', realmOrder: 3, providerOrder: 2, state: 'Pilot', connection: 'Healthy', login: 'Healthy', sync: 'Not tested', certificate: 'Healthy', endpoint: 'https://login.example.test/.well-known/openid-configuration', support: 'Kibana browser SSO', mapping: 'claims.groups → restricted roles', users: 37, groups: 4, changes: 7, success: 97.1, fallback: false },
];
const healthColor = (value: string): 'success' | 'warning' | 'danger' | 'hollow' => value === 'Healthy' ? 'success' : value === 'Degraded' ? 'warning' : value === 'Failed' ? 'danger' : 'hollow';

function P41Workspace() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ProviderType | 'All types'>('All types');
  const [selectedId, setSelectedId] = useState('saml-corp');
  const [tab, setTab] = useState<Tab>('Health & tests');
  const [draftOpen, setDraftOpen] = useState(false);
  const [rolloutOpen, setRolloutOpen] = useState(false);
  const [providerName, setProviderName] = useState('New enterprise identity provider');
  const [endpoint, setEndpoint] = useState('https://idp.example.test/metadata');
  const [mapping, setMapping] = useState('groups contains "SOC-Analysts" → soc_analyst');
  const [connectionTested, setConnectionTested] = useState(false);
  const [loginTested, setLoginTested] = useState(false);
  const [pilot, setPilot] = useState('10');
  const [changeRef, setChangeRef] = useState('CHG-2026-1842');
  const [breakGlass, setBreakGlass] = useState(true);
  const [receipt, setReceipt] = useState<string>();
  const draftOpener = useRef<HTMLButtonElement | null>(null);
  const visible = useMemo(() => providers.filter((provider) => (!query.trim() || `${provider.id} ${provider.name} ${provider.type} ${provider.endpoint} ${provider.mapping}`.toLowerCase().includes(query.trim().toLowerCase())) && (type === 'All types' || provider.type === type)), [query, type]);
  const selected = providers.find((provider) => provider.id === selectedId) ?? visible[0] ?? providers[0];
  const orderedRealms = [...providers].sort((a, b) => a.realmOrder - b.realmOrder);
  const orderedLogin = [...providers].sort((a, b) => a.providerOrder - b.providerOrder);
  const closeDraft = () => { setDraftOpen(false); requestAnimationFrame(() => draftOpener.current?.focus()); };
  const queueTest = (kind: string) => setReceipt(`Prototype ${kind} test completed for ${selected.id}; no credentials, session or provider state changed.`);
  const queueRollout = () => { setReceipt(`Prototype staged rollout queued for ${selected.id} at ${pilot}% with ${changeRef}. Provider order and emergency native access remain unchanged.`); setRolloutOpen(false); };

  return <div className="pageComposition differentiatedPage p41Auth" data-page-specific-composition="P41-provider-topology-testing-rollout">
    <style>{`.p41Auth{display:flex;flex-direction:column;gap:24px;min-width:0}.p41Auth *{box-sizing:border-box}.p41Command{display:grid;grid-template-columns:minmax(280px,1fr) minmax(150px,auto) auto;gap:10px;align-items:end}.p41Topology{display:grid;grid-template-columns:1fr 1fr;gap:24px}.p41Chain{display:flex;gap:8px;overflow:auto;padding:4px 0}.p41Chain article{position:relative;min-width:160px;padding:10px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:4px}.p41Chain article:not(:last-child)::after{content:'→';position:absolute;right:-18px;top:40%}.p41Chain strong,.p41Chain small{display:block}.p41Workspace{display:grid;grid-template-columns:minmax(620px,1.4fr) minmax(330px,.8fr);gap:24px;align-items:start}.p41TableWrap{overflow:auto}.p41Table{width:100%;min-width:850px;border-collapse:collapse}.p41Table th,.p41Table td{padding:10px;border-bottom:1px solid var(--euiBorderColor,#d3dae6);text-align:left;vertical-align:top}.p41Table small{display:block;margin-top:4px;color:var(--euiTextSubduedColor,#69707d)}.p41Tabs{display:flex;gap:4px;margin:14px 0;border-bottom:1px solid var(--euiBorderColor,#d3dae6);overflow:auto}.p41Tabs button{padding:9px 11px;border:0;border-bottom:2px solid transparent;background:transparent;color:inherit;white-space:nowrap}.p41Tabs button[aria-selected=true]{border-color:var(--euiColorPrimary,#006bb4);font-weight:600}.p41Health{display:grid;grid-template-columns:1fr 1fr;gap:8px}.p41Health article{padding:10px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:4px}.p41Health header{display:flex;justify-content:space-between;gap:8px}.p41Mapping{display:grid;gap:8px}.p41Mapping article{padding:10px;border-left:3px solid var(--euiColorPrimary,#006bb4);background:var(--euiColorLightestShade,#f5f7fa)}@media(max-width:1050px){.p41Topology,.p41Workspace{grid-template-columns:1fr}}@media(max-width:720px){.p41Command,.p41Health{grid-template-columns:1fr}}`}</style>
    <EuiPanel paddingSize="m" hasBorder><div className="p41Command"><EuiFormRow label="Search provider, endpoint or mapping"><EuiFieldSearch value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} /></EuiFormRow><EuiFormRow label="Type"><EuiSelect value={type} onChange={(event: ChangeEvent) => setType(event.target.value as ProviderType | 'All types')} options={['All types','Native','LDAP','SAML','OIDC'].map((value) => ({ value, text: value }))} /></EuiFormRow><EuiButton buttonRef={draftOpener} fill onClick={() => setDraftOpen(true)}>Add provider</EuiButton></div></EuiPanel>
    {receipt && <EuiCallOut title="Prototype authentication receipt" color="warning">{receipt}</EuiCallOut>}
    <div className="p41Topology"><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Elasticsearch realm chain</h2></EuiTitle><div className="p41Chain">{orderedRealms.map((provider) => <article key={provider.id}><EuiBadge color={provider.fallback ? 'warning' : 'hollow'}>{provider.realmOrder}</EuiBadge><strong>{provider.type}</strong><small>{provider.name}</small></article>)}</div></EuiPanel><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Kibana login providers</h2></EuiTitle><div className="p41Chain">{orderedLogin.map((provider) => <article key={provider.id}><EuiBadge color={provider.state === 'Pilot' ? 'warning' : 'hollow'}>{provider.providerOrder}</EuiBadge><strong>{provider.type}</strong><small>{provider.name}</small></article>)}</div></EuiPanel></div>
    <div className="p41Workspace"><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Authentication providers</h2></EuiTitle><div className="p41TableWrap"><table className="p41Table"><thead><tr><th>Provider</th><th>Type</th><th>State</th><th>Connection</th><th>Login</th><th>Success</th></tr></thead><tbody>{visible.map((provider) => <tr key={provider.id}><td><EuiButtonEmpty size="xs" onClick={() => setSelectedId(provider.id)}>{provider.name}</EuiButtonEmpty><small>{provider.id} · {provider.endpoint}</small></td><td>{provider.type}</td><td><EuiBadge color={provider.state === 'Pilot' ? 'warning' : 'success'}>{provider.state}</EuiBadge></td><td><EuiBadge color={healthColor(provider.connection)}>{provider.connection}</EuiBadge></td><td><EuiBadge color={healthColor(provider.login)}>{provider.login}</EuiBadge></td><td>{provider.success}%</td></tr>)}</tbody></table></div></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><p>{selected.id} · {selected.type} · {selected.support}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.fallback ? 'warning' : 'hollow'}>{selected.fallback ? 'Break-glass' : selected.state}</EuiBadge></EuiFlexItem></EuiFlexGroup><div className="p41Tabs" role="tablist">{(['Health & tests','Mappings','Provisioning','Routing'] as Tab[]).map((item) => <button type="button" role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>{tab === 'Health & tests' && <div className="p41Health">{[['Connection',selected.connection],['Certificate',selected.certificate],['Synthetic login',selected.login],['Directory sync',selected.sync]].map(([label, value]) => <article key={label}><header><strong>{label}</strong><EuiBadge color={healthColor(value)}>{value}</EuiBadge></header><EuiProgress value={value === 'Healthy' ? 100 : value === 'Degraded' ? 68 : 20} max={100} size="s" color={value === 'Healthy' ? 'primary' : 'warning'} /></article>)}</div>}{tab === 'Mappings' && <div className="p41Mapping"><article><strong>Current mapping</strong><span>{selected.mapping}</span></article><article><strong>Authorization boundary</strong><span>Authentication success does not imply role authorization.</span></article></div>}{tab === 'Provisioning' && <div className="p41Mapping"><article><strong>Users</strong><span>{selected.users}</span></article><article><strong>Groups</strong><span>{selected.groups}</span></article><article><strong>Projected changes</strong><span>{selected.changes}</span></article></div>}{tab === 'Routing' && <div className="p41Mapping"><article><strong>Realm order</strong><span>{selected.realmOrder}</span></article><article><strong>Kibana provider order</strong><span>{selected.providerOrder}</span></article><article><strong>Fallback</strong><span>{selected.fallback ? 'Emergency native path' : 'Native path retained separately'}</span></article></div>}<EuiSpacer /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton onClick={() => queueTest('connection/TLS')}>Test connection</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => queueTest('synthetic login')}>Test login</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setRolloutOpen(true)}>Review rollout</EuiButton></EuiFlexItem></EuiFlexGroup><EuiAccordion id={`p41-config-${selected.id}`} buttonContent="Configuration and secret references" paddingSize="s"><EuiCodeBlock language="yaml" paddingSize="s">{`realm: ${selected.id}\norder: ${selected.realmOrder}\nendpoint: ${selected.endpoint}\nsecret: secure-ref://identity/${selected.id}`}</EuiCodeBlock></EuiAccordion></EuiPanel>
    </div>
    {draftOpen && <EuiFlyout onClose={closeDraft} ownFocus size="m" aria-labelledby="p41-draft-title"><EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p41-draft-title">Add authentication provider</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiFormRow label="Provider name"><EuiFieldText value={providerName} onChange={(event: ChangeEvent) => setProviderName(event.target.value)} /></EuiFormRow><EuiFormRow label="Endpoint"><EuiFieldText value={endpoint} onChange={(event: ChangeEvent) => { setEndpoint(event.target.value); setConnectionTested(false); setLoginTested(false); }} /></EuiFormRow><EuiFormRow label="Group or claim mapping"><EuiTextArea value={mapping} onChange={(event: ChangeEvent) => setMapping(event.target.value)} rows={3} /></EuiFormRow><EuiSwitch checked={connectionTested} onChange={() => setConnectionTested(true)} label="Endpoint and TLS test passed" /><EuiSwitch checked={loginTested} onChange={() => setLoginTested(true)} label="Synthetic login test passed" /><EuiCallOut title="Secret reference only" color="warning">Credentials are never stored in this draft. Use the external secure settings path.</EuiCallOut></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={closeDraft}>Cancel</EuiButtonEmpty><EuiButton fill isDisabled={!connectionTested || !loginTested} onClick={() => { setReceipt(`Prototype provider draft saved for ${providerName}; no realm, provider, secret or mapping was created.`); closeDraft(); }}>Save draft</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {rolloutOpen && <EuiModal onClose={() => setRolloutOpen(false)} aria-labelledby="p41-rollout-title"><EuiModalHeader><EuiModalHeaderTitle id="p41-rollout-title">Staged authentication rollout</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Lockout prevention" color="warning">Retain and test native emergency access before changing provider order or disabling a route.</EuiCallOut><EuiFormRow label="Pilot percentage"><EuiSelect value={pilot} onChange={(event: ChangeEvent) => setPilot(event.target.value)} options={['5','10','25','50','100'].map((value) => ({ value, text: `${value}%` }))} /></EuiFormRow><EuiFormRow label="Change reference"><EuiFieldText value={changeRef} onChange={(event: ChangeEvent) => setChangeRef(event.target.value)} /></EuiFormRow><EuiSwitch checked={breakGlass} onChange={() => setBreakGlass((value) => !value)} label="Emergency native access tested and retained" /></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setRolloutOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill isDisabled={!breakGlass} onClick={queueRollout}>Queue rollout</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}

export default function P41AuthenticationLdapSso() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>{page.fixture && <P41Workspace />}</PageFrame>;
}