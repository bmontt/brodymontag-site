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

// no switch in the UI: the proxy picks the face per client (lib/agent.ts)
const MIRROR = "MACHINE-READABLE INDEX";
const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0 Safari/537.36";
const cases: [string, Record<string, string>, "human" | "machine" | "text"][] = [
  ["a browser", { "user-agent": CHROME, accept: "text/html,*/*;q=0.8" }, "human"],
  ["Googlebot (no cloaking)", { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", accept: "text/html" }, "human"],
  ["a link unfurler", { "user-agent": "Slackbot-LinkExpanding 1.0", accept: "text/html" }, "human"],
  ["ClaudeBot", { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0)", accept: "text/html" }, "machine"],
  ["ChatGPT-User", { "user-agent": "Mozilla/5.0 (compatible; ChatGPT-User/1.0)", accept: "text/html" }, "machine"],
  ["curl", { "user-agent": "curl/8.7.1", accept: "*/*" }, "text"],
  ["an agent asking for markdown", { "user-agent": CHROME, accept: "text/markdown, text/html;q=0.5" }, "text"],
];
for (const [who, headers, want] of cases) {
  test(`${who} gets the ${want} view`, async ({ request }) => {
    const res = await request.get("/projects/superset", { headers });
    const body = await res.text();
    const type = res.headers()["content-type"];
    if (want === "human") {
      expect(type).toContain("text/html");
      expect(body).not.toContain(MIRROR);
    } else {
      expect(body).toContain(MIRROR);
      expect(type).toContain(want === "text" ? "text/plain" : "text/html");
    }
  });
}

test("?view=human overrides the guess", async ({ request }) => {
  const res = await request.get("/?view=human", { headers: { "user-agent": "curl/8.7.1" } });
  expect(await res.text()).not.toContain(MIRROR);
});
