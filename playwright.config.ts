import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results/playwright",
  fullyParallel: false,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:4179/native-nursery/", trace: "off" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4179",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
