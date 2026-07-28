import { isItsmFixtureMode, itsmApi } from '../client';
import type { AutomationTemplateManagementAdapter } from './contracts';
import { createAutomationTemplateManagementAdapter } from './adapter';

const defaultAdapter = () => createAutomationTemplateManagementAdapter(itsmApi, {
  fixtureMode: isItsmFixtureMode,
});

export let automationTemplateApi: AutomationTemplateManagementAdapter = defaultAdapter();

export function configureAutomationTemplateApi(adapter: AutomationTemplateManagementAdapter): void {
  automationTemplateApi = adapter;
}

export function resetAutomationTemplateApi(): void {
  automationTemplateApi = defaultAdapter();
}
