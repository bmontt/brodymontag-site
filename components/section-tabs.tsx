"use client";

import { motion } from "framer-motion";

export interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  layoutId?: string;
}

export function TabBar({ tabs, active, onChange, layoutId = "tab-underline" }: TabBarProps) {
  return (
    <div
      className="flex items-center border-b border-white/8 mb-10"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative font-mono text-xs px-4 py-2.5 outline-none transition-colors duration-150 ${
            active === tab.id
              ? "text-foreground/85"
              : "text-foreground/35 hover:text-foreground/60"
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <motion.div
              layoutId={layoutId}
              className="absolute bottom-0 left-0 right-0 h-px bg-accent/70"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
