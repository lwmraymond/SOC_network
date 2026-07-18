import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: {
    command:
      'VITE_ENABLE_FIXTURES=true npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/analyzer/search',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
