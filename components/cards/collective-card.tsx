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
        <p className="mb-4 flex items-center gap-2.5 font-mono text-sm text-foreground/85">
          <BrandIcon src={(collective as { icon?: string }).icon} size={22} round />
          {collective.name}
        </p>
        <div className="flex flex-col gap-3 pl-3 border-l border-white/10">
          {(collective.meta as Meta[]).map(({ label, value, href }) => (
            <div key={label} className="grid gap-y-0.5 sm:grid-cols-[7rem_1fr] sm:gap-x-6">
              <span className="font-mono text-xs text-foreground/35">{label}</span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-foreground/70 hover:text-accent/80 transition-colors"
                >
                  {value}&nbsp;↗
                </a>
              ) : (
                <span className="font-mono text-xs text-foreground/70">{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* affiliations */}
      <div className="flex flex-col gap-6">
        {(collective.affiliations as Affiliation[]).map((aff) => (
          <div key={aff.label} className="grid gap-y-0.5 sm:grid-cols-[6.5rem_1fr] sm:gap-x-8">
            <span className="flex items-start gap-2 pt-0.5 font-mono text-xs text-foreground/45">
              <BrandIcon src={aff.icon} size={14} />
              {aff.label}
            </span>
            <div>
              {aff.href ? (
                <a
                  href={aff.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-foreground/75 hover:text-accent/80 transition-colors"
                >
                  {aff.value}&nbsp;↗
                </a>
              ) : (
                <p className="font-mono text-xs text-foreground/75">{aff.value}</p>
              )}
              <p className="font-mono text-xs text-foreground/30 mt-0.5">{aff.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* scene */}
      <div>
        <p className="font-mono text-xs text-foreground/35 mb-3">scene</p>
        <p className="font-mono text-xs text-foreground/55 leading-relaxed">
          {collective.scene}
        </p>
      </div>
    </div>
  );
}
