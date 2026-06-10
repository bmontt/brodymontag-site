"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { label: "Music", href: "#music" },
  { label: "Code", href: "#code" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const SECTIONS = ["music", "code", "about", "contact"];

export default function Nav() {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-40% 0px -50% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none" }}
      animate={{ backgroundColor: scrolled ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0)" }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
        style={{
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        }}
      >
        <a
          href="#"
          className="text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
        >
          BM
        </a>
        <nav className="flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => {
            const id = href.replace("#", "");
            const isActive = active === id;
            return (
              <a
                key={href}
                href={href}
                className={`text-xs uppercase tracking-widest transition-colors duration-200 ${
                  isActive
                    ? "text-yellow-400/80"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
