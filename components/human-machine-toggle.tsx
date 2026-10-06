// ── human / machine toggle ────────────────────────────────────────────────────
// Switches between the site and its plain-text mirror (/machine). Plain links:
// works without JS, and crawlers follow it to the machine-readable index.
import Link from "next/link";

export default function HumanMachineToggle({ mode }: { mode: "human" | "machine" }) {
  const item = (active: boolean) =>
    `rounded-full px-2.5 py-1 transition-colors ${
      active ? "bg-foreground/90 text-background" : "text-foreground/45 hover:text-foreground/85"
    }`;
  return (
    <nav
      aria-label="view mode"
      className="fixed bottom-5 right-5 z-50 flex rounded-full border border-white/10 bg-background/70 p-0.5 font-mono text-[0.65rem] backdrop-blur-sm"
    >
      <Link href="/" aria-current={mode === "human" ? "page" : undefined} className={item(mode === "human")}>
        human
      </Link>
      <Link href="/machine" aria-current={mode === "machine" ? "page" : undefined} className={item(mode === "machine")}>
        machine
      </Link>
    </nav>
  );
}
