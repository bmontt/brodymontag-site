// ── figure: agent-forge · one source, two builds ──────────────────────────────
// One real source (agent-forge@9db1c77, agents/debugger.md) through build.py:
// the tier becomes a model and each tool verb a platform tool name, from
// factory.config.yaml (model_tiers, tool_map), for Claude Code and for VS
// Code; the skill pointer stays a pointer. Then scripts/agent_eval.py's 12
// checks, in their own order and numbers. The text is the files' own,
// shortened where marked with "…".

const W = 720;
const H = 340;
const LOOP = 10;
const pct = (t: number) => `${((t / LOOP) * 100).toFixed(2)}%`;

const SRC = { x: 16, y: 26, w: 236, h: 196 };
const BUILD = { x: 286, y: 104, w: 104, h: 34 };
const OUT1 = { x: 416, y: 26, w: 294, h: 84 };
const OUT2 = { x: 416, y: 124, w: 294, h: 98 };

const SRC_LINES: { t: string; k?: "tier" | "tools" | "skill" }[] = [
  { t: "---" },
  { t: "name: debugger" },
  { t: "tier: standard", k: "tier" },
  { t: "tools: [read, edit, create,", k: "tools" },
  { t: "  search_text, search_files,", k: "tools" },
  { t: "  terminal]", k: "tools" },
  { t: "---" },
  { t: "You are a systematic debugger. …" },
  { t: "Project discovery: load", k: "skill" },
  { t: "  skills/project-discovery …", k: "skill" },
];

const CHECKS = [
  "frontmatter", "model routing", "skill refs", "delegate refs",
  "skill files", "generated memory", "manifest drift", "tier coverage",
  "telemetry", "orphan delegations", "terminal models", "daily-note writes",
];

const T_TIER = 1.0;
const T_TOOLS = 2.5;
const T_SKILL = 4.0;
const T_CHECK0 = 4.9;
const CHECK_STEP = 0.24;
const T_PASS = T_CHECK0 + CHECKS.length * CHECK_STEP + 0.2;

type P = [number, number];
const SRC_OUT: P = [SRC.x + SRC.w, BUILD.y + BUILD.h / 2];
const B_IN: P = [BUILD.x, BUILD.y + BUILD.h / 2];
const B_OUT: P = [BUILD.x + BUILD.w, BUILD.y + BUILD.h / 2];
const O1_IN: P = [OUT1.x, OUT1.y + OUT1.h / 2];
const O2_IN: P = [OUT2.x, OUT2.y + OUT2.h / 2];

function pulse(name: string, t0: number, to: P) {
  const at = (t: number, [x, y]: P, o = 1) => `${pct(t)} { transform: translate(${x}px, ${y}px); opacity: ${o}; }`;
  return `@keyframes ${name} { 0%, ${pct(t0 - 0.01)} { transform: translate(${SRC_OUT[0]}px, ${SRC_OUT[1]}px); opacity: 0; } ${at(t0, SRC_OUT)} ${at(t0 + 0.25, B_IN)} ${at(t0 + 0.45, B_OUT)} ${at(t0 + 0.75, to)} ${at(t0 + 0.9, to, 0)} 100% { transform: translate(${to[0]}px, ${to[1]}px); opacity: 0; } }`;
}

