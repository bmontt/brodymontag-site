// ── ShowCard — server card lifted from app/page.tsx (shows .map block) ──
import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/brody-events";

export default function ShowCard({ event }: { event: Event }) {
  const firstImage = event.media.find((m) => m.type === "image");

  return (
    <Link href={`/shows/${event.slug}`} className="group block">
      <div className="grid grid-cols-[6.5rem_1fr] gap-x-8 items-start -mx-3 px-3 py-2.5 hover:bg-white/[0.025] transition-colors duration-150">
        <span className="font-mono text-xs text-muted-foreground/70 pt-0.5 shrink-0">
          {event.date.toLowerCase()}
        </span>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="font-mono text-sm text-foreground/85 group-hover:text-foreground/95 leading-snug transition-colors duration-150">
              {event.title.toLowerCase()}
              <span className="ml-2 text-foreground/28 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs">→</span>
            </p>
            {event.description && (
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                {event.description.toLowerCase()}
              </p>
            )}
          </div>
          {firstImage && (
            // CSS group-hover replaces the old framer whileHover filter reveal
            <div className="hidden sm:block shrink-0 h-12 w-16 overflow-hidden border border-white/8 grayscale brightness-[0.72] contrast-[1.12] transition-[filter,border-color] duration-300 group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100 group-hover:border-white/20">
              <Image
                src={firstImage.src}
                alt=""
                width={128}
                height={96}
                loading="lazy"
                className="h-full w-full object-cover"
                sizes="64px"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
