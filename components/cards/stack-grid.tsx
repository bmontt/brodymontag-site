// ── StackGrid ─────────────────────────────────────────────────────────────────
// Each stack category as a small widget of pills, two to a row on wider screens.
// A pill with a site (content.json code.stackLinks) links to it in a new tab.
import { stack, stackLinks, type StackCategory } from "@/lib/stack-data";
import { Widget } from "@/components/widgets";

const PILL = "pill pill-iridescent rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-2xs text-foreground/80";

export default function StackGrid({ categories = stack }: { categories?: StackCategory[] }) {
  return (
    <div className={categories.length > 1 ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : ""}>
      {categories.map((category) => (
        <Widget key={category.label} className="!p-5">
          <p className="mb-3 font-sans text-base font-medium tracking-[-0.01em] text-foreground">{category.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {category.items.map((item, i) => {
              const style = { animationDelay: `${-((i * 1.37) % 4.2)}s` };
              const href = stackLinks[item];
              return href ? (
                <a
                  key={item}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={new URL(href).hostname.replace(/^www\./, "")}
                  className={`${PILL} focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/60`}
                  style={style}
                >
                  {item}
                </a>
              ) : (
                <span key={item} className={`${PILL} cursor-default`} style={style}>
                  {item}
                </span>
              );
            })}
          </div>
        </Widget>
      ))}
    </div>
  );
}
