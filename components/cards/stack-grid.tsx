// ── StackGrid — server card lifted from app/page.tsx (stack .map block) ──
import { stack, type StackCategory } from "@/lib/stack-data";

export default function StackGrid({ categories = stack }: { categories?: StackCategory[] }) {
  return (
    <div className="flex flex-col gap-8">
      {categories.map((category) => (
        <div key={category.label}>
          <p className="font-mono text-xs text-iridescent-dim mb-3">{category.label}</p>
          <div className="flex flex-wrap gap-2">
            {category.items.map((item, i) => (
              <span
                key={item}
                className="pill-iridescent font-mono text-xs text-foreground/70 border border-white/10 px-3 py-1 hover:text-foreground/90 transition-colors"
                style={{ animationDelay: `${-((i * 1.37) % 4.2)}s` }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
