// ── /machine/projects/<slug> ──────────────────────────────────────────────────
// One project page as text/plain: the card copy and the whole detail doc
// (lib/machine-pages.ts). Prerendered for every project; /machine and
// /llms.txt link here.
import { projects } from "@/lib/projects";
import { projectText } from "@/lib/machine-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const text = projectText((await params).slug);
  if (!text) return new Response("not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
