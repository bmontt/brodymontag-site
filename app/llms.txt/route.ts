// ── /llms.txt ─────────────────────────────────────────────────────────────────
// llmstxt.org summary for language models, generated from content.json.
import { llmsText } from "@/lib/machine";

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText(), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
