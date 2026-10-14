import { chromium, defineConfig, devices } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// e2e gate for the 3D stage (docs/3d-journey-plan.md §6). Runs against a dev
// server by default (the ?debug hooks are dev-only); set E2E_BASE_URL to aim it
// at a running server or a preview deployment instead.
// Browser: PW_CHROMIUM if set, else the bundled revision, else the newest
// Chromium already in the local Playwright cache (macOS), so a version bump
// doesn't force a download; `npx playwright install chromium` otherwise.
function cachedChromium(): string | undefined {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  if (existsSync(chromium.executablePath())) return undefined;
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  if (!existsSync(cache)) return undefined;
  const app = "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
  return readdirSync(cache)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
    .flatMap((d) => ["chrome-mac-arm64", "chrome-mac-x64", "chrome-mac"].map((sub) => join(cache, d, sub, app)))
    .find(existsSync);
}

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
      executablePath: cachedChromium(),
      args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next dev -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
