const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', timeout: 45000, workers: 1,
  reporter: [['list']],
  globalTeardown: './tests/stop-preview.cjs',
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium',
    launchOptions: process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : process.platform==='win32' ? {executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'} : {},
    reducedMotion: 'reduce' },
  webServer: { command: 'node scripts/serve.mjs --qa', env:{PORT:'4173'}, url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI }
});
