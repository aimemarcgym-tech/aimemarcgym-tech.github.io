"use client";

import { useRef, useState } from "react";
import { exportAll, importAll, downloadBackup, type BackupData } from "@/lib/backup";

export default function BackupPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<BackupData | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setBusy(true);
    setStatus(null);
    try {
      const data = await exportAll();
      downloadBackup(data);
      setStatus(
        `Sauvegarde téléchargée (${data.gymnasts.length} gymnaste(s), ${data.movements.length} mouvement(s), ${data.gymnastMusic?.length ?? 0} musique(s)).`
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Échec de l'export.");
    } finally {
      setBusy(false);
    }
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as BackupData;
        setConfirming(data);
      } catch {
        setStatus("Fichier illisible : ce n'est pas un JSON de sauvegarde valide.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function confirmImport() {
    if (!confirming) return;
    setBusy(true);
    try {
      const { counts } = await importAll(confirming);
      setStatus(
        `Sauvegarde importée : ${counts.gymnasts} gymnaste(s), ${counts.movements} mouvement(s), ${counts.clubs} club(s), ${counts.gymnastMusic} musique(s). Les données précédentes de cet appareil ont été remplacées.`
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Échec de l'import.");
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border-subtle bg-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Exporter</h3>
        <p className="mb-3 text-xs text-muted">
          Télécharge un fichier JSON contenant toutes les données de cet appareil (clubs, gymnastes, compétences,
          mouvements, historique, musiques). À faire régulièrement, en particulier avant/après une compétition.
        </p>
        <button
          onClick={handleExport}
          disabled={busy}
          className="accent-gradient rounded px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Télécharger une sauvegarde
        </button>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Importer</h3>
        <p className="mb-3 text-xs text-muted">
          Charge un fichier de sauvegarde exporté depuis cet appareil ou un autre.{" "}
          <strong className="text-danger">Remplace entièrement</strong> les données actuellement sur cet appareil.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChosen}
          className="block w-full text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-surface-alt file:px-3 file:py-2 file:text-xs file:text-foreground hover:file:bg-border-strong"
        />
      </div>

      {confirming && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-4">
          <p className="mb-3 text-sm text-danger">
            Remplacer toutes les données de cet appareil par cette sauvegarde ({(confirming.gymnasts as unknown[])?.length ?? 0}{" "}
            gymnaste(s), {(confirming.movements as unknown[])?.length ?? 0} mouvement(s)) ? Cette action est
            irréversible pour les données actuelles de cet appareil.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmImport}
              disabled={busy}
              className="rounded bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "…" : "Confirmer le remplacement"}
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="rounded border border-border-strong px-3 py-1.5 text-xs text-muted hover:text-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {status && <p className="text-sm text-muted">{status}</p>}
    </div>
  );
}