function css() {
  const r: string[] = [];
  const hl = (k: string, t: number) =>
    `@keyframes af-hl-${k} { 0%, ${pct(t - 0.05)} { fill: oklch(1 0 0 / 0); } ${pct(t)} { fill: oklch(0.84 0.1 315 / 0.22); } ${pct(t + 1.2)}, 100% { fill: oklch(1 0 0 / 0); } }
.fig-agent-forge[data-play] .af-hl-${k} { animation: af-hl-${k} ${LOOP}s linear infinite; }`;
  r.push(hl("tier", T_TIER), hl("tools", T_TOOLS), hl("skill", T_SKILL));
  const show = (k: string, t: number) =>
    `@keyframes af-out-${k} { 0%, ${pct(t)} { opacity: 0; transform: translateX(-6px); } ${pct(t + 0.25)}, ${pct(LOOP - 0.4)} { opacity: 1; transform: none; } 100% { opacity: 0; } }
.fig-agent-forge[data-play] .af-out-${k} { animation: af-out-${k} ${LOOP}s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }`;
  r.push(show("tier", T_TIER + 0.75), show("tools", T_TOOLS + 0.75), show("skill", T_SKILL + 0.75));
  [["tier", T_TIER], ["tools", T_TOOLS]].forEach(([k, t]) => {
    r.push(pulse(`af-p-${k}-1`, t as number, O1_IN), pulse(`af-p-${k}-2`, t as number, O2_IN));
    r.push(`.fig-agent-forge[data-play] .af-p-${k}-1 { animation: af-p-${k}-1 ${LOOP}s linear infinite; } .fig-agent-forge[data-play] .af-p-${k}-2 { animation: af-p-${k}-2 ${LOOP}s linear infinite; }`);
  });
  r.push(`@keyframes af-build { 0%, ${pct(T_TIER + 0.2)} { stroke: oklch(1 0 0 / 0.45); } ${pct(T_TIER + 0.35)} { stroke: oklch(1 0 0); } ${pct(T_TIER + 0.7)}, ${pct(T_TOOLS + 0.2)} { stroke: oklch(1 0 0 / 0.45); } ${pct(T_TOOLS + 0.35)} { stroke: oklch(1 0 0); } ${pct(T_TOOLS + 0.7)}, 100% { stroke: oklch(1 0 0 / 0.45); } }
.fig-agent-forge[data-play] .af-build { animation: af-build ${LOOP}s linear infinite; }`);
  CHECKS.forEach((_, i) => {
    const t = T_CHECK0 + i * CHECK_STEP;
    r.push(`@keyframes af-ck-${i} { 0%, ${pct(t)} { opacity: 0.18; } ${pct(t + 0.08)} { opacity: 1; fill: var(--pearl-sky); } ${pct(t + 0.5)}, ${pct(LOOP - 0.4)} { opacity: 1; fill: oklch(0.92 0 0); } 100% { opacity: 0.18; } }
.fig-agent-forge[data-play] .af-ck-${i} { animation: af-ck-${i} ${LOOP}s linear infinite; }`);
  });
  r.push(`@keyframes af-pass { 0%, ${pct(T_PASS)} { opacity: 0; } ${pct(T_PASS + 0.2)}, ${pct(LOOP - 0.4)} { opacity: 1; } 100% { opacity: 0; } }
.fig-agent-forge[data-play] .af-pass { animation: af-pass ${LOOP}s linear infinite; }`);
  return r.join("\n");
}
const CSS = css();

function Panel({ b, title }: { b: { x: number; y: number; w: number; h: number }; title: string }) {
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="oklch(0.15 0 0)" stroke="oklch(1 0 0 / 0.3)" />
      <text x={b.x + 10} y={b.y + 16} fontSize="10" fill="oklch(1 0 0 / 0.62)">{title}</text>
      <line x1={b.x} y1={b.y + 23} x2={b.x + b.w} y2={b.y + 23} stroke="oklch(1 0 0 / 0.12)" />
    </g>
  );
}

const LH = 16;

