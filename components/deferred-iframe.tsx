"use client";

// ── deferred-iframe ───────────────────────────────────────────────────────────
// A third-party embed (the SoundCloud player: ~3 MB of script) that waits for
// the page: it starts loading only once this page has loaded and gone idle, and
// it's within a screen and a half of view. Until then the same iframe holds
// its exact box, empty and hidden (an about:blank in a dark page would flash
// white).

import { useEffect, useRef, useState, type IframeHTMLAttributes } from "react";

export default function DeferredIframe({ src, style, ...rest }: IframeHTMLAttributes<HTMLIFrameElement> & { src: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let io: IntersectionObserver | null = null;
    let idle = 0;
    const ric = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    const arm = () => {
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          setGo(true);
          io?.disconnect();
        },
        { rootMargin: "150% 0px" },
      );
      io.observe(el);
    };
    const afterLoad = () => {
      idle = ric(arm, { timeout: 2000 });
    };
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
    return () => {
      io?.disconnect();
      window.removeEventListener("load", afterLoad);
      cic(idle);
    };
  }, []);

  return <iframe ref={ref} {...rest} src={go ? src : undefined} style={go ? style : { ...style, visibility: "hidden" }} />;
}
