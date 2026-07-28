import { cleanup, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '../../euiIcons';
import { createFixtureItsmAdapter, configureItsmApiAdapter, resetItsmApiAdapter } from '../client';
import { createAutomationTemplateManagementAdapter } from './adapter';
import { configureAutomationTemplateApi, resetAutomationTemplateApi } from './api';
import ItsmAutomationManagementPage from '../../pages/itsm/ItsmAutomationManagementPage';
import ItsmAutomationRunDetailPage from '../../pages/itsm/ItsmAutomationRunDetailPage';
import ItsmAutomationRuntimePage from '../../pages/itsm/ItsmAutomationRuntimePage';
import ItsmAutomationTemplatesPage from '../../pages/itsm/ItsmAutomationTemplatesPage';

const detailSections = ['Metadata', 'Schema', 'Workflow', 'Versions', 'Simulation', 'Runs'] as const;

function renderAutomationRoute(route: string) {
  return render(<MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route path="/itsm/automation" element={<ItsmAutomationManagementPage />} />
      <Route path="/itsm/automation/templates" element={<ItsmAutomationTemplatesPage />} />
      <Route path="/itsm/automation/templates/:templateId" element={<ItsmAutomationTemplatesPage />} />
      <Route path="/itsm/automation/runtime" element={<ItsmAutomationRuntimePage />} />
      <Route path="/itsm/automation/runs/:runId" element={<ItsmAutomationRunDetailPage />} />
    </Routes>
  </MemoryRouter>);
}

describe('Automation management routes', () => {
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
      font: '',
      measureText: (text: string) => ({ width: text.length * 8 }) as TextMetrics,
    }) as CanvasRenderingContext2D);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    const fixture = createFixtureItsmAdapter();
    configureItsmApiAdapter(fixture, 'development-fixture');
    configureAutomationTemplateApi(createAutomationTemplateManagementAdapter(fixture, { fixtureMode: true }));
  });

  afterEach(() => {
    cleanup();
    resetAutomationTemplateApi();
    resetItsmApiAdapter();
  });

  it.each([
    ['/itsm/automation', 'Automation administration'],
    ['/itsm/automation/templates', 'Automation Template Library'],
    ['/itsm/automation/runtime', 'Automation Runtime Settings'],
    ['/itsm/automation/runs/run-9001', 'run-9001'],
  ])('renders %s without a runtime boundary', async (route, heading) => {
    renderAutomationRoute(route);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it.each(detailSections)('renders Template Detail section %s without a runtime error', async (section) => {
    renderAutomationRoute(`/itsm/automation/templates/template-major-incident?section=${section}`);
    expect(await screen.findByRole('heading', { level: 1, name: 'Major incident coordination' })).toBeVisible();
    expect(await screen.findByRole('tab', { name: section })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders the copyable Versions diff with the registered copyClipboard icon', async () => {
    renderAutomationRoute('/itsm/automation/templates/template-major-incident?section=Versions');
    expect(await screen.findByRole('heading', { name: 'Version diff' })).toBeVisible();
    expect(await screen.findByRole('button', { name: /copy/i })).toBeVisible();
  });
});
