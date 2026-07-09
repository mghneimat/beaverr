// @ts-check
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8081';

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
  },
});
