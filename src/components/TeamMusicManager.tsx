"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getGymnasts, getGymnastMusic, saveGymnastMusic, deleteGymnastMusic, setGymnastsMusicOrder } from "@/lib/data";
import type { GymnastMusicRow as GymnastMusicRecord } from "@/lib/idb";

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

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function GymnastMusicItem({
  gymnast,
  music,
  onChange,
  onExportOne,
}: {
  gymnast: Gymnast;
  music: GymnastMusicRecord | undefined | null;
  onChange: () => void;
  onExportOne: (gymnast: Gymnast, music: GymnastMusicRecord) => void;
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

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="cursor-grab select-none text-muted active:cursor-grabbing" title="Glisser pour réordonner">
            ⠿
          </span>
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
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={objectUrl} className="h-9 w-full" />
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

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  async function reorderTo(from: number, to: number) {
    if (from === to) return;
    const next = [...members];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    await setGymnastsMusicOrder(next.map((g) => g.id));
    refresh();
  }

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
              const isDragOver = dragOverIndex === i && dragIndex !== null && dragIndex !== i;
              return (
                <div
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
                  className={`rounded-lg transition ${
                    isDragging ? "opacity-50" : isDragOver ? "ring-2 ring-accent-solid" : ""
                  }`}
                >
                  <GymnastMusicItem
                    gymnast={g}
                    music={musicByGymnast[g.id]}
                    onChange={reloadMusic}
                    onExportOne={handleExportOne}
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
