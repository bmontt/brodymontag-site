// ── agent ─────────────────────────────────────────────────────────────────────
// Who is asking? Decides whether a request for a human page should get the
// machine view instead (proxy.ts). There is no switch in the UI: people get the
// journey, machines get text.
//
//   "text"    → plain text (/machine.txt): command-line and library HTTP clients,
//               an empty user agent, or an Accept header that prefers
//               text/plain or text/markdown over text/html
//   "machine" → the linked plain-text mirror (/machine): AI crawlers, assistants
//               and agents that identify themselves
//   "human"   → the journey: browsers, plus search-engine crawlers and link
//               unfurlers. Search engines render JS and serving them a
//               different page would count as cloaking; unfurlers need the
//               page's Open Graph tags.
// ?view=human|machine|text overrides the guess (for testing and for anyone
// who wants the other face).

export type View = "human" | "machine" | "text";

// self-identified AI crawlers / assistants / agents
const AI = /\b(GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|Claude-Web|anthropic-ai|PerplexityBot|Perplexity-User|CCBot|Bytespider|Amazonbot|meta-externalagent|meta-externalfetcher|FacebookBot|cohere-ai|cohere-training-data-crawler|YouBot|DuckAssistBot|MistralAI-User|Diffbot|AI2Bot|Ai2Bot-Dolma|PetalBot|Timpibot|ImagesiftBot|Kangaroo Bot|omgili|Google-CloudVertexBot|GoogleAgent|Devin|Manus)\b/i;

// HTTP libraries and command-line clients
const CLIENT = /^(curl|Wget|HTTPie|xh|python-requests|python-httpx|Python-urllib|aiohttp|Go-http-client|node-fetch|undici|axios|got|okhttp|Java|Apache-HttpClient|libwww-perl|Ruby|Faraday|reqwest|Deno|Bun|Dart|PostmanRuntime|insomnia)\b/i;

// these must keep seeing the human page
const KEEP_HUMAN = /(Googlebot|Google-InspectionTool|Storebot-Google|AdsBot-Google|bingbot|BingPreview|DuckDuckBot|Applebot|YandexBot|Baiduspider|Slurp|Twitterbot|facebookexternalhit|Slackbot|Discordbot|LinkedInBot|WhatsApp|TelegramBot|Embedly|redditbot|Pinterestbot|SkypeUriPreview|iMessage|vercel-screenshot|Lighthouse|Chrome-Lighthouse|PageSpeed)/i;

/** q-weighted preference for a media type in an Accept header (0 if absent). */
function q(accept: string, type: string): number {
  let best = 0;
  for (const part of accept.split(",")) {
    const [range, ...params] = part.trim().split(";").map((s) => s.trim());
    if (range.toLowerCase() !== type) continue;
    const qp = params.find((p) => p.startsWith("q="));
    best = Math.max(best, qp ? Number(qp.slice(2)) || 0 : 1);
  }
  return best;
}

export function viewFor(userAgent: string | null, accept: string | null, override?: string | null): View {
  if (override === "human" || override === "machine" || override === "text") return override;
  const ua = (userAgent ?? "").trim();
  const acc = accept ?? "";
  if (KEEP_HUMAN.test(ua)) return "human";
  const html = q(acc, "text/html");
  if (Math.max(q(acc, "text/markdown"), q(acc, "text/plain")) > html) return "text";
  if (!ua || CLIENT.test(ua)) return "text";
  if (AI.test(ua)) return "machine";
  return "human";
}
