// ── /machine ──────────────────────────────────────────────────────────────────
// The machine-readable face of the site: everything as plain text (lib/machine).
// No stage, no canvas; fully server-rendered (works without JavaScript) — it sits outside the (site) route group.
// Non-human visitors get it in place of the human pages (proxy.ts, lib/agent.ts).

import type { Metadata } from "next";
import Link from "next/link";
import { machineText } from "@/lib/machine";
import { alternates } from "@/lib/canonical";

export const metadata: Metadata = {
  title: { absolute: "Brody Montag :: machine" },
  description: "Plain-text, machine-readable mirror of brodymontag.com.",
  alternates: alternates("/machine"),
};

// absolute URLs and site paths become links for human readers of the mirror
const LINK = /(https?:\/\/[^\s<>)]+|\/(?:projects|shows)\/[\w-]+|\/llms\.txt)/g;
const ORIGIN = /^https:\/\/brodymontag\.com/;

function linkify(text: string) {
  return text.split(LINK).map((part, i) => {
    if (i % 2 === 0) return part;
    const local = part.startsWith("/") || ORIGIN.test(part);
    const href = part.replace(ORIGIN, "") || "/";
    return local ? (
      <Link key={i} href={href} className="underline decoration-white/20 underline-offset-2 hover:text-foreground">
        {part}
      </Link>
    ) : (
      <a key={i} href={part} rel="noopener noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-foreground">
        {part}
      </a>
    );
  });
}

export default function MachinePage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-24 pt-10 md:px-10">
      <pre className="mx-auto max-w-4xl whitespace-pre-wrap break-words font-mono text-2xs leading-relaxed text-foreground/85 md:text-xs">
        {linkify(machineText())}
      </pre>
    </main>
  );
}
