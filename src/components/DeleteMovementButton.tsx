"use client";

import { useState, useTransition } from "react";
import { deleteMovement } from "@/lib/data";

export default function DeleteMovementButton({
  movementId,
  movementLabel,
  onDeleted,
}: {
  movementId: string;
  movementLabel: string;
  onDeleted?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10"
      >
        Supprimer
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs" onClick={(e) => e.preventDefault()}>
      <span className="text-danger">Supprimer {movementLabel} ?</span>
      <button
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startTransition(async () => {
            await deleteMovement(movementId);
            onDeleted?.();
          });
        }}
        className="rounded bg-danger px-2 py-1 text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "…" : "Confirmer"}
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(false);
        }}
        className="rounded border border-border-strong px-2 py-1 text-muted hover:text-foreground"
      >
        Annuler
      </button>
    </span>
  );
}
