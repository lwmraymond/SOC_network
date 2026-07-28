import { lazy, Suspense, type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiFieldSearch,
  EuiHeader,
  EuiHeaderLogo,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiLoadingSpinner,
  EuiButtonEmpty,
  EuiIcon,
  EuiSideNav,
  EuiText,
} from '@elastic/eui';
import { Link, Route, Routes, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { pageGroups, pageSpecs, routeForNavigation } from './catalog/pageSpecs';
import type { PageGroup } from './catalog/pageSpecs';
import { usePlatformTheme } from './theme';
const P01 = lazy(() => import('./pages/P01SecurityOperationsOverview'));
const P02 = lazy(() => import('./pages/P02ExecutiveWallboard'));
const P03 = lazy(() => import('./pages/P03PlatformHealth'));
const P04 = lazy(() => import('./pages/P04IncidentsCases'));
const P05 = lazy(() => import('./pages/P05AlertQueue'));
const P06 = lazy(() => import('./pages/P06ResponseActions'));
const P07 = lazy(() => import('./pages/P07EventSearchHunt'));
const P08 = lazy(() => import('./pages/P08AssetInventory'));
const P09 = lazy(() => import('./pages/P09VulnerabilityExposure'));
const P10 = lazy(() => import('./pages/P10VulnerabilityMatches'));
const P11 = lazy(() => import('./pages/P11RemediationQueue'));
const P12 = lazy(() => import('./pages/P12Asset360'));
const P13 = lazy(() => import('./pages/P13ItsmOverview'));
const P14 = lazy(() => import('./pages/P14WorkQueues'));
const P15 = lazy(() => import('./pages/P15RequestsServiceCatalog'));
const P16 = lazy(() => import('./pages/P16IncidentManagement'));
const P17 = lazy(() => import('./pages/P17ProblemManagement'));
const P18 = lazy(() => import('./pages/P18ChangeManagement'));
const P19 = lazy(() => import('./pages/P19ApprovalsTasks'));
const P20 = lazy(() => import('./pages/P20ItsmAnalytics'));
const P21 = lazy(() => import('./pages/P21ReportsExports'));
const P22 = lazy(() => import('./pages/P22ItsmSettings'));
const P23 = lazy(() => import('./pages/P23CopilotWorkspace'));
const P24 = lazy(() => import('./pages/P24AgentFleet'));
const P25 = lazy(() => import('./pages/P25TaskDispatch'));
const P26 = lazy(() => import('./pages/P26AgentRuntimeAccess'));
const P27 = lazy(() => import('./pages/P27RuntimeCatalogOverview'));
const P28 = lazy(() => import('./pages/P28DataSourcesIntegrations'));
const P29 = lazy(() => import('./pages/P29DetectionRules'));
const P30 = lazy(() => import('./pages/P30EventSchemasContracts'));
const P31 = lazy(() => import('./pages/P31RuntimeObjects'));
const P32 = lazy(() => import('./pages/P32ScriptWorkbench'));
const P33 = lazy(() => import('./pages/P33KnowledgeSources'));
const P34 = lazy(() => import('./pages/P34PlaybooksAutomationTemplates'));
const P35 = lazy(() => import('./pages/P35DetectionNotes'));
const P36 = lazy(() => import('./pages/P36ResponseProjects'));
const P37 = lazy(() => import('./pages/P37Users'));
const P38 = lazy(() => import('./pages/P38Roles'));
const P39 = lazy(() => import('./pages/P39Permissions'));
const P40 = lazy(() => import('./pages/P40PlatformSettingsDirectory'));
const P41 = lazy(() => import('./pages/P41AuthenticationLdapSso'));
const P42 = lazy(() => import('./pages/P42ThemeAccessibility'));
const ItsmTicketDetail = lazy(() => import('./pages/itsm/ItsmTicketDetailPage'));
const ItsmSlaManagement = lazy(() => import('./pages/itsm/ItsmSlaManagementPage'));
const ItsmAutomationManagement = lazy(() => import('./pages/itsm/ItsmAutomationManagementPage'));
const ItsmAutomationTemplates = lazy(() => import('./pages/itsm/ItsmAutomationTemplatesPage'));
const ItsmAutomationRuntime = lazy(() => import('./pages/itsm/ItsmAutomationRuntimePage'));
const ItsmAutomationRunDetail = lazy(() => import('./pages/itsm/ItsmAutomationRunDetailPage'));
const ItsmMessagingManagement = lazy(() => import('./pages/itsm/ItsmMessagingManagementPage'));

const groupIcons: Record<PageGroup, 'inspect' | 'search' | 'document'> = {
  Dashboard: 'inspect',
  Analyze: 'search',
  Device: 'inspect',
  'Ticket System / ITSM': 'document',
  'AI Copilot': 'search',
  'SOC Agent': 'inspect',
  'Runtime Catalog': 'document',
  'Knowledge Base': 'document',
  'Response Projects': 'document',
  Administration: 'inspect',
  'Platform Settings': 'document',
};

const dashboardViews = [
  { id: 'P01-network-soc', pageId: 'P01', title: 'Network SOC', route: '/dashboard/network-soc' },
  { id: 'P03-system-overview', pageId: 'P03', title: 'System Overview', route: '/dashboard/system-overview' },
] as const;

const itsmAdminViews = [
  { id: 'ITSM-SLA', title: 'SLA Administration', route: '/itsm/sla' },
  { id: 'ITSM-AUTOMATION', title: 'Automation Administration', route: '/itsm/automation' },
  { id: 'ITSM-MESSAGING', title: 'Notifications & Inbound Mail', route: '/itsm/notifications' },
] as const;

function Suspended({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="routeLoading" role="status"><EuiLoadingSpinner size="xl" /><span>Loading work surface…</span></div>}>{children}</Suspense>;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const [navOpen, setNavOpen] = useState(true);
  const { mode, toggleMode } = usePlatformTheme();
  const currentPage = useMemo(() => {
    const canonical = pageSpecs.find((page) => Boolean(matchPath({ path: page.route, end: true }, location.pathname)));
    if (canonical) return canonical;
    const dashboardView = dashboardViews.find((view) => view.route === location.pathname);
    const dashboardSource = dashboardView && pageSpecs.find((page) => page.id === dashboardView.pageId);
    if (dashboardView && dashboardSource) return { ...dashboardSource, title: dashboardView.title, route: dashboardView.route };
    const adminView = itsmAdminViews.find((view) => view.route === location.pathname || (view.route === '/itsm/automation' && location.pathname.startsWith('/itsm/automation/')));
    if (adminView) return { ...pageSpecs.find((page) => page.id === 'P22')!, id: adminView.id, title: adminView.title, route: adminView.route };
    if (matchPath({ path: '/itsm/tickets/:ticketId', end: true }, location.pathname)) {
      return { ...pageSpecs.find((page) => page.id === 'P14')!, id: 'ITSM-DETAIL', title: 'Ticket Detail Workspace', route: location.pathname };
    }
    return undefined;
  }, [location.pathname]);
  const sideNavItems = useMemo(() => [{
    id: 'workspaces',
    name: 'Workspaces',
    items: pageGroups.map((group) => ({
      id: group,
      name: group,
      icon: <EuiIcon type={groupIcons[group]} size="s" />,
      items: [
        ...pageSpecs.filter((page) => page.group === group).map((page) => {
        const href = routeForNavigation(page.route);
        return {
          id: page.id,
          name: page.title,
          href,
          isSelected: location.pathname === href,
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            navigate(href);
          },
        };
        }),
        ...(group === 'Dashboard' ? dashboardViews.map((view) => ({
          id: view.id,
          name: view.title,
          href: view.route,
          isSelected: location.pathname === view.route,
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            navigate(view.route);
          },
        })) : []),
        ...(group === 'Ticket System / ITSM' ? itsmAdminViews.map((view) => ({
          id: view.id,
          name: view.title,
          href: view.route,
          isSelected: location.pathname === view.route || (view.route === '/itsm/automation' && location.pathname.startsWith('/itsm/automation/')),
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            navigate(view.route);
          },
        })) : []),
      ],
    })),
  }], [location.pathname, navigate]);
  useEffect(() => {
    document.title = `${currentPage?.title ?? 'SOC / ITSM Interactive Design'} · SOC Operations`;
  }, [currentPage?.title]);
  return <div className={`appShell theme-${mode}`} data-nav-open={navOpen}>
    <header aria-label="Application header">
      <EuiHeader position="fixed">
        <EuiHeaderSection grow={false}><EuiHeaderSectionItem><EuiHeaderLogo iconType="inspect" iconTitle="SOC Operations">SOC Operations</EuiHeaderLogo></EuiHeaderSectionItem></EuiHeaderSection>
        <EuiHeaderSection grow><EuiHeaderSectionItem><EuiFieldSearch compressed value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} onSearch={() => navigate(`/analyzer/search?q=${encodeURIComponent(globalSearch)}`)} placeholder="Global object search" aria-label="Global search" /></EuiHeaderSectionItem></EuiHeaderSection>
        <EuiHeaderSection grow={false}><EuiHeaderSectionItem><EuiBadge color="hollow">Prototype</EuiBadge></EuiHeaderSectionItem><EuiHeaderSectionItem><EuiButtonEmpty size="xs" onClick={toggleMode} aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} theme`}>{mode === 'light' ? 'Dark' : 'Light'} theme</EuiButtonEmpty></EuiHeaderSectionItem></EuiHeaderSection>
      </EuiHeader>
    </header>
    <div className="shellContextBar" aria-label="Workspace context">
      <button className="shellContextMenu" type="button" aria-label="Toggle primary navigation" aria-expanded={navOpen} onClick={() => setNavOpen((open) => !open)}><EuiIcon type="document" size="s" /></button>
      <EuiBadge color="hollow">{currentPage?.group ?? 'Operations'}</EuiBadge>
      <span className="shellContextDivider" aria-hidden="true">/</span>
      <strong>{currentPage?.title ?? 'Workspace'}</strong>
      {currentPage && <span className="shellContextId">{currentPage.id}</span>}
    </div>
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebarIntro">
        <EuiText size="xs"><strong>Operations</strong><p>Security and service workspaces</p></EuiText>
        <EuiBadge color="hollow">P01–P42</EuiBadge>
      </div>
      <EuiSideNav items={sideNavItems} truncate={false} mobileBreakpoints={undefined} />
      <div className="sidebarFooter"><EuiText size="xs" color="subdued"><p>Fixture-backed review environment</p></EuiText></div>
    </aside>
    <div className="content" id="main-content">
      <Routes>
        <Route path="/dashboard/soc" element={<Suspended><P01 /></Suspended>} />
        <Route path="/dashboard/network-soc" element={<Suspended><P01 /></Suspended>} />
        <Route path="/dashboard/executive" element={<Suspended><P02 /></Suspended>} />
        <Route path="/dashboard/platform-health" element={<Suspended><P03 /></Suspended>} />
        <Route path="/dashboard/system-overview" element={<Suspended><P03 /></Suspended>} />
        <Route path="/analyzer/cases" element={<Suspended><P04 /></Suspended>} />
        <Route path="/analyzer/alerts" element={<Suspended><P05 /></Suspended>} />
        <Route path="/analyzer/response-actions" element={<Suspended><P06 /></Suspended>} />
        <Route path="/analyzer/search" element={<Suspended><P07 /></Suspended>} />
        <Route path="/devices/inventory" element={<Suspended><P08 /></Suspended>} />
        <Route path="/devices/vulnerabilities" element={<Suspended><P09 /></Suspended>} />
        <Route path="/devices/vulnerability-matches" element={<Suspended><P10 /></Suspended>} />
        <Route path="/devices/remediation" element={<Suspended><P11 /></Suspended>} />
        <Route path="/devices/assets/:assetId" element={<Suspended><P12 /></Suspended>} />
        <Route path="/itsm/overview" element={<Suspended><P13 /></Suspended>} />
        <Route path="/itsm/queues" element={<Suspended><P14 /></Suspended>} />
        <Route path="/itsm/requests" element={<Suspended><P15 /></Suspended>} />
        <Route path="/itsm/incidents" element={<Suspended><P16 /></Suspended>} />
        <Route path="/itsm/problems" element={<Suspended><P17 /></Suspended>} />
        <Route path="/itsm/changes" element={<Suspended><P18 /></Suspended>} />
        <Route path="/itsm/approvals" element={<Suspended><P19 /></Suspended>} />
        <Route path="/itsm/analytics" element={<Suspended><P20 /></Suspended>} />
        <Route path="/itsm/reports" element={<Suspended><P21 /></Suspended>} />
        <Route path="/itsm/settings" element={<Suspended><P22 /></Suspended>} />
        <Route path="/itsm/tickets/:ticketId" element={<Suspended><ItsmTicketDetail /></Suspended>} />
        <Route path="/itsm/sla" element={<Suspended><ItsmSlaManagement /></Suspended>} />
        <Route path="/itsm/automation" element={<Suspended><ItsmAutomationManagement /></Suspended>} />
        <Route path="/itsm/automation/templates" element={<Suspended><ItsmAutomationTemplates /></Suspended>} />
        <Route path="/itsm/automation/templates/:templateId" element={<Suspended><ItsmAutomationTemplates /></Suspended>} />
        <Route path="/itsm/automation/runtime" element={<Suspended><ItsmAutomationRuntime /></Suspended>} />
        <Route path="/itsm/automation/runs/:runId" element={<Suspended><ItsmAutomationRunDetail /></Suspended>} />
        <Route path="/itsm/notifications" element={<Suspended><ItsmMessagingManagement /></Suspended>} />
        <Route path="/copilot" element={<Suspended><P23 /></Suspended>} />
        <Route path="/agents" element={<Suspended><P24 /></Suspended>} />
        <Route path="/agents/tasks" element={<Suspended><P25 /></Suspended>} />
        <Route path="/agents/runtime-access" element={<Suspended><P26 /></Suspended>} />
        <Route path="/runtime" element={<Suspended><P27 /></Suspended>} />
        <Route path="/runtime/data-sources" element={<Suspended><P28 /></Suspended>} />
        <Route path="/runtime/rules" element={<Suspended><P29 /></Suspended>} />
        <Route path="/runtime/events" element={<Suspended><P30 /></Suspended>} />
        <Route path="/runtime/objects" element={<Suspended><P31 /></Suspended>} />
        <Route path="/runtime/script-workbench" element={<Suspended><P32 /></Suspended>} />
        <Route path="/knowledge/sources" element={<Suspended><P33 /></Suspended>} />
        <Route path="/knowledge/playbooks" element={<Suspended><P34 /></Suspended>} />
        <Route path="/knowledge/detection-notes" element={<Suspended><P35 /></Suspended>} />
        <Route path="/projects/responses" element={<Suspended><P36 /></Suspended>} />
        <Route path="/admin/users" element={<Suspended><P37 /></Suspended>} />
        <Route path="/admin/roles" element={<Suspended><P38 /></Suspended>} />
        <Route path="/admin/permissions" element={<Suspended><P39 /></Suspended>} />
        <Route path="/settings" element={<Suspended><P40 /></Suspended>} />
        <Route path="/settings/authentication" element={<Suspended><P41 /></Suspended>} />
        <Route path="/settings/theme" element={<Suspended><P42 /></Suspended>} />
        <Route path="/" element={<div className="routeRedirect"><h1>SOC / ITSM Interactive Design</h1><p>Select a work surface from the navigation.</p><Link to="/dashboard/soc">Open Security Operations Overview</Link></div>} />
        <Route path="*" element={<div className="routeRedirect"><h1>Route not found</h1><p>The requested route is not part of the canonical catalog.</p><Link to="/dashboard/soc">Return to dashboard</Link></div>} />
      </Routes>
    </div>
  </div>;
}

export function App() { return <AppShell />; }
