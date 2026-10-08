import { useLayoutEffect, useRef, useState } from 'react';
import { countFittingChips } from '../utils/fit-chips';

export const CHIP_GAP_PX = 6;

/**
 * Measures how many chips fit whole on one line of the container and re-measures
 * when the container or any chip changes size (resize, font swap).
 * Returns the number of chips that are hidden; 0 while the layout is unknown.
 */
export function useFitChips(signature: string, total: number) {
  const containerRef = useRef<HTMLUListElement>(null);
  const [fitting, setFitting] = useState<number | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const measure = () => {
      const width = container.clientWidth;
      if (width <= 0) {
        setFitting(null);
        return;
      }
      const chipWidths = Array.from(container.children, (chip) => (chip as HTMLElement).offsetWidth);
      setFitting(countFittingChips(width, chipWidths, CHIP_GAP_PX));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    Array.from(container.children).forEach((chip) => observer.observe(chip));
    return () => observer.disconnect();
  }, [signature]);

  const hiddenCount = fitting === null ? 0 : Math.max(total - fitting, 0);
  return { containerRef, hiddenCount };
}
