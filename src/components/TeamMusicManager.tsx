"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getGymnasts, getGymnastMusic, saveGymnastMusic, deleteGymnastMusic, setGymnastsMusicOrder } from "@/lib/data";
import type { GymnastMusicRow as GymnastMusicRecord } from "@/lib/idb";
import CustomAudioPlayer from "@/components/CustomAudioPlayer";
import { shareFiles } from "@/lib/share";
import DragHandle from "@/components/DragHandle";
import { useDragReorder } from "@/hooks/useDragReorder";
import { formatSize } from "@/lib/format";

type Gymnast = Awaited<ReturnType<typeof getGymnasts>>[number];

// File System Access API : pas encore dans les types DOM standards de
// TypeScript. Détection de disponibilité (Chrome/Edge/Vivaldi/Opera —
// pas Firefox/Safari) avec repli sur le téléchargement classique sinon.
type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandleLike>;
};
interface FileSystemDirectoryHandleLike {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandleLike>;
}
interface FileSystemFileHandleLike {
  createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
}

function sanitizeFileName(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function GymnastMusicItem({
  gymnast,
  music,
  onChange,
  onExportOne,
  dragHandleProps,
}: {
  gymnast: Gymnast;
  music: GymnastMusicRecord | undefined | null;
  onChange: () => void;
  onExportOne: (gymnast: Gymnast, music: GymnastMusicRecord) => void;
  dragHandleProps: React.ComponentProps<typeof DragHandle>;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrl = useMemo(() => (music ? URL.createObjectURL(music.blob) : null), [music]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  async function handleUpload(file: File) {
    setBusy(true);
    try {
      await saveGymnastMusic(gymnast.id, file);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteGymnastMusic(gymnast.id);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!music) return;
    const file = new File([music.blob], music.fileName, { type: music.mimeType });
    const result = await shareFiles([file], { title: music.fileName });
    if (result === "unsupported") {
      alert("Le partage n'est pas disponible sur ce navigateur. Utilisez « Envoyer sur clé USB » ou téléchargez le fichier.");
    }
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          {/* Seule cette poignée réagit au drag (pas toute la ligne) : sinon
              le glisser-déposer capture aussi les interactions avec le
              curseur du lecteur audio (volume, avancer/reculer) plus bas. */}
          <DragHandle {...dragHandleProps} />
          {gymnast.firstName} {gymnast.lastName}
        </span>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid disabled:opacity-50"
          >
            {music ? "Remplacer" : "Importer"}
          </button>
          {music && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={handleShare}
                className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid disabled:opacity-50"
              >
                Partager
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onExportOne(gymnast, music)}
                className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid disabled:opacity-50"
              >
                Envoyer sur clé USB
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-muted hover:border-red-400 hover:text-red-400 disabled:opacity-50"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>
      {music && objectUrl ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-xs text-muted">
            {music.fileName} · {formatSize(music.size)}
          </p>
          <CustomAudioPlayer src={objectUrl} />
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">Aucune musique importée.</p>
      )}
    </div>
  );
}

export default function TeamMusicManager() {
  const [gymnasts, setGymnasts] = useState<Gymnast[] | null>(null);
  const [teamKey, setTeamKey] = useState("");
  const [musicByGymnast, setMusicByGymnast] = useState<Record<string, GymnastMusicRecord | undefined>>({});
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  function refresh() {
    getGymnasts().then(setGymnasts);
  }

  useEffect(() => {
    refresh();
  }, []);

  const teams = useMemo(() => {
    if (!gymnasts) return [];
    const map = new Map<string, { club: string; team: string }>();
    for (const g of gymnasts) {
      if (!g.team) continue;
      const club = g.club?.name ?? "Sans club";
      const key = `${club}::${g.team}`;
      if (!map.has(key)) map.set(key, { club, team: g.team });
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [gymnasts]);

  const members = useMemo(() => {
    if (!gymnasts || !teamKey) return [];
    const selected = teams.find((t) => t.key === teamKey);
    if (!selected) return [];
    const filtered = gymnasts.filter((g) => (g.club?.name ?? "Sans club") === selected.club && g.team === selected.team);
    // Ordre choisi par glisser-déposer (musicOrder), sinon ordre alphabétique
    // déjà appliqué par getGymnasts() -> tri stable, les non-ordonnées
    // gardent leur position relative à la fin.
    return [...filtered].sort((a, b) => {
      const ao = a.musicOrder ?? Infinity;
      const bo = b.musicOrder ?? Infinity;
      return ao - bo;
    });
  }, [gymnasts, teamKey, teams]);

  async function reorderTo(from: number, to: number) {
    if (from === to) return;
    const next = [...members];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    await setGymnastsMusicOrder(next.map((g) => g.id));
    refresh();
  }

  const { dragIndex, overIndex, setItemRef, handleProps } = useDragReorder(reorderTo);

  async function reloadMusic() {
    const entries = await Promise.all(members.map(async (g) => [g.id, await getGymnastMusic(g.id)] as const));
    setMusicByGymnast(Object.fromEntries(entries));
  }

  useEffect(() => {
    if (members.length > 0) reloadMusic();
    else setMusicByGymnast({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members]);

  const musicCount = members.filter((g) => musicByGymnast[g.id]).length;

  async function handleExportTeam() {
    setExportStatus(null);
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
    if (!picker) {
      setExportStatus(
        "Votre navigateur ne permet pas d'écrire directement sur une clé USB — téléchargez chaque musique avec le bouton ▶, puis copiez les fichiers téléchargés sur la clé."
      );
      return;
    }
    try {
      const dirHandle = await picker();
      let count = 0;
      // Préfixe numérique (01_, 02_...) sur le nom de fichier : les
      // explorateurs de fichiers/lecteurs trient par défaut par ordre
      // alphabétique, donc ce préfixe fait apparaître les musiques sur la
      // clé dans l'ordre de passage défini par glisser-déposer.
      const total = members.length;
      const padLength = String(total).length;
      for (let i = 0; i < members.length; i++) {
        const g = members[i];
        const music = musicByGymnast[g.id];
        if (!music) continue;
        const ext = music.fileName.includes(".") ? music.fileName.split(".").pop() : "mp3";
        const order = String(i + 1).padStart(padLength, "0");
        const name = `${order}_${sanitizeFileName(g.firstName)}_${sanitizeFileName(g.lastName)}.${ext}`;
        const fileHandle = await dirHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(music.blob);
        await writable.close();
        count += 1;
      }
      setExportStatus(count > 0 ? `${count} musique(s) copiée(s) sur la clé, dans l'ordre défini.` : "Aucune musique à exporter pour cette équipe.");
    } catch {
      // L'utilisateur a annulé la sélection du dossier, ou l'écriture a échoué.
      setExportStatus(null);
    }
  }

  async function handleExportOne(gymnast: Gymnast, music: GymnastMusicRecord) {
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
    if (!picker) {
      setExportStatus(
        "Votre navigateur ne permet pas d'écrire directement sur une clé USB — utilisez le bouton ▶ pour écouter puis téléchargez le fichier autrement."
      );
      return;
    }
    try {
      const dirHandle = await picker();
      const ext = music.fileName.includes(".") ? music.fileName.split(".").pop() : "mp3";
      const name = `${sanitizeFileName(gymnast.firstName)}_${sanitizeFileName(gymnast.lastName)}.${ext}`;
      const fileHandle = await dirHandle.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(music.blob);
      await writable.close();
      setExportStatus(`Musique de ${gymnast.firstName} ${gymnast.lastName} copiée sur la clé.`);
    } catch {
      setExportStatus(null);
    }
  }

  return (
    <div className="w-full max-w-2xl min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Musiques d&apos;équipe</h2>

      {!gymnasts ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune équipe trouvée. Renseignez le champ « Équipe » sur une gymnaste depuis l&apos;accueil.
        </p>
      ) : (
        <select
          value={teamKey}
          onChange={(e) => setTeamKey(e.target.value)}
          className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          <option value="">Sélectionner une équipe…</option>
          {teams.map((t) => (
            <option key={t.key} value={t.key}>
              {t.team} ({t.club})
            </option>
          ))}
        </select>
      )}

      {teamKey && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              {musicCount}/{members.length} musique(s) importée(s)
            </p>
            <button
              type="button"
              onClick={handleExportTeam}
              className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Envoyer toute l&apos;équipe sur une clé USB
            </button>
          </div>
          {exportStatus && <p className="text-xs text-muted">{exportStatus}</p>}
          <div className="space-y-2">
            {members.map((g, i) => {
              const isDragging = dragIndex === i;
              const isDragOver = overIndex === i && dragIndex !== null && dragIndex !== i;
              return (
                <div
                  key={g.id}
                  ref={setItemRef(i)}
                  className={`rounded-lg transition ${
                    isDragging ? "opacity-50" : isDragOver ? "ring-2 ring-accent-solid" : ""
                  }`}
                >
                  <GymnastMusicItem
                    gymnast={g}
                    music={musicByGymnast[g.id]}
                    onChange={reloadMusic}
                    onExportOne={handleExportOne}
                    dragHandleProps={handleProps(i)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
