"use client";

// ── site nav ──────────────────────────────────────────────────────────────────
// The section pages' top bar: the name home on the left, the three sections on
// the right — each in its own scale (software white, music the pearlescent
// shimmer, about the blend of both). The landing page has no nav; it *is* the
// nav.

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/software", label: "software", tone: "" },
  { href: "/music", label: "music", tone: "text-shimmer" },
  { href: "/about", label: "about", tone: "text-blend" },
] as const;

export default function SiteNav() {
  const path = usePathname();
  const active = (href: string) =>
    path === href ||
    (href === "/software" && path.startsWith("/projects/")) ||
    (href === "/music" && path.startsWith("/shows/"));

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-6 py-5 md:px-12">
      <nav aria-label="site" className="mx-auto flex max-w-6xl items-baseline justify-between font-mono text-xs">
        <Link href="/" className="text-foreground/55 transition-colors hover:text-foreground">
          brody montag
        </Link>
        <div className="flex items-baseline gap-6">
          {LINKS.map(({ href, label, tone }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={`transition-opacity duration-200 ${tone} ${
                active(href) ? "opacity-100 underline decoration-white/25 underline-offset-[6px]" : "opacity-45 hover:opacity-90"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
