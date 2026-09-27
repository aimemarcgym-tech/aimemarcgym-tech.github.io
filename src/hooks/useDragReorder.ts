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
  // Position verticale (centre) de chaque élément, mesurée une seule fois au
  // début du glissement plutôt qu'à chaque pointermove : les éléments ne
  // bougent pas réellement dans le DOM pendant le drag (seul leur style
  // change, l'ordre du tableau n'est appliqué qu'au drop), donc ces mesures
  // restent valables tout du long. Réutiliser un cache évite un
  // getBoundingClientRect() par élément (= un reflow synchrone forcé) à
  // chaque pointermove, qui peut se déclencher plus de 60 fois/seconde.
  const dragStartMidpoints = useRef<(number | undefined)[]>([]);
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
    dragStartMidpoints.current.forEach((mid, idx) => {
      if (mid === undefined) return;
      const dist = Math.abs(mid - y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = idx;
      }
    });
    return closest;
  }

  function endDrag() {
    if (dragIndex !== null && overIndex !== null && overIndex !== dragIndex) {
      onReorder(dragIndex, overIndex);
    }
    dragStartMidpoints.current = [];
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleProps(index: number) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        dragStartMidpoints.current = itemRefs.current.map((el) => {
          if (!el) return undefined;
          const rect = el.getBoundingClientRect();
          return rect.top + rect.height / 2;
        });
        setDragIndex(index);
        setOverIndex(index);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (dragIndex === null) return;
        const closest = findClosestIndex(e.clientY);
        if (closest !== null && closest !== overIndex) {
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
