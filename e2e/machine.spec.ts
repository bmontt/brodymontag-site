import { expect, test } from "@playwright/test";

test("/machine is a readable plain-text mirror without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/machine");
  const text = await page.locator("pre").innerText();
  expect(text).toContain("MACHINE-READABLE INDEX");
  expect(text).toContain("## code / projects");
  expect(text).toContain("## music / shows");
  expect(await page.locator("canvas").count()).toBe(0);
  await ctx.close();
});

test("/llms.txt is text/plain in llmstxt.org shape", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("text/plain");
  const body = await res.text();
  expect(body).toMatch(/^# .+\n\n> /);
  expect(body).toContain("## Projects");
});

test("every page advertises the text alternate", async ({ page }) => {
  await page.goto("/?tier=2d");
  await expect(page.locator('link[rel="alternate"][type="text/plain"]')).toHaveAttribute("href", /llms\.txt$/);
});
