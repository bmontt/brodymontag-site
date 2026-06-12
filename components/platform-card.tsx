"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlatformData } from "@/lib/platform-data";

type Props = Omit<PlatformData, "id">;

export default function PlatformCard({
  name,
  handle,
  href,
  icon: Icon,
  glowRgb,
  stat,
  details,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    const el = glowRef.current;
    if (!rect || !el) return;
    el.style.setProperty("--mx", (e.clientX - rect.left) + "px");
    el.style.setProperty("--my", (e.clientY - rect.top) + "px");
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setExpanded((v) => !v)}
      className="relative overflow-hidden border border-white/8 transition-[border-color] duration-200 hover:border-white/20 cursor-pointer select-none"
    >
      {/* cursor glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          ["--mx" as string]: "0px",
          ["--my" as string]: "0px",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.35s ease",
          background: `radial-gradient(circle 220px at var(--mx) var(--my), rgba(${glowRgb}, 0.10), transparent 72%)`,
        }}
      />

      {/* content */}
      <div className="relative z-10 p-5">
        {/* logo row — icon is the visual anchor */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3.5">
            {/* icon box */}
            <div
              className="flex items-center justify-center w-9 h-9 border border-white/10 shrink-0"
              style={{
                background: `rgba(${glowRgb}, 0.06)`,
                transition: "background 0.3s ease, border-color 0.3s ease",
                ...(hovered && {
                  background: `rgba(${glowRgb}, 0.12)`,
                  borderColor: `rgba(${glowRgb}, 0.30)`,
                }),
              }}
            >
              <Icon
                className="h-5 w-5"
                style={{
                  color: `rgba(${glowRgb}, ${hovered ? "0.95" : "0.65"})`,
                  transition: "color 0.3s ease",
                }}
              />
            </div>
            <div>
              <p className="font-mono text-xs text-foreground/85 tracking-wide">{name}</p>
              <p className="font-mono text-xs text-foreground/38 mt-0.5">{handle}</p>
            </div>
          </div>
          {stat && (
            <div className="text-right">
              <p className="font-mono text-xl font-light text-foreground/80 leading-none">
                {stat.value}
              </p>
              <p className="font-mono text-xs text-foreground/28 mt-1">{stat.label}</p>
            </div>
          )}
        </div>

        {/* expandable details */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-1 border-t border-white/8 flex flex-col gap-2.5">
                {details.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <span className="font-mono text-xs text-foreground/32 shrink-0">
                      {d.label}
                    </span>
                    {d.href ? (
                      <a
                        href={d.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-xs text-foreground/62 hover:text-accent/80 transition-colors text-right"
                      >
                        {d.value}&nbsp;↗
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-foreground/62 text-right">
                        {d.value}
                      </span>
                    )}
                  </div>
                ))}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1.5 font-mono text-xs transition-colors"
                  style={{
                    color: `rgba(${glowRgb}, 0.55)`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = `rgba(${glowRgb}, 0.90)`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = `rgba(${glowRgb}, 0.55)`;
                  }}
                >
                  view profile&nbsp;↗
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* expand hint */}
        <p className="mt-3 font-mono text-xs text-foreground/18">
          {expanded ? "collapse ↑" : "expand ↓"}
        </p>
      </div>
    </div>
  );
}
