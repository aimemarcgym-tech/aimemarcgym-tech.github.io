"use client";

import { setGymnastsHomeOrder } from "@/lib/data";
import GymnastRow from "@/components/GymnastRow";
import DragHandle from "@/components/DragHandle";
import { useDragReorder } from "@/hooks/useDragReorder";

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

  async function reorderTo(from: number, to: number) {
    if (from === to) return;
    const next = [...sorted];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    await setGymnastsHomeOrder(next.map((g) => g.id));
    onReordered();
  }

  const { dragIndex, overIndex, setItemRef, handleProps } = useDragReorder(reorderTo);

  return (
    <ul className="space-y-2">
      {sorted.map((g, i) => {
        const isDragging = dragIndex === i;
        const isDragOver = overIndex === i && dragIndex !== null && dragIndex !== i;
        return (
          <li
            key={g.id}
            ref={setItemRef(i)}
            className={`flex items-center gap-2 rounded-lg transition ${
              isDragging ? "opacity-50" : isDragOver ? "ring-2 ring-accent-solid" : ""
            }`}
          >
            <DragHandle {...handleProps(i)} />
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
