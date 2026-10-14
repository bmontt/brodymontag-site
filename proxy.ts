// ── proxy ─────────────────────────────────────────────────────────────────────
// Serves the machine face of the site to non-human visitors (lib/agent.ts):
// the human pages are rewritten in place, so an agent fetching
// brodymontag.com/ gets the plain-text mirror at the same URL.

import { NextResponse, type NextRequest } from "next/server";
import { viewFor } from "@/lib/agent";

export function proxy(request: NextRequest) {
  const view = viewFor(
    request.headers.get("user-agent"),
    request.headers.get("accept"),
    request.nextUrl.searchParams.get("view"),
  );
  const res =
    view === "human"
      ? NextResponse.next()
      : NextResponse.rewrite(new URL(view === "text" ? "/machine.txt" : "/machine", request.url));
  // the same URL answers differently per client — keep shared caches honest
  res.headers.set("Vary", "User-Agent, Accept");
  return res;
}

export const config = {
  // the human pages only (the (site) route group); everything else is untouched
  matcher: ["/", "/software", "/music", "/about", "/projects/:slug", "/shows/:slug"],
};
