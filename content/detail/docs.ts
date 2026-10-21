// ── detail doc list ───────────────────────────────────────────────────────────
// Every long-form page, in one list. Plain data with no server-only import, so
// the e2e tests (e2e/machine.spec.ts) can read the same docs the site renders.
// The site reaches them through content/detail/index.ts, which checks them.

import type { DetailDoc } from "./types";
import agentForge from "./agent-forge";
import brodymontagCom from "./brodymontag-com";
import fiserv from "./fiserv";
import galago from "./galago";
import kicker from "./here-comes-the-kicker";
import peakFinding from "./peak-finding-toolbox";
import pirl from "./pirl";
import prism from "./prism";
import realmbot from "./realmbot";
import superset from "./superset";
import venture from "./venture";

export const DOCS: DetailDoc[] = [
  brodymontagCom, prism, venture, superset, realmbot, kicker, agentForge, peakFinding,
  fiserv, pirl, galago,
];
