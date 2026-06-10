"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BackLink({ href = "/" }: { href?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-12"
    >
      <Link
        href={href}
        className="inline-flex items-center gap-2 font-mono text-xs text-foreground/38 hover:text-foreground/75 transition-colors duration-200"
      >
        ← back
      </Link>
    </motion.div>
  );
}
