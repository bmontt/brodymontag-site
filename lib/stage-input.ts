// ── stage input ───────────────────────────────────────────────────────────────
// Pointer and knot-drag state shared by both tiers' laser directors. Plain
// mutable singletons, written by listeners and the frame loop — never React
// state (the frame loop reads them every frame; nothing re-renders).
//
//   pointer  cursor position, −1…1 (room parallax, title tilt)
//   knot     where the director last drew the knot (screen px), for grabbing
//   drag     the knot's spin/tilt added by the user, with inertia — grab it
//            with the mouse (flag: drag) and fling it

export const pointer = { x: 0, y: 0 };
export const knot = { x: 0, y: 0, r: 0, w: 0 };
export const drag = { spin: 0, tilt: 0, vSpin: 0, vTilt: 0, active: false };

let installed = 0;

/** Track the pointer and let the mouse grab the knot. Returns an uninstaller. */
export function installStageInput(opts: { drag: boolean }): () => void {
  if (typeof window === "undefined") return () => {};
  installed++;
  let last = { x: 0, y: 0, t: 0 };
  const over = (e: PointerEvent) =>
    knot.w > 0.3 && Math.hypot(e.clientX - knot.x, e.clientY - knot.y) < knot.r * 1.05;
  // grabbing only where nothing else wants the pointer (links, text, controls)
  const free = (e: PointerEvent) =>
    !(e.target as Element | null)?.closest?.("a, button, input, textarea, select, label, [role=button], p, h1, h2, h3, li, span");

  const onMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (!opts.drag || e.pointerType !== "mouse") return;
    if (drag.active) {
      const now = performance.now();
      const dt = Math.max(now - last.t, 1) / 1000;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      const k = 1 / Math.max(knot.r, 60);
      drag.spin += dx * k * 1.6;
      drag.tilt += dy * k * 1.2;
      drag.vSpin = (dx * k * 1.6) / dt;
      drag.vTilt = (dy * k * 1.2) / dt;
      last = { x: e.clientX, y: e.clientY, t: now };
      return;
    }
    document.documentElement.style.cursor = over(e) && free(e) ? "grab" : "";
  };
  const onDown = (e: PointerEvent) => {
    if (!opts.drag || e.pointerType !== "mouse" || e.button !== 0 || !over(e) || !free(e)) return;
    drag.active = true;
    drag.vSpin = drag.vTilt = 0;
    last = { x: e.clientX, y: e.clientY, t: performance.now() };
    document.documentElement.style.cursor = "grabbing";
    e.preventDefault(); // no text selection while spinning
  };
  const onUp = () => {
    if (!drag.active) return;
    drag.active = false;
    document.documentElement.style.cursor = "";
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  return () => {
    installed--;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    document.documentElement.style.cursor = "";
  };
}

/** Advance the fling (call once per frame): released spin coasts and settles. */
export function stepDrag(dt: number) {
  if (drag.active || dt <= 0) return;
  drag.spin += drag.vSpin * dt;
  drag.tilt += drag.vTilt * dt;
  const decay = Math.exp(-2.2 * dt);
  drag.vSpin *= decay;
  drag.vTilt *= decay;
  // tilt eases home so the knot never stays upside down
  drag.tilt += (0 - drag.tilt) * (1 - Math.exp(-0.8 * dt));
}
