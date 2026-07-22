import { test, expect } from '@playwright/test';
import { collectRuntimeErrors, expectNoRuntimeErrors, waitForCanonicalSurface } from './testSupport';

test.describe('state matrix and progressive disclosure', () => {
  test('P07 denied preserves query context and exposes no ready rows', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/analyzer/search?q=severity%3Ahigh&state=denied');
    await waitForCanonicalSurface(page, 'P07', 'Event Search & Hunt');

    await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
    await expect(page.getByLabel('Event query')).toHaveValue('severity:high');
    await expect(page.locator('.p07ResultsPanel tbody tr')).toHaveCount(0);
    await expectNoRuntimeErrors(runtimeErrors);
  });

  test('P07 stale preserves query context and permitted stale rows', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/analyzer/search?q=severity%3Ahigh&state=stale');
    await waitForCanonicalSurface(page, 'P07', 'Event Search & Hunt');

    await expect(page.getByRole('heading', { name: 'Stale authoritative state' })).toBeVisible();
    await expect(page.getByLabel('Event query')).toHaveValue('severity:high');
    await expect(page.locator('.p07ResultsPanel tbody tr').first()).toBeVisible();
    await expectNoRuntimeErrors(runtimeErrors);
  });

  test('shared PageFrame supports Focused and Full page modes without losing context', async ({ page }) => {
    await page.goto('/projects/responses');
    await waitForCanonicalSurface(page, 'P36', 'Response Projects');

    await expect(page.locator('[data-page-id="P36"]')).toHaveAttribute('data-page-mode', 'focused');
    await page.getByRole('button', { name: 'Full page' }).click();
    await expect(page.locator('[data-page-id="P36"]')).toHaveAttribute('data-page-mode', 'full');
    await page.getByRole('button', { name: 'Focused view' }).click();
    await expect(page.locator('[data-page-id="P36"]')).toHaveAttribute('data-page-mode', 'focused');
  });

  test('P36 milestone evidence Flyout returns focus to the selected milestone', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/projects/responses');
    await waitForCanonicalSurface(page, 'P36', 'Response Projects');

    await page.getByRole('tab', { name: 'Milestones' }).click();
    const milestone = page.getByRole('button', { name: /Scope and success criteria/ }).first();
    await milestone.click();
    await expect(page.getByRole('heading', { name: 'Milestone evidence' })).toBeVisible();
    await page.getByRole('button', { name: 'Close evidence' }).click();
    await expect(milestone).toBeFocused();
    await expectNoRuntimeErrors(runtimeErrors);
  });

  test('P39 decision trace opens only after selection and returns focus', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/admin/permissions');
    await waitForCanonicalSurface(page, 'P39', 'Permissions');

    await expect(page.getByRole('button', { name: 'Why this decision?' })).toHaveCount(0);
    await page.locator('.p39Table tbody tr').first().getByRole('button').click();
    const whyButton = page.getByRole('button', { name: 'Why this decision?' });
    await whyButton.click();
    await expect(page.getByRole('heading', { name: 'Why this decision?' })).toBeVisible();
    await page.getByRole('button', { name: 'Close trace' }).click();
    await expect(whyButton).toBeFocused();
    await expectNoRuntimeErrors(runtimeErrors);
  });

  test('P42 finding detail is selection-driven and returns focus', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/settings/theme');
    await waitForCanonicalSurface(page, 'P42', 'Theme & Accessibility');

    await page.getByRole('tab', { name: 'Validation' }).click();
    const finding = page.locator('.p42Findings button').first();
    await finding.click();
    await expect(page.getByRole('heading', { name: 'Text contrast' })).toBeVisible();
    await page.getByRole('button', { name: 'Close finding' }).click();
    await expect(finding).toBeFocused();
    await expectNoRuntimeErrors(runtimeErrors);
  });
});