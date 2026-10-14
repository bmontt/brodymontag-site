import { expect, type Page } from "@playwright/test";

type StageDebug = {
  g: number;
  bounds: number[];
  focus: { route: string; hover: string | null; fly: boolean };
  fps: number;
};

/** Collect console errors / page errors for the life of the page. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

export const tier = (page: Page) => page.evaluate(() => document.documentElement.dataset.stageTier);

/** Wait until the 3D stage has painted its first frame and published debug state. */
export async function waitForStage(page: Page) {
  await expect.poll(() => tier(page)).toBe("3d");
  await expect
    .poll(() => page.evaluate(() => !!(window as unknown as { __stageDebug?: unknown }).__stageDebug), {
      timeout: 30_000,
    })
    .toBe(true);
}

export const stageDebug = (page: Page) =>
  page.evaluate(() => (window as unknown as { __stageDebug: StageDebug }).__stageDebug);

/** Scroll the whole document in viewport-sized steps, letting ScrollTrigger settle. */
export async function scrollThrough(page: Page, stepVh = 0.8) {
  const { h, total } = await page.evaluate(() => ({
    h: window.innerHeight,
    total: document.documentElement.scrollHeight,
  }));
  for (let y = 0; y < total; y += h * stepVh) {
    await page.mouse.wheel(0, h * stepVh);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(800);
}
