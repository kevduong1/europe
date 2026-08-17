export const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function animateValue(
  durationMs: number,
  onUpdate: (t: number) => void,
  onDone?: () => void,
): () => void {
  if (prefersReducedMotion() || durationMs <= 0) {
    onUpdate(1);
    onDone?.();
    return () => {};
  }

  let frame = 0;
  let cancelled = false;
  const start = performance.now();

  const tick = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - start) / durationMs);
    onUpdate(easeOutCubic(t));
    if (t < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      onDone?.();
    }
  };

  frame = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}
