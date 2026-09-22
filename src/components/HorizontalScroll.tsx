"use client";

import { useRef, type ReactNode, type WheelEvent } from "react";

export default function HorizontalScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    // Ne dévie le scroll vertical vers l'horizontal que si la molette
    // apporte plus de mouvement que le scroll horizontal natif (trackpad).
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }

  return (
    <div ref={ref} onWheel={handleWheel} className={className}>
      {children}
    </div>
  );
}
