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

// the human pages only (the (site) route group); everything else is untouched.
// Client-side navigations and prefetches (RSC requests) skip it: only the app's
// own router sends those, never an agent — so moving between pages costs no
// proxy hop. (Static objects: Next reads this at build time.)
export const config = {
  matcher: [
    {
      source: "/",
      missing: [
        { type: "header", key: "rsc" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
    {
      source: "/software",
      missing: [
        { type: "header", key: "rsc" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
    {
      source: "/music",
      missing: [
        { type: "header", key: "rsc" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
    {
      source: "/about",
      missing: [
        { type: "header", key: "rsc" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
    {
      source: "/projects/:slug",
      missing: [
        { type: "header", key: "rsc" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
    {
      source: "/experience/:id",
      missing: [
        { type: "header", key: "rsc" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
    {
      source: "/shows/:slug",
      missing: [
        { type: "header", key: "rsc" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
  ],
};
