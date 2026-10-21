"use client";
// ── block motion ──────────────────────────────────────────────────────────────
// The one script behind the detail blocks' motion (the motion itself is CSS:
// app/(site)/projects/[slug]/detail.css). It arms the page, then watches every
// [data-motion] element:
//   · data-in   — set once, when the element first comes into view: its
//                 entrance plays (a scan, a draw, a stagger)
//   · data-play — set while any of it is on screen: its loops run only then,
//                 so an off-screen figure costs no paint
// [data-decode] text inside an element that comes in resolves from glyphs to
// its value, the way the stage resolves cells to glyphs. Screen readers get the
// value from a hidden copy; the scrambled copy is aria-hidden.
// Without this script (or under reduced motion) nothing is held back: the CSS
// start states apply only inside [data-armed].

import { useEffect, useRef, type ReactNode } from "react";

const GLYPHS = "·:+=*#%01<>/[]{}";
const KEEP = new Set([" ", "·", ",", ".", "→", "−", "×"]);

function scrambled(target: string, fixed: number) {
  let s = target.slice(0, fixed);
  for (let i = fixed; i < target.length; i++) s += KEEP.has(target[i]) ? target[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
  return s;
}

/** the first frame at once (so the real value never shows before its turn),
 *  then the resolve after `delay` ms */
function decode(el: HTMLElement, delay: number) {
  const target = el.dataset.decode ?? "";
  const shown = el.querySelector<HTMLElement>("[data-decode-shown]");
  if (!shown || !target) return;
  shown.textContent = scrambled(target, 0);
  setTimeout(() => {
    const start = performance.now();
    const dur = 520 + target.length * 26;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      shown.textContent = t < 1 ? scrambled(target, Math.floor(t * target.length)) : target;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, delay);
}

/** a figure frame takes keyboard focus only while it scrolls (phones) */
function syncFocus(host: HTMLElement) {
  for (const f of host.querySelectorAll<HTMLElement>(".fig-frame")) {
    if (f.scrollWidth > f.clientWidth + 1) f.tabIndex = 0;
    else f.removeAttribute("tabindex");
  }
}

/** wraps the detail sections (server-rendered children pass straight through) */
export default function BlockMotion({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    syncFocus(host);
    const settle = requestAnimationFrame(() => syncFocus(host)); // after the first layout
    const onResize = () => syncFocus(host);
    window.addEventListener("resize", onResize);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const unlisten = () => {
      cancelAnimationFrame(settle);
      window.removeEventListener("resize", onResize);
    };
    if (reduce || !("IntersectionObserver" in window)) return unlisten;

    const seen = new WeakSet<Element>();
    // an entrance plays once: when the block's top passes 12% above the
    // viewport's foot (enter), or when all of it is on screen (play)
    const start = (el: HTMLElement) => {
      if (seen.has(el)) return;
      seen.add(el);
      el.dataset.in = "";
      const decodes = [...el.querySelectorAll<HTMLElement>("[data-decode]")];
      if (el.matches("[data-decode]")) decodes.unshift(el);
      for (const d of decodes) decode(d, Number(d.dataset.decodeDelay ?? 0));
      enter.unobserve(el);
    };
    const enter = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) start(e.target as HTMLElement);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    // loops run while any part is on screen; a block that is wholly on screen
    // has come in, even if it sits in the band that the entrance margin leaves
    // out (a short last block above a short footer)
    const play = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) el.dataset.play = "";
          else delete el.dataset.play;
          if (e.intersectionRatio > 0.98) start(el);
        }
      },
      { threshold: [0, 1] },
    );
    const watch = (el: HTMLElement) => {
      enter.observe(el);
      play.observe(el);
    };
    // blocks already in view when the page arms (a tall screen, a restored
    // scroll) start in the same frame, so they never blink out first
    for (const el of host.querySelectorAll<HTMLElement>("[data-motion]")) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.88 && r.bottom > 0) start(el);
      watch(el);
    }
    // blocks that arrive later (a hot reload while writing a doc) are watched too
    // (the decode's own text swaps add only text nodes, and pass straight by)
    const added = new MutationObserver((records) => {
      let grew = false;
      for (const rec of records)
        for (const n of rec.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          grew = true;
          if (n.matches("[data-motion]")) watch(n);
          n.querySelectorAll<HTMLElement>("[data-motion]").forEach(watch);
        }
      if (grew) syncFocus(host);
    });
    added.observe(host, { childList: true, subtree: true });
    host.dataset.armed = "";
    return () => {
      unlisten();
      enter.disconnect();
      play.disconnect();
      added.disconnect();
      delete host.dataset.armed;
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
