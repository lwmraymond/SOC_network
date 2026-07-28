import { describe, expect, it } from 'vitest';
import { automationRoutes, automationRunHref, automationTemplateHref } from './routes';

describe('Automation Template routes', () => {
  it('provides stable first-class library, detail, runtime and run-detail URLs', () => {
    expect(automationRoutes.templates).toBe('/itsm/automation/templates');
    expect(automationRoutes.templateDetailPattern).toBe('/itsm/automation/templates/:templateId');
    expect(automationRoutes.runtime).toBe('/itsm/automation/runtime');
    expect(automationRoutes.runDetailPattern).toBe('/itsm/automation/runs/:runId');
    expect(automationTemplateHref('template/a')).toBe('/itsm/automation/templates/template%2Fa');
    expect(automationRunHref('run/a')).toBe('/itsm/automation/runs/run%2Fa');
  });
});
