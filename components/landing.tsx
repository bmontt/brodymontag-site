"use client";

// ── landing ───────────────────────────────────────────────────────────────────
// The front door, split down the middle. The name types in; the rule under it
// carries the two signals — white (tech) on the left half, pearlescent (sound)
// on the right, meeting in the middle (the laser layer draws them on
// [data-laser-anchor="rule"]). Below: the two halves as big choices, software
// left and music right, and "about me" staggered beneath, where they meet.
// Hovering a choice wakes its figure behind it (the knot, the fans, the
// orbit — lib/director/laser.ts, "home"); picking one bursts it on the way out.

import Link from "next/link";
import type { NowLines } from "@/lib/now";
import { enterStyle } from "@/lib/enter";
import TypedHeading from "@/components/typed-heading";
import { ICONS } from "@/lib/platform-data";
import { content } from "@/lib/content";
import { glow } from "@/lib/glow";
import { useEffect, useRef, type CSSProperties } from "react";
import { Morph, PageTransition } from "@/components/morph";

const j = content.journey as Record<string, { heading: string }>;
const caption = (id: string) => j[id].heading.split(" — ").pop()!.replace(/\.$/, "");
const LINKS = content.hero.links.map((l) => ({ ...l, icon: ICONS[l.icon] }));

// `vt` pairs each word with its page's title (<ViewTransition name="title-…">)
const OPTIONS = [
  { href: "/software", id: "software", vt: "code", key: "s", label: "software", caption: caption("code"), tone: "text-foreground",
    place: "md:justify-self-start md:text-left", size: "clamp(3.25rem, 10vw, 9rem)" },
  { href: "/music", id: "music", vt: "music", key: "m", label: "music", caption: caption("music"), tone: "text-shimmer",
    place: "md:justify-self-end md:text-right", size: "clamp(3.25rem, 10vw, 9rem)" },
  { href: "/about", id: "about", vt: "epilogue", key: "a", label: "about me", caption: caption("epilogue"), tone: "text-blend",
    place: "md:col-span-2 md:justify-self-center md:text-center", size: "clamp(2.6rem, 7.5vw, 6.75rem)" },
] as const;

export default function Landing({ now }: { now: NowLines | null }) {
  // the entrances (globals.css .enter) wait for hydration, where the name
  // starts typing, so the choreography holds on any device
  const gate = useRef<HTMLElement>(null);
  useEffect(() => {
    gate.current?.setAttribute("data-ready", "");
  }, []);

  // s / m / a pick a half from the keyboard (through the link, so the exit
  // burst and the morph play the same as a click)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, [contenteditable]")) return;
      const o = OPTIONS.find((x) => x.key === e.key.toLowerCase());
      document.querySelector<HTMLAnchorElement>(`nav[aria-label="sections"] a[href="${o?.href}"]`)?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const rise = (i: number) => enterStyle({ y: 28, blur: 8, dur: 0.9, delay: 1.15 + i * 0.16, ease: "cubic-bezier(0.22, 1, 0.36, 1)" });

  return (
    <PageTransition>
    <main
      ref={gate}
      data-gate
      id="landing"
      className="relative z-20 flex min-h-svh flex-col items-center justify-center px-6 py-24 md:px-12"
    >
      <Morph name="title-home">
      <h1
        className="text-iridescent-stroke text-center font-sans font-light text-foreground"
        style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
      >
        <TypedHeading
          text={content.hero.name}
          typos={[
            { at: 2, wrong: "ad" },
            { at: 12, wrong: "e", noticeMs: 340 },
          ]}
          startDelay={150}
        />
      </h1>
      </Morph>

      {/* the split rule — the laser layer draws the two signals here */}
      <div aria-hidden="true" data-laser-anchor="rule" className="my-8 h-8 w-full max-w-6xl md:my-12" />

      <nav aria-label="sections" className="landing-opts grid w-full max-w-6xl grid-cols-1 gap-y-10 md:grid-cols-2 md:gap-y-6">
        {OPTIONS.map((o, i) => (
          <div key={o.id} className={`enter enter-blur landing-opt ${o.place}`} style={rise(i)}>
            <Link
              href={o.href}
              data-stage-id={`nav:${o.id}`}
              data-laser-anchor={`opt-${o.id}`}
              className="group inline-block outline-none"
            >
              <Morph name={`title-${o.vt}`}>
                <span
                  className={`inline-block font-sans font-medium leading-[0.9] tracking-[-0.045em] transition-[letter-spacing] duration-500 group-hover:tracking-[-0.03em] group-focus-visible:tracking-[-0.03em] ${o.tone}`}
                  style={{ fontSize: o.size }}
                >
                  {o.label}
                </span>
              </Morph>
              <span className="mt-3 block font-mono text-xs text-foreground/35 transition-colors duration-300 group-hover:text-foreground/70">
                {o.caption}
                <kbd className="ml-3 hidden rounded-sm border border-white/10 px-1 text-[10px] text-foreground/30 md:inline">{o.key}</kbd>
              </span>
              {now && now[o.id as keyof NowLines] && <span className="mt-1.5 block font-mono text-xs text-foreground/50">
                <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${o.id === "software" ? "bg-foreground/70" : o.id === "music" ? "bg-iridescent" : "bg-foreground/40"} now-pulse`} />
                {now[o.id as keyof NowLines]}
              </span>}
            </Link>
          </div>
        ))}
      </nav>

      {/* the entrance on its own box: .iri-cycle runs an animation of its own */}
      <div className="enter absolute bottom-8" style={enterStyle({ dur: 0.8, delay: 1.9 })}>
      <div className="iri-cycle flex items-center gap-5">
        {LINKS.map(({ id, icon: Icon, href, label, glowRgb }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="social-link"
            style={{ "--glow": glow(glowRgb, 1) } as CSSProperties}
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
      </div>
    </main>
    </PageTransition>
  );
}
