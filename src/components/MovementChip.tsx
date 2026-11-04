"use client";

import Link from "next/link";
import DeleteMovementButton from "@/components/DeleteMovementButton";

export default function MovementChip({
  movementId,
  label,
  apparatusLabel,
  evolution,
  onDeleted,
}: {
  movementId: string;
  label: string;
  apparatusLabel: string;
  evolution: string;
  onDeleted?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-sm transition hover:border-accent-solid/60">
      <div className="min-w-0">
        <div className="text-base text-foreground">{label}</div>
        <div className="mt-0.5 text-xs text-muted">
          {apparatusLabel} · Évolution {evolution}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link href={`/mouvement/?id=${movementId}`} className="text-sm accent-gradient-text font-medium">
          Ouvrir →
        </Link>
        <DeleteMovementButton movementId={movementId} movementLabel={label} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
