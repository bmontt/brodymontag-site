import { expect, test } from "@playwright/test";
import { scrollThrough, stageDebug, tier, trackErrors, waitForStage } from "./helpers";

// The stage gate: the landing and its section pages, tier selection, the
// single-writer scroll contract, page transitions, detail pages in both tiers,
// the 2D laser, fallbacks, and the 2D↔GPU parity.

test("landing: the name, then software · music · about me", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/?tier=2d");
  await expect(page.locator("h1")).toBeVisible();
  const opts = page.locator('nav[aria-label="sections"] a');
  await expect(opts).toHaveCount(3);
  expect(await opts.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(["/software", "/music", "/about"]);
  await opts.nth(1).click();
  await expect(page).toHaveURL(/\/music$/);
  await expect(page.locator("#music h2")).toBeVisible();
  expect(errors).toEqual([]);
});

test("3D tier: a full scroll of a section page keeps React out of the frame loop", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/about?tier=3d&debug");
  await waitForStage(page);
  const commits = () =>
    page.evaluate(() => (window as unknown as { __journeyCommits?: number }).__journeyCommits ?? 0);
  // let any mount-time commits settle — scrolling must not add per-frame ones
  let before = -1;
  for (let now = await commits(); now !== before; now = await commits()) {
    before = now;
    await page.waitForTimeout(1500);
  }
  await scrollThrough(page);
  expect((await commits()) - before).toBeLessThanOrEqual(4);
  const d = await stageDebug(page);
  expect(d.g).toBeGreaterThan(0.98);
  expect(errors).toEqual([]);
});

test("section bounds are measured from the chapters on the page", async ({ page }) => {
  await page.goto("/about?tier=3d&debug");
  await waitForStage(page);
  // epilogue, then the timeline coda (the debug snapshot refreshes every 500ms)
  await expect.poll(async () => (await stageDebug(page)).bounds.length).toBe(2);
  const { bounds } = await stageDebug(page);
  expect(bounds[1]).toBeGreaterThan(bounds[0]);
  expect(bounds[1]).toBeLessThan(0.99);
});

test("reduced motion gets the 2D tier", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect.poll(() => tier(page)).toBe("2d");
  expect(await page.evaluate(() => document.documentElement.dataset.stageReason)).toBe("reduced-motion");
  await ctx.close();
});

// the 2D tier draws the same laser piece (CPU)
// lit pixels on the 2D tier's canvas — asked of whoever paints it (a worker
// owns the canvas where OffscreenCanvas works)
const litPixels = (page: import("@playwright/test").Page) =>
  page.evaluate(async () => {
    const lit = (window as unknown as { __laser2dLit?: () => Promise<number> }).__laser2dLit;
    return lit ? lit() : -1;
  });

test("2D tier draws the laser layer, with motion and without", async ({ browser }) => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    const ctx = await browser.newContext({ reducedMotion });
    const page = await ctx.newPage();
    await page.goto("/?tier=2d");
    await expect.poll(() => litPixels(page)).toBeGreaterThan(200); // the split rule
    await page.goto("/software?tier=2d");
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect.poll(() => litPixels(page)).toBeGreaterThan(200); // the knot
    await ctx.close();
  }
});

test("2D tier: project links navigate normally", async ({ page }) => {
  await page.goto("/software?tier=2d");
  await expect.poll(() => tier(page)).toBe("2d");
  const link = page.locator('[data-stage-id^="project:"] a[href^="/projects/"]').first();
  const href = await link.getAttribute("href");
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator("h1")).toBeVisible();
});

test("3D tier: picking a section bursts its figure, then the page changes", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/?tier=3d&debug");
  await waitForStage(page);
  await page.locator('[data-stage-id="nav:software"]').click();
  // the beat: the burst plays on the landing before the route changes
  await page.waitForTimeout(100);
  expect(new URL(page.url()).pathname).toBe("/");
  await expect(page).toHaveURL(/\/software$/);
  await expect.poll(async () => (await stageDebug(page)).focus.route).toBe("software:-1");
  // and on into a project
  const link = page.locator('[data-stage-id^="project:"] a[href^="/projects/"]').first();
  const href = await link.getAttribute("href");
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect.poll(async () => (await stageDebug(page)).focus.route).toMatch(/^project:\d+$/);
  await expect(page.locator("h1")).toBeVisible();
  expect(errors).toEqual([]);
});

for (const t of ["2d", "3d"] as const) {
  test(`detail pages render in the ${t} tier`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/music?tier=${t}`);
    const show = await page.locator('[data-stage-id^="show:"] a[href^="/shows/"]').first().getAttribute("href");
    await page.goto(`${show}?tier=${t}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect.poll(() => tier(page)).toBe(t);
    await expect(page.locator('header nav a[aria-current="page"]')).toHaveText("music");
    expect(errors).toEqual([]);
  });
}

