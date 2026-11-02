module.exports = {
  testDir: __dirname,
  testMatch: '**/*.spec.mjs',
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: 'line',
  outputDir: '../test-results',
  use: {
    baseURL: process.env.SBDIFF_BASE_URL || 'http://127.0.0.1:8000',
    browserName: 'chromium',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1000, height: 1100 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 1000 } } },
  ],
};
