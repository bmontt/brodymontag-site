// ── CollectiveCard — server card lifted from app/page.tsx (music collective tab) ──
import { content } from "@/lib/content";

type Meta = { label: string; value: string; href?: string };
type Affiliation = { label: string; value: string; href?: string; note: string };

export default function CollectiveCard() {
  const collective = content.music.collective;

  return (
    <div className="flex flex-col gap-8">
      {/* PB&J Sounds */}
      <div>
        <p className="font-mono text-sm text-foreground/85 mb-4">{collective.name}</p>
        <div className="flex flex-col gap-3 pl-3 border-l border-white/10">
          {(collective.meta as Meta[]).map(({ label, value, href }) => (
            <div key={label} className="grid grid-cols-[7rem_1fr] gap-x-6">
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
          <div key={aff.label} className="grid grid-cols-[6.5rem_1fr] gap-x-8">
            <span className="font-mono text-xs text-foreground/45 pt-0.5">{aff.label}</span>
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
