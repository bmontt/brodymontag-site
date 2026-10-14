// ── morph ─────────────────────────────────────────────────────────────────────
// View-transition wrappers behind the `morph` build flag (lib/flags.ts):
//   <Morph name="title-music">  a shared element — the same name on two pages
//                               morphs one into the other during navigation
//   <PageTransition>            the page's enter/exit (globals.css page-enter /
//                               page-exit)
// With the flag off they render their children untouched.

import { ViewTransition, type ReactNode } from "react";
import { flag } from "@/lib/flags";

export function Morph({ name, children }: { name: string; children: ReactNode }) {
  if (!flag("morph")) return <>{children}</>;
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  if (!flag("morph")) return <>{children}</>;
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
