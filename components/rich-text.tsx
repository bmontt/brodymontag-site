import type { ReactNode } from "react";

// Renders a content string with markdown-style inline links: [text](url).
// Used for prose stored in content.json (e.g. the About paragraphs).
export function renderInline(text: string): ReactNode[] {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <a
        key={key++}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground/85 underline underline-offset-4 decoration-white/20 hover:decoration-accent/50 transition-colors"
      >
        {m[1]}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
