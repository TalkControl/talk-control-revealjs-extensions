import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: 'html',
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
    ],
    webServer: {
        command: `npx vite --config vite.demo.config.ts --port ${PORT} --strictPort --no-open --host 127.0.0.1`,
        url: `${BASE_URL}/index.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
