import { defineConfig, devices } from "@playwright/test";

// e2e gate for the 3D stage (docs/3d-journey-plan.md §6). Runs against a dev
// server by default (the ?debug hooks are dev-only); set E2E_BASE_URL to aim it
// at a running server or a preview deployment instead.
// PW_CHROMIUM points at a locally cached browser when the bundled revision
// isn't installed (`npx playwright install chromium` otherwise).
const PORT = Number(process.env.E2E_PORT ?? 3200);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1, // one WebGL context at a time keeps headless GPU timing honest
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM || undefined,
      args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next dev -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
