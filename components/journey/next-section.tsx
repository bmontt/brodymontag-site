// ── next section ──────────────────────────────────────────────────────────────
// The end of a section page hands off to the next one (software → music →
// about → back to the start) instead of dead-ending. The next page's word is
// the same <ViewTransition> as its title, so following it morphs the word into
// place; the laser layer starts drawing the next page's figure here as you
// approach ([data-laser-anchor="next-<id>"]).

import { Morph } from "@/components/morph";
import { DisplayWord } from "@/components/display-word";
import Link from "next/link";

export default function NextSection({
  href,
  id,
  word,
  tone,
  caption,
}: {
  href: string;
  /** the destination's chapter id ("music", "epilogue") or "home" */
  id: string;
  word: string;
  tone: string;
  caption: string;
}) {
  return (
    <section aria-label="next" className="relative z-20 px-6 pb-24 pt-40 md:px-12 md:pt-56">
      <div className="mx-auto max-w-6xl">
        <Link
          href={href}
          data-stage-id={`nav:${id}`}
          data-laser-anchor={`next-${id}`}
          className="group inline-block outline-none"
        >
          <Morph name={`title-${id}`}>
            <span
              className={`halo-none inline-block font-sans font-medium leading-[0.88] tracking-[-0.05em] transition-[letter-spacing] duration-500 group-hover:tracking-[-0.035em] ${tone}`}
              style={{ fontSize: "clamp(3rem, 11vw, 10rem)" }}
            >
              <DisplayWord text={word} tracking={-0.05} /> <span className="inline-block transition-transform duration-500 group-hover:translate-x-3">→</span>
            </span>
          </Morph>
          <span className="mt-4 block font-mono text-xs text-foreground/55 group-hover:text-foreground/70">{caption}</span>
        </Link>
      </div>
    </section>
  );
}
