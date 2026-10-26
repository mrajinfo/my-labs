import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Rolls a number from its previous value (0 on first show) to `target`.
 * Jumps straight to the value when the person prefers reduced motion.
 */
export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const from = current.current;
    if (from === target) return undefined;
    const instant = prefersReducedMotion();
    const start = performance.now();
    let frame = 0;

    const tick = (now) => {
      const progress = instant ? 1 : Math.min(1, (now - start) / duration);
      const next = Math.round(from + (target - from) * easeOutCubic(progress));
      current.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
