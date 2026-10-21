// ── ste-rules ─────────────────────────────────────────────────────────────────
// The ASD-STE100 checks the software tab's copy must pass (docs/portfolio-
// style-plan.md §4, §6): sentence length, contractions, "-ing" verb forms,
// perfect tenses, dashes or semicolons between clauses, and words the plan
// replaces. Technical names stay allowed; the allow lists below hold them.
// Used by scripts/ste-lint.mjs (content.json, and the detail docs where Node
// can load them) and by content/detail/index.ts, which fails the build when a
// detail doc does not pass.

const MAX_WORDS = 25;
// words the STE table and the plan's word map replace (lowercase, whole words)
const BANNED = [
  "ensure", "utilize", "utilise", "perform", "prior to", "commence", "initiate", "terminate", "obtain", "assist",
  "facilitate", "modify", "attempt", "sufficient", "numerous", "in order to", "basically", "actually", "just",
  "simply", "really", "quite", "pretty much", "research-grade", "autonomous", "governed", "control plane",
  "agentic", "fleet", "real-time", "optimized", "trustworthy", "rigor", "craft", "a lot of", "designed for",
  "cutting-edge", "seamless", "seamlessly", "robust", "powerful", "leverage", "world-class", "state-of-the-art",
];
// "-ing" words that are not verb forms, or are technical names
const ING_OK = new Set([
  "during", "string", "strings", "thing", "things", "something", "anything", "everything", "nothing", "spring",
  "bring", "ring", "king", "ceiling", "settings", "setting",
  // nouns, not verb forms: a recording, a smoothing (the filter step)
  "recording", "recordings", "smoothing",
]);
// technical names that end in "-ing": STE allows them as names
const TECH = ["normal hearing", "travelling-salesman", "machine learning", "deep learning", "deep-learning", "signal processing", "hearing loss", "model routing", "environmental monitoring", "embedding"];
const CONTRACTION = /\b(\w+n't|\w+'re|\w+'ve|\w+'ll|\w+'d|i'm|it's|that's|there's|what's|let's|here's)\b/i;

const strip = (s) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // [text](url) → text
// split on sentence ends (a project name may start lowercase); decimals ("5.79") stay whole
const sentences = (s) => strip(s).split(/(?<=[.!?])\s+(?=[A-Za-z0-9(])/).map((x) => x.trim()).filter(Boolean);

/** STE warnings for one piece of text (empty when it passes) */
export function steCheck(where, text) {
  const out = [];
  for (const s of sentences(text)) {
    const words = s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
    if (words.length > MAX_WORDS) out.push(`${where}: ${words.length} words (max ${MAX_WORDS}): "${s.slice(0, 70)}…"`);
    const c = s.match(CONTRACTION);
    if (c) out.push(`${where}: contraction "${c[0]}"`);
    const perfect = s.match(/\b(has|have|had)\s+(not\s+)?(been|\w+ed|run|done|gone|seen|made|built|written|taken|given|shown|known|grown|begun|come)\b/i);
    if (perfect) out.push(`${where}: perfect tense "${perfect[0]}"`);
    if (/\s[—–]\s|;/.test(s)) out.push(`${where}: dash or semicolon between clauses: "${s.slice(0, 70)}…"`);
    const lower = ` ${s.toLowerCase().replace(/[^a-z0-9'\- ]/g, " ")} `;
    for (const b of BANNED) if (lower.includes(` ${b} `)) out.push(`${where}: "${b}" (see the word map)`);
    const named = TECH.reduce((t, n) => t.replace(new RegExp(n, "gi"), ""), s);
    for (const w of named.match(/\b[A-Za-z]+ing\b/g) ?? []) if (!ING_OK.has(w.toLowerCase())) out.push(`${where}: "-ing" form "${w}"`);
  }
  return out;
}

/** STE warnings for a detail doc (content/detail/*.ts): its prose, captions,
 *  alt text, decision records and callouts. Code, diagram source and link
 *  targets are not prose. */
export function steCheckDoc(doc) {
  const out = [];
  const check = (where, text) => out.push(...steCheck(where, text));
  for (const s of doc.sections) {
    check(`detail.${doc.key}.heading`, s.heading);
    for (const b of s.blocks) {
      const at = `detail.${doc.key}.${b.id}`;
      if (b.caption) check(`${at}.caption`, b.caption);
      if (b.type === "prose") check(at, b.text);
      if (b.type === "diagram" || b.type === "figure") check(`${at}.alt`, b.alt);
      if (b.type === "table" && b.method) check(`${at}.method`, b.method);
      if (b.type === "decision") {
        check(`${at}.title`, b.title);
        check(`${at}.context`, b.context);
        check(`${at}.decision`, b.decision);
        b.cost.forEach((c, i) => check(`${at}.cost[${i}]`, c));
      }
      if (b.type === "callout") b.items.forEach((t, i) => check(`${at}[${i}]`, t));
    }
  }
  return out;
}
