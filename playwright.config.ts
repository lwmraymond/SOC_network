import { defineConfig, devices } from '@playwright/test';

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl ?? 'http://127.0.0.1:4173';
const isCi = Boolean((globalThis as typeof globalThis & { process?: { env?: { CI?: string } } }).process?.env?.CI);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: isCi ? 1 : 0,
  workers: isCi ? 2 : 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: chromiumExecutable ? 'off' : 'retain-on-failure',
    contextOptions: { reducedMotion: 'reduce' },
  },
  webServer: externalBaseUrl ? undefined : {
    command: 'VITE_ENABLE_FIXTURES=true npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/dashboard/soc',
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: chromiumExecutable ? { executablePath: chromiumExecutable } : undefined,
    },
  }],
});