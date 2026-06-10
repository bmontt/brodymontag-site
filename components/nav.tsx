"use client";

import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "music", href: "#music" },
  { label: "code", href: "#code" },
  { label: "about", href: "#about" },
  { label: "contact", href: "#contact" },
];

const SECTIONS = ["music", "code", "about", "contact"];

export default function Nav() {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-40% 0px -50% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 border-b border-white/8"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-end px-6 py-5">
        <nav className="flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => {
            const id = href.replace("#", "");
            const isActive = active === id;
            return (
              <a
                key={href}
                href={href}
                className={`font-mono text-xs tracking-widest transition-colors duration-200 ${
                  isActive ? "text-accent/80" : "text-foreground/30 hover:text-foreground/70"
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
