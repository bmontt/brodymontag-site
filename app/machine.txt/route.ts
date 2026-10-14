// ── /machine.txt ──────────────────────────────────────────────────────────────
// The machine mirror as raw text/plain — what command-line clients and agents
// that prefer text get when they ask for a human page (proxy.ts).
import { machineText } from "@/lib/machine";

export const dynamic = "force-static";

export function GET() {
  return new Response(machineText() + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
