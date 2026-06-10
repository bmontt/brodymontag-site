"use client";

import { motion } from "framer-motion";

const CHARS = [
  { char: "│", x: 8,  y: 15, dur: 42, dx: 12,  dy: -8,  rot: 3  },
  { char: "─", x: 23, y: 72, dur: 38, dx: -15, dy: 10,  rot: -2 },
  { char: "┐", x: 67, y: 28, dur: 55, dx: 8,   dy: -18, rot: 5  },
  { char: "└", x: 45, y: 88, dur: 47, dx: -10, dy: 12,  rot: -4 },
  { char: "╱", x: 82, y: 45, dur: 61, dx: 18,  dy: -6,  rot: 0  },
  { char: "╲", x: 15, y: 55, dur: 36, dx: -12, dy: 15,  rot: 0  },
  { char: "·", x: 55, y: 18, dur: 44, dx: 10,  dy: 8,   rot: 0  },
  { char: "∘", x: 33, y: 62, dur: 52, dx: -8,  dy: -12, rot: 0  },
  { char: "◦", x: 76, y: 78, dur: 39, dx: 14,  dy: -10, rot: 0  },
  { char: "○", x: 12, y: 40, dur: 58, dx: -16, dy: 8,   rot: 0  },
  { char: "◆", x: 90, y: 22, dur: 45, dx: 8,   dy: 18,  rot: 15 },
  { char: "┼", x: 50, y: 50, dur: 63, dx: -12, dy: -15, rot: 0  },
  { char: "╌", x: 37, y: 33, dur: 41, dx: 16,  dy: 6,   rot: 0  },
  { char: "╎", x: 70, y: 60, dur: 49, dx: -10, dy: -8,  rot: 0  },
  { char: "┄", x: 28, y: 82, dur: 57, dx: 12,  dy: -14, rot: 0  },
  { char: "┆", x: 88, y: 70, dur: 35, dx: -18, dy: 10,  rot: 0  },
  { char: "×", x: 60, y: 92, dur: 46, dx: 10,  dy: -6,  rot: 0  },
  { char: "┌", x: 5,  y: 78, dur: 53, dx: -8,  dy: -12, rot: -3 },
  { char: "┘", x: 78, y: 12, dur: 40, dx: 15,  dy: 8,   rot: 4  },
  { char: "∙", x: 42, y: 48, dur: 66, dx: -12, dy: 14,  rot: 0  },
  { char: "╲", x: 95, y: 55, dur: 43, dx: -14, dy: -10, rot: 0  },
  { char: "│", x: 18, y: 25, dur: 59, dx: 8,   dy: 16,  rot: -5 },
];

export default function AsciiBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {CHARS.map((c, i) => (
        <motion.span
          key={i}
          className="absolute select-none font-mono text-sm text-foreground"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          animate={{
            x: [0, c.dx, -(c.dx / 2), 0],
            y: [0, c.dy, -(c.dy / 2), 0],
            opacity: [0.03, 0.055, 0.025, 0.03],
            rotate: [0, c.rot, -(c.rot / 2), 0],
          }}
          transition={{
            duration: c.dur,
            repeat: Infinity,
            ease: "linear",
            delay: i * 1.7,
          }}
        >
          {c.char}
        </motion.span>
      ))}
    </div>
  );
}
