import Link from "next/link";
import { enterStyle } from "@/lib/enter";

export default function BackLink({ href = "/" }: { href?: string }) {
  return (
    <div className="enter mb-12" style={enterStyle({ x: -10, dur: 0.35 })}>
      <Link
        href={href}
        className="-my-2.5 inline-flex items-center gap-2 py-2.5 font-mono text-xs text-foreground/52 hover:text-foreground/75 transition-colors duration-200"
      >
        ← back
      </Link>
    </div>
  );
}
