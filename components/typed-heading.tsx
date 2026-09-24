"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export interface Typo {
  at: number;       // index in `text` the mistake happens *before* (use text.length for a trailing typo)
  wrong: string;    // wrong character(s) typed, then backspaced
  noticeMs?: number; // override the pause before correcting (for dramatic effect)
}

interface Frame {
  text: string;
  delay: number; // ms to wait *after* showing this frame
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Builds a humanized keystroke timeline: fast typing with a couple of quick
 * mistakes that get backspaced and corrected. Randomized delays per run.
 */
function buildFrames(target: string, typos: Typo[]): Frame[] {
  const frames: Frame[] = [];
  const typeDelay = () => rand(38, 66);   // ~fast WPM
  const backDelay = () => rand(28, 48);   // backspacing is quicker
  let cur = "";

  const applyTypo = (typo: Typo) => {
    for (const w of typo.wrong) {
      cur += w;
      frames.push({ text: cur, delay: typeDelay() });
    }
    frames.push({ text: cur, delay: typo.noticeMs ?? rand(105, 160) });  // notice the mistake
    for (let k = 0; k < typo.wrong.length; k++) {
      cur = cur.slice(0, -1);
      frames.push({ text: cur, delay: backDelay() });
    }
    frames.push({ text: cur, delay: rand(26, 50) });                      // settle before correcting
  };

  for (let i = 0; i < target.length; i++) {
    const typo = typos.find((t) => t.at === i);
    if (typo) applyTypo(typo);
    cur += target[i];
    frames.push({ text: cur, delay: typeDelay() });
  }

  // trailing typo (e.g. an extra char after the final letter)
  const trailing = typos.find((t) => t.at === target.length);
  if (trailing) applyTypo(trailing);

  return frames;
}

export default function TypedHeading({
  text,
  typos = [],
  startDelay = 150,
  className,
  onComplete,
}: {
  text: string;
  typos?: Typo[];
  startDelay?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  // Initial state must NOT depend on prefersReducedMotion: it is false during
  // SSR but true on the client under reduced motion, which would desync the
  // first render and throw a hydration mismatch (#418). Start empty to match
  // SSR; the effect below fills in the full text immediately when reduced.
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(text);
      setDone(true);
      onComplete?.();
      return;
    }

    const frames = buildFrames(text, typos);
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const start = setTimeout(function step() {
      if (idx >= frames.length) {
        setDone(true);
        onComplete?.();
        return;
      }
      const f = frames[idx++];
      setDisplayed(f.text);
      timer = setTimeout(step, f.delay);
    }, startDelay);

    return () => {
      clearTimeout(start);
      clearTimeout(timer);
    };
    // typos/onComplete intentionally excluded — the timeline is built once per `text`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, prefersReducedMotion]);

  return (
    <span className={className}>
      {displayed}
      <span className={done ? "cursor-blink" : undefined} style={done ? undefined : { opacity: 1 }}>
        ▋
      </span>
    </span>
  );
}
