"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteMovementButton from "@/components/DeleteMovementButton";

export default function MovementChip({
  movementId,
  label,
  apparatus,
  evolution,
  onDeleted,
}: {
  movementId: string;
  label: string;
  apparatus: string;
  evolution: string;
  onDeleted?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm text-foreground shadow-sm transition hover:border-accent-solid/60">
      <button type="button" onClick={() => setRevealed((v) => !v)} className="text-left">
        {label} <span className="text-muted">· {apparatus} {evolution}</span>
      </button>
      <div className="flex items-center gap-3">
        <Link href={`/mouvement?id=${movementId}`} className="text-sm accent-gradient-text font-medium">
          Ouvrir →
        </Link>
        {revealed && <DeleteMovementButton movementId={movementId} movementLabel={label} onDeleted={onDeleted} />}
      </div>
    </div>
  );
}
