export const automationRoutes = {
  overview: '/itsm/automation',
  templates: '/itsm/automation/templates',
  templateDetailPattern: '/itsm/automation/templates/:templateId',
  runtime: '/itsm/automation/runtime',
  runDetailPattern: '/itsm/automation/runs/:runId',
} as const;

export const automationTemplateHref = (templateId: string) => `${automationRoutes.templates}/${encodeURIComponent(templateId)}`;
export const automationRunHref = (runId: string) => `/itsm/automation/runs/${encodeURIComponent(runId)}`;
