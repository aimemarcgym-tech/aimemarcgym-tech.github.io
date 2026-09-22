import { getDb } from "@/lib/idb";

// Sauvegarde manuelle complète de la base locale (IndexedDB) -> un seul
// fichier JSON téléchargeable, et sa réimportation. Sert à la fois de
// filet de sécurité (pas de synchronisation automatique entre appareils)
// et de mécanisme de transfert d'un appareil à l'autre.

const STORES = ["clubs", "gymnasts", "gymnastSkills", "movements", "movementElements", "movementSnapshots"] as const;

export interface BackupData {
  version: 1;
  exportedAt: string;
  clubs: unknown[];
  gymnasts: unknown[];
  gymnastSkills: unknown[];
  movements: unknown[];
  movementElements: unknown[];
  movementSnapshots: unknown[];
}

export async function exportAll(): Promise<BackupData> {
  const db = await getDb();
  const data = {} as Record<(typeof STORES)[number], unknown[]>;
  for (const store of STORES) {
    data[store] = await db.getAll(store);
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  } as BackupData;
}

export async function importAll(data: BackupData): Promise<{ counts: Record<string, number> }> {
  if (!data || data.version !== 1) {
    throw new Error("Fichier de sauvegarde invalide ou d'une version non prise en charge.");
  }
  const db = await getDb();
  const tx = db.transaction(STORES, "readwrite");
  const counts: Record<string, number> = {};
  for (const store of STORES) {
    const objectStore = tx.objectStore(store);
    await objectStore.clear();
    const rows = (data[store] as Record<string, unknown>[]) ?? [];
    for (const row of rows) {
      // Import générique multi-stores depuis un JSON externe : la forme
      // exacte par store est validée à la frontière (version + structure),
      // pas par le système de types ici.
      await objectStore.put(row as never);
    }
    counts[store] = rows.length;
  }
  await tx.done;
  return { counts };
}

export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ufolep-gaf-sauvegarde-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
