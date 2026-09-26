"use client";

import { useState } from "react";
import { setGymnastsHomeOrder } from "@/lib/data";
import GymnastRow from "@/components/GymnastRow";

type Gymnast = {
  id: string;
  firstName: string;
  lastName: string;
  homeOrder?: number | null;
  movements: unknown[];
};

export default function DraggableGymnastList<T extends Gymnast>({
  members,
  onReordered,
  onDeleted,
}: {
  members: T[];
  onReordered: () => void;
  onDeleted: () => void;
}) {
  const sorted = [...members].sort((a, b) => {
    const ao = a.homeOrder ?? Infinity;
    const bo = b.homeOrder ?? Infinity;
    return ao - bo;
  });

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function reorderTo(from: number, to: number) {
    if (from === to) return;
    const next = [...sorted];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    await setGymnastsHomeOrder(next.map((g) => g.id));
    onReordered();
  }

  return (
    <ul className="space-y-2">
      {sorted.map((g, i) => {
        const isDragging = dragIndex === i;
        const isDragOver = dragOverIndex === i && dragIndex !== null && dragIndex !== i;
        return (
          <li
            key={g.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(i));
              setDragIndex(i);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverIndex !== i) setDragOverIndex(i);
            }}
            onDragLeave={() => {
              setDragOverIndex((cur) => (cur === i ? null : cur));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
              if (!Number.isNaN(from)) reorderTo(from, i);
              setDragIndex(null);
              setDragOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setDragOverIndex(null);
            }}
            className={`flex items-center gap-2 rounded-lg transition ${
              isDragging ? "opacity-50" : isDragOver ? "ring-2 ring-accent-solid" : ""
            }`}
          >
            <span
              className="shrink-0 cursor-grab select-none px-1 text-muted active:cursor-grabbing"
              title="Glisser pour réordonner"
            >
              ⠿
            </span>
            <div className="flex-1">
              <GymnastRow
                gymnastId={g.id}
                firstName={g.firstName}
                lastName={g.lastName}
                movementCount={g.movements.length}
                onDeleted={onDeleted}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
