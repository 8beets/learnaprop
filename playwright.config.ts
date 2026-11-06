import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4322', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command:
      'node --import tsx tests/e2e/setup.ts && npm run dev -- --host 127.0.0.1 --port 4322',
    env: { LEARNAPROP_E2E: '1' },
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
    stdout: 'pipe',
    // Fixture migration/seeding and workerd compilation share the startup budget.
    timeout: 120000,
  },
});
