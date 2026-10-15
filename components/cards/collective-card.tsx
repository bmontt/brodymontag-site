import { BrandIcon } from "@/components/widgets";
// ── CollectiveCard — server card lifted from app/page.tsx (music collective tab) ──
import { content } from "@/lib/content";

type Meta = { label: string; value: string; href?: string };
type Affiliation = { label: string; value: string; href?: string; note: string; icon?: string };

export default function CollectiveCard() {
  const collective = content.music.collective;

  return (
    <div className="flex flex-col gap-8">
      {/* PB&J Sounds */}
      <div>
        <p className="mb-4 flex items-center gap-2.5 font-mono text-sm text-foreground/90">
          <BrandIcon src={(collective as { icon?: string }).icon} size={22} round />
          {collective.name}
        </p>
        <div className="flex flex-col gap-3 pl-3 border-l border-white/10">
          {(collective.meta as Meta[]).map(({ label, value, href }) => (
            <div key={label} className="grid gap-y-0.5 sm:grid-cols-[7rem_1fr] sm:items-baseline sm:gap-x-6">
              <span className="font-mono text-xs text-foreground/60">{label}</span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="copy-sm hover:text-accent/80 transition-colors"
                >
                  {value}&nbsp;<span aria-hidden="true" className="font-mono opacity-60">↗</span>
                </a>
              ) : (
                <span className="copy-sm">{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* affiliations */}
      <div className="flex flex-col gap-6">
        {(collective.affiliations as Affiliation[]).map((aff) => (
          <div key={aff.label} className="grid gap-y-0.5 sm:grid-cols-[6.5rem_1fr] sm:gap-x-8">
            <span className="flex items-start gap-2 pt-0.5 font-mono text-xs text-foreground/60">
              <BrandIcon src={aff.icon} size={14} />
              {aff.label}
            </span>
            <div>
              {aff.href ? (
                <a
                  href={aff.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="copy-sm hover:text-accent/80 transition-colors"
                >
                  {aff.value}&nbsp;<span aria-hidden="true" className="font-mono opacity-60">↗</span>
                </a>
              ) : (
                <p className="copy-sm">{aff.value}</p>
              )}
              <p className="font-mono text-xs text-foreground/60 mt-0.5">{aff.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* scene */}
      <div>
        <p className="font-mono text-xs text-foreground/60 mb-3">scene</p>
        <p className="copy-sm">
          {collective.scene}
        </p>
      </div>
    </div>
  );
}
