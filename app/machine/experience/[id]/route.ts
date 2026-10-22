// ── /machine/experience/<id> ──────────────────────────────────────────────────
// One experience page as text/plain: the card copy and the detail doc, where
// one exists (lib/machine-pages.ts). Prerendered for every role; /machine and
// /llms.txt link here.
import { experience } from "@/lib/stack-data";
import { experienceText } from "@/lib/machine-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return experience.map((e) => ({ id: e.id }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const text = experienceText((await params).id);
  if (!text) return new Response("not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