export default function AgentForgeFigure() {
  return (
    <>
      <style>{CSS}</style>
      <svg className="fig-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" xmlSpace="preserve">
        {/* the source */}
        <Panel b={SRC} title="agents/debugger.md · source" />
        {(["tier", "tools", "skill"] as const).map((k) => {
          const idx = SRC_LINES.map((l, i) => (l.k === k ? i : -1)).filter((i) => i >= 0);
          return <rect key={k} className={`af-hl-${k}`} x={SRC.x + 4} y={SRC.y + 30 + idx[0] * LH - 11} width={SRC.w - 8} height={idx.length * LH} rx="2" fill="oklch(1 0 0 / 0)" />;
        })}
        {SRC_LINES.map((l, i) => (
          <text key={i} x={SRC.x + 10} y={SRC.y + 30 + i * LH} fontSize="10.5" fill={l.k ? "oklch(1 0 0 / 0.9)" : "oklch(1 0 0 / 0.55)"}>{l.t}</text>
        ))}

        {/* the build */}
        <line x1={SRC_OUT[0]} y1={SRC_OUT[1]} x2={B_IN[0]} y2={B_IN[1]} stroke="oklch(1 0 0 / 0.3)" />
        <line x1={B_OUT[0]} y1={B_OUT[1]} x2={O1_IN[0]} y2={O1_IN[1]} stroke="oklch(1 0 0 / 0.3)" />
        <line x1={B_OUT[0]} y1={B_OUT[1]} x2={O2_IN[0]} y2={O2_IN[1]} stroke="oklch(1 0 0 / 0.3)" />
        <rect className="af-build" x={BUILD.x} y={BUILD.y} width={BUILD.w} height={BUILD.h} rx="3" fill="oklch(0.16 0 0)" stroke="oklch(1 0 0 / 0.45)" />
        <text x={BUILD.x + BUILD.w / 2} y={BUILD.y + 21} textAnchor="middle" fontSize="11.5" fill="oklch(1 0 0 / 0.9)">build.py</text>
        <text x={BUILD.x + BUILD.w / 2} y={BUILD.y + BUILD.h + 15} textAnchor="middle" fontSize="9.5" fill="oklch(1 0 0 / 0.62)">tier → model</text>
        <text x={BUILD.x + BUILD.w / 2} y={BUILD.y + BUILD.h + 28} textAnchor="middle" fontSize="9.5" fill="oklch(1 0 0 / 0.62)">verb → tool</text>

        {/* the two outputs */}
        <Panel b={OUT1} title="~/.claude/agents/debugger.md · Claude Code" />
        <g fontSize="10.5" fill="oklch(1 0 0 / 0.9)">
          <text className="af-out-tier" x={OUT1.x + 10} y={OUT1.y + 40}>model: sonnet</text>
          <text className="af-out-tools" x={OUT1.x + 10} y={OUT1.y + 56}>tools: Read, Edit, Write, Grep,</text>
          <text className="af-out-tools" x={OUT1.x + 10} y={OUT1.y + 72}>  Glob, Bash</text>
        </g>
        <Panel b={OUT2} title="prompts/debugger.agent.md · VS Code" />
        <g fontSize="10.5" fill="oklch(1 0 0 / 0.9)">
          <text className="af-out-tier" x={OUT2.x + 10} y={OUT2.y + 40}>model: claude-sonnet-4-5 (copilot)</text>
          <text className="af-out-tools" x={OUT2.x + 10} y={OUT2.y + 56}>tools: [read_file,</text>
          <text className="af-out-tools" x={OUT2.x + 10} y={OUT2.y + 72}>  replace_string_in_file, create_file,</text>
          <text className="af-out-tools" x={OUT2.x + 10} y={OUT2.y + 88}>  grep_search, file_search, run_in_terminal]</text>
        </g>
        <text className="af-out-skill" x={SRC.x + 4} y={SRC.y + SRC.h + 15} fontSize="9.5" fill="var(--pearl-orchid)">the skill loads only when the task needs it</text>

        {/* the pulses */}
        {["tier", "tools"].flatMap((k) => [1, 2].map((n) => (
          <g key={`${k}${n}`} className={`af-p-${k}-${n}`} opacity="0">
            <circle r="6" fill="oklch(1 0 0 / 0.14)" />
            <circle r="3" fill="oklch(1 0 0)" />
          </g>
        )))}

        {/* the 12 checks */}
        <text x={16} y={262} fontSize="10.5" fill="oklch(1 0 0 / 0.6)">agent_eval.py</text>
        {CHECKS.map((c, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = 112 + col * 148;
          const y = 262 + row * 22;
          return (
            <g key={c} fontSize="9.5">
              <text className={`af-ck-${i}`} x={x} y={y} fill="oklch(0.92 0 0)">✓</text>
              <text x={x + 14} y={y} fill="oklch(1 0 0 / 0.7)">{`[${i + 1}] ${c}`}</text>
            </g>
          );
        })}
        <text className="af-pass" x={W - 16} y={H - 8} textAnchor="end" fontSize="10.5" fill="var(--pearl-sky)">exit 0 · build done</text>
      </svg>
    </>
  );
}
