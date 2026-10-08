"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteSnapshot, getSnapshots, renameSnapshot, saveSnapshot } from "@/lib/data";
import type { MovementSnapshotRow } from "@/lib/idb";
import { RenommerEnLigne } from "@/components/EnLigne";

// Historique de progression d'un mouvement : versions datées, qu'on peut nommer, renommer, restaurer
// ou supprimer. Partagé par le constructeur (Sol, Barres, Poutre) et celui du Saut.
export function useSnapshotHistory(movementId: string) {
  const [snapshots, setSnapshots] = useState<MovementSnapshotRow[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSnapshots(movementId).then((l) => alive && setSnapshots(l));
    return () => {
      alive = false;
    };
  }, [movementId]);

  // Enregistre une version et ouvre tout de suite le champ de nom (Échap ou champ vide : on garde la date seule).
  const create = useCallback(
    async (elementCodes: string[], noteDepart: number, detail: unknown) => {
      const row = await saveSnapshot(movementId, elementCodes, noteDepart, detail);
      setSnapshots((l) => [...l, row]);
      setRenamingId(row.id);
    },
    [movementId]
  );

  const rename = useCallback(async (id: string, name: string) => {
    await renameSnapshot(id, name);
    setSnapshots((l) => l.map((s) => (s.id === id ? { ...s, name } : s)));
    setRenamingId(null);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSnapshot(id);
    setSnapshots((l) => l.filter((s) => s.id !== id));
  }, []);

  return { snapshots, renamingId, setRenamingId, create, rename, remove };
}

export default function SnapshotHistory({
  history,
  onRestore,
}: {
  history: ReturnType<typeof useSnapshotHistory>;
  onRestore: (elementCodes: string[]) => void;
}) {
  const { snapshots, renamingId, setRenamingId, rename, remove } = history;
  const [restoredId, setRestoredId] = useState<string | null>(null);
  if (snapshots.length === 0) return null;

  return (
    <section className="rounded-lg border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Historique</h2>
      <ul className="space-y-1.5">
        {[...snapshots].reverse().map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded border border-border-subtle bg-surface-alt px-3 py-2 text-xs"
          >
            <span className="min-w-0 flex-1">
              {renamingId === s.id ? (
                <RenommerEnLigne
                  valeur={s.name ?? ""}
                  className="!py-1 !text-xs"
                  onAnnuler={() => setRenamingId(null)}
                  onOk={(n) => void rename(s.id, n)}
                />
              ) : (
                <>
                  {s.name && <span className="block truncate text-sm font-medium text-foreground">{s.name}</span>}
                  <span className="block text-muted">
                    {new Date(s.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · Note{" "}
                    {s.noteDepart.toFixed(1)}
                  </span>
                </>
              )}
            </span>
            {renamingId !== s.id && (
              <button type="button" onClick={() => setRenamingId(s.id)} className="text-muted underline hover:text-foreground">
                {s.name ? "Renommer" : "Nommer"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                try {
                  onRestore(JSON.parse(s.elementCodes) as string[]);
                  setRestoredId(s.id);
                } catch {
                  setRestoredId(null);
                }
              }}
              className="accent-gradient-text underline"
              title="Remplace le mouvement actuel par cette version"
            >
              {restoredId === s.id ? "Restauré ✓" : "Restaurer"}
            </button>
            <button
              type="button"
              onClick={() => void remove(s.id)}
              aria-label="Supprimer l’instantané"
              className="text-muted hover:text-danger"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