test("lab: GPU cell levels match the 2D bake", async ({ page }) => {
  await page.goto("/lab/3d?parity");
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const fn = (window as unknown as { __parityCheck?: () => Promise<{ matchPct?: number }> }).__parityCheck;
          return fn ? ((await fn()).matchPct ?? 0) : 0;
        }),
      { timeout: 30_000 },
    )
    .toBeGreaterThan(99);
});

test("adaptive quality: sustained slow frames step dpr down, then fall back to 2D", async ({ browser }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("/?tier=3d&debug");
  await waitForStage(page);
  const quality = () => page.evaluate(() => document.documentElement.dataset.stageQuality);
  expect(await quality()).toBe("2");
  // a steady 70ms per frame (~14fps): slow, without the >250ms gaps the
  // governor reads as browser throttling
  await page.evaluate(() => ((window as unknown as { __stageBurnMs: number }).__stageBurnMs = 70));
  await expect.poll(quality, { timeout: 30_000 }).not.toBe("2"); // 1.5, or already 1 between polls
  await expect.poll(() => tier(page), { timeout: 45_000 }).toBe("2d");
  await ctx.close();
});

test("a lost WebGL context drops back to the 2D tier, never a blank stage", async ({ page }) => {
  await page.goto("/?tier=3d&debug");
  await waitForStage(page);
  await page.evaluate(() => {
    // the stage's canvas — a 2D canvas answers getContext("webgl2") with null,
    // and one handed to a worker throws
    for (const c of document.querySelectorAll("canvas")) {
      try {
        c.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {}
    }
  });
  await expect.poll(() => tier(page)).toBe("2d");
  await expect(page.locator("canvas")).not.toHaveCount(0);
});

test("a WebGL context that fails to create falls back to 2D (probe passed, canvas didn't)", async ({ page }) => {
  // the tier probe gets its context; every later WebGL context fails, the way a
  // disabled or crashed GPU process behaves
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const attrs = rest[0] as { failIfMajorPerformanceCaveat?: boolean } | undefined;
      const probe = attrs?.failIfMajorPerformanceCaveat === true; // stage-root's tier probe
      if ((type === "webgl2" || type === "webgl") && !probe) return null;
      return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof orig;
  });
  await page.goto("/?debug");
  await expect.poll(() => tier(page)).toBe("2d");
  expect(await page.evaluate(() => document.documentElement.dataset.stageReason)).toBe("context-failed");
  await expect(page.locator("h1")).toBeVisible();
});

test("runtime feature flags: ?ff= toggles, persists, and resets", async ({ page }) => {
  const flags = () =>
    page.evaluate(() => (window as unknown as { __flags?: Record<string, boolean> }).__flags ?? null);
  await page.goto("/?tier=3d&ff=room,-wipe");
  await expect.poll(async () => (await flags())?.room).toBe(true);
  expect((await flags())?.wipe).toBe(false);
  expect((await flags())?.titles).toBe(false); // untouched: its default
  await page.goto("/software?tier=3d"); // remembered
  await expect.poll(async () => (await flags())?.room).toBe(true);
  await page.goto("/?tier=3d&ff=reset");
  await expect.poll(async () => (await flags())?.room).toBe(false);
  expect((await flags())?.wipe).toBe(true);
});

test("the entering page layer is see-through, so the morphing title and the stage show through it", async ({ page }) => {
  // the page's view-transition snapshot is painted above the title's and the
  // stage's: an opaque background there hides the morph until it ends (the
  // title fades out, then pops back)
  await page.goto("/software?tier=2d");
  const wrapper = page.locator("#journey").locator("xpath=..");
  expect(await wrapper.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
});

test("the timeline's road has a car on it (both tiers draw the projected segments)", async ({ page }) => {
  await page.goto("/about?tier=3d&debug");
  await waitForStage(page);
  const top = await page.evaluate(() => document.getElementById("timeline")!.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), top + 300);
  await expect.poll(async () => (await stageDebug(page)).tl, { timeout: 10_000 }).toBeGreaterThan(0);
  // the car's 18 strokes (room off): body, tail lights, their glow on the road
  await expect.poll(async () => (await stageDebug(page)).segs).toBeGreaterThanOrEqual(18);
});

test("2D tier paints in a worker where its glyphs can match the page", async ({ page }) => {
  await page.goto("/software?tier=2d");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __laser2dMode?: string }).__laser2dMode)).toBe("worker");
  await expect.poll(() => litPixels(page)).toBeGreaterThan(200);
});
