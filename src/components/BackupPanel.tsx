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
      const result = await downloadBackup(data);
      if (result === "cancelled") {
        setStatus(null);
        return;
      }
      const counts = `${data.gymnasts.length} gymnaste(s), ${data.movements.length} mouvement(s), ${data.trainingSessions?.length ?? 0} séance(s) d'entraînement, ${data.gymnastMusic?.length ?? 0} musique(s), ${data.photos?.length ?? 0} photo(s), ${data.videos?.length ?? 0} vidéo(s)`;
      setStatus(
        result === "picked"
          ? `Sauvegarde enregistrée à l'emplacement choisi (${counts}).`
          : `Sauvegarde téléchargée dans le dossier de téléchargements (${counts}). Votre navigateur ne permet pas de choisir l'emplacement — déplacez le fichier ensuite si besoin.`
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
    setStatus("Lecture du fichier…");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as BackupData;
        setStatus(null);
        setConfirming(data);
      } catch {
        setStatus("Fichier illisible : ce n'est pas un JSON de sauvegarde valide.");
      }
    };
    // Sans ce gestionnaire, un fichier choisi depuis un stockage cloud
    // (Drive, OneDrive...) dont la lecture échoue (le navigateur mobile doit
    // d'abord le télécharger depuis le cloud avant de pouvoir le lire) ne
    // produisait aucun retour visible : ça semblait ne "rien faire" au clic.
    reader.onerror = () => {
      setStatus(
        "Impossible de lire ce fichier — s'il vient de Drive/OneDrive/Dropbox, essayez de le télécharger d'abord dans le stockage de l'appareil (bouton « Télécharger » ou « Rendre disponible hors ligne » dans l'appli), puis réimportez-le depuis là."
      );
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
        `Sauvegarde importée : ${counts.gymnasts} gymnaste(s), ${counts.movements} mouvement(s), ${counts.clubs} club(s), ${counts.trainingSessions ?? 0} séance(s) d'entraînement, ${counts.gymnastMusic} musique(s), ${counts.photos ?? 0} photo(s), ${counts.videos ?? 0} vidéo(s). Les données précédentes de cet appareil ont été remplacées.`
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
          Télécharge un fichier JSON contenant toutes vos données (clubs, gymnastes, compétences, mouvements,
          historique) ainsi que les musiques, photos et vidéos <strong className="text-foreground">de cet appareil</strong>{" "}
          (ces fichiers ne sont pas synchronisés automatiquement entre appareils — ce fichier est le moyen de les
          transférer vers un autre appareil ou de les sauvegarder sur votre propre stockage : Drive, Dropbox, clé
          USB…). À faire régulièrement, en particulier avant/après une compétition.
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
          <strong className="text-danger">Remplace entièrement</strong> vos clubs/gymnastes/mouvements actuels (pour
          votre compte, sur tous vos appareils) ainsi que les musiques/photos/vidéos de cet appareil.
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
            Remplacer toutes vos données de compte par cette sauvegarde ({(confirming.gymnasts as unknown[])?.length ?? 0}{" "}
            gymnaste(s), {(confirming.movements as unknown[])?.length ?? 0} mouvement(s)) ? Cette action est
            irréversible pour les données actuelles de votre compte (tous appareils) et de cet appareil (musiques,
            photos, vidéos).
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
