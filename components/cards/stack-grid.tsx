// ── StackGrid ─────────────────────────────────────────────────────────────────
// Each stack category as a small widget of pills, two to a row on wider screens.
import { stack, type StackCategory } from "@/lib/stack-data";
import { Widget } from "@/components/widgets";

export default function StackGrid({ categories = stack }: { categories?: StackCategory[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {categories.map((category) => (
        <Widget key={category.label} className="!p-5">
          <p className="mb-3 font-sans text-base font-medium tracking-[-0.01em] text-foreground">{category.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {category.items.map((item, i) => (
              <span
                key={item}
                className="pill pill-iridescent cursor-default rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-foreground/80"
                style={{ animationDelay: `${-((i * 1.37) % 4.2)}s` }}
              >
                {item}
              </span>
            ))}
          </div>
        </Widget>
      ))}
    </div>
  );
}
