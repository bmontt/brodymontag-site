import { expect, test } from "@playwright/test";
import { DOCS } from "../content/detail/docs";

// a role's page (/experience/<id>): the project template, the role's facts and
// its detail doc. Employer work shows no code, no diagram and no figure of
// internal systems (docs/portfolio-style-plan.md §9).
const EMPLOYERS = ["fiserv", "galago"];
const ROLES = DOCS.filter((d) => d.kind === "experience");

test("the software tab links each role to its page", async ({ request }) => {
  const html = await (await request.get("/software")).text();
  for (const d of ROLES) expect(html, d.key).toContain(`href="/experience/${d.key}"`);
});

for (const d of ROLES) {
  test(`/experience/${d.key} renders its doc without JavaScript`, async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const res = await page.goto(`/experience/${d.key}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toContainText("experience");
    expect(await page.locator(`main time[datetime="${d.updated}"]`).count()).toBeGreaterThan(0);
    for (const s of d.sections) await expect(page.locator(`.detail-sections h2:has-text("${s.heading}")`)).toHaveCount(1);
    if (EMPLOYERS.includes(d.key)) await expect(page.locator(".detail-sections :is(.code-block, .diagram-block, .fig)")).toHaveCount(0);
    await ctx.close();
  });
}

test("a role without a doc still has a page", async ({ request }) => {
  const res = await request.get("/experience/umd");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("university of maryland");
});

test("an unknown role is a 404", async ({ request }) => {
  expect((await request.get("/experience/no-such-role")).status()).toBe(404);
});
