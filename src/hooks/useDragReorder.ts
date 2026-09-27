"use client";

import { useCallback, useRef, useState } from "react";

// Réordonnancement par glisser-déposer basé sur les Pointer Events (et non
// l'API HTML5 Drag and Drop native), qui fonctionne à la fois à la souris et
// au doigt : le drag-and-drop natif (`draggable`/`onDragStart`...) n'est pas
// supporté du tout sur les navigateurs mobiles tactiles (Chrome/Safari
// Android/iOS), c'est une limitation de la spécification HTML5, pas un bug
// de l'app. Le pointeur est capturé sur la poignée dès le pointerdown
// (`setPointerCapture`), ce qui garantit que pointermove/pointerup
// continuent d'être livrés à cette poignée même si le doigt/curseur sort de
// ses limites — plus besoin d'attacher des listeners sur window/document.
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const dragIndexRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  function findClosestIndex(y: number): number | null {
    let closest: number | null = null;
    let closestDist = Infinity;
    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(mid - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = idx;
      }
    });
    return closest;
  }

  function endDrag() {
    if (dragIndexRef.current !== null && overIndexRef.current !== null && overIndexRef.current !== dragIndexRef.current) {
      onReorder(dragIndexRef.current, overIndexRef.current);
    }
    dragIndexRef.current = null;
    overIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleProps(index: number) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        dragIndexRef.current = index;
        overIndexRef.current = index;
        setDragIndex(index);
        setOverIndex(index);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (dragIndexRef.current === null) return;
        const closest = findClosestIndex(e.clientY);
        if (closest !== null && closest !== overIndexRef.current) {
          overIndexRef.current = closest;
          setOverIndex(closest);
        }
      },
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      style: { touchAction: "none" as const },
    };
  }

  return { dragIndex, overIndex, setItemRef, handleProps };
}
