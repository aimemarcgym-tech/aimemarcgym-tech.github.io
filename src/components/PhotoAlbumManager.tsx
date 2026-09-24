"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPhotoAlbums,
  createPhotoAlbum,
  updatePhotoAlbum,
  deletePhotoAlbum,
  getPhotosByAlbum,
  addPhoto,
  setPhotoTags,
  deletePhoto,
} from "@/lib/data";

type Album = Awaited<ReturnType<typeof getPhotoAlbums>>[number];
type Photo = Awaited<ReturnType<typeof getPhotosByAlbum>>[number];

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function PhotoTagsEditor({ photo, onChange }: { photo: Photo; onChange: () => void }) {
  const [value, setValue] = useState(photo.tags.join(", "));
  const [saved, setSaved] = useState(true);

  async function save() {
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await setPhotoTags(photo.id, tags);
    setSaved(true);
    onChange();
  }

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        onBlur={saved ? undefined : save}
        placeholder="Tags (séparés par des virgules)…"
        className="w-full rounded border border-border-subtle bg-surface px-2 py-1 text-xs text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
      />
      {!saved && (
        <button
          type="button"
          onClick={save}
          className="shrink-0 rounded border border-border-strong px-1.5 py-1 text-[10px] font-medium text-foreground hover:border-accent-solid"
        >
          ✓
        </button>
      )}
    </div>
  );
}

function PhotoCard({ photo, onChange }: { photo: Photo; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const objectUrl = useMemo(() => URL.createObjectURL(photo.blob), [photo]);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  async function handleDelete() {
    setBusy(true);
    try {
      await deletePhoto(photo.id);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-alt/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={objectUrl} alt={photo.fileName} className="aspect-square w-full object-cover" />
      <div className="p-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted" title={photo.fileName}>
            {photo.fileName} · {formatSize(photo.size)}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="shrink-0 text-xs text-danger hover:underline disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
        <PhotoTagsEditor photo={photo} onChange={onChange} />
        {photo.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {photo.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-accent-solid/40 bg-accent-from/10 px-1.5 py-0.5 text-[10px] font-medium text-white"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumView({
  album,
  onBack,
  onDeleted,
  onUpdated,
}: {
  album: Album;
  onBack: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(album.name);
  const [editDate, setEditDate] = useState(album.date ?? "");
  const [editTeam, setEditTeam] = useState(album.team ?? "");
  const [savingAlbum, setSavingAlbum] = useState(false);

  useEffect(() => {
    setEditName(album.name);
    setEditDate(album.date ?? "");
    setEditTeam(album.team ?? "");
  }, [album]);

  function refresh() {
    getPhotosByAlbum(album.id).then(setPhotos);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.id]);

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        await addPhoto(album.id, file);
      }
      refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAlbum() {
    if (!confirm(`Supprimer l'album « ${album.name} » et toutes ses photos ?`)) return;
    await deletePhotoAlbum(album.id);
    onDeleted();
  }

  async function handleSaveAlbum(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingAlbum(true);
    try {
      await updatePhotoAlbum(album.id, editName, editDate, editTeam);
      onUpdated();
      setEditing(false);
    } finally {
      setSavingAlbum(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <button type="button" onClick={onBack} className="text-sm accent-gradient-text font-medium">
            ← Tous les albums
          </button>
          {editing ? (
            <form onSubmit={handleSaveAlbum} className="mt-1 space-y-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                placeholder="Nom de l'album"
                className="w-full min-w-[280px] rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm font-semibold text-foreground focus:border-accent-solid focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <input
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  placeholder="Date (optionnel)"
                  className="rounded border border-border-strong bg-surface-alt px-2 py-1 text-xs text-foreground focus:border-accent-solid focus:outline-none"
                />
                <input
                  value={editTeam}
                  onChange={(e) => setEditTeam(e.target.value)}
                  placeholder="Équipe (optionnel)"
                  className="rounded border border-border-strong bg-surface-alt px-2 py-1 text-xs text-foreground focus:border-accent-solid focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={savingAlbum}
                  className="rounded bg-accent-solid px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded border border-border-strong px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start gap-2">
              <div>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{album.name}</h3>
                <p className="text-xs text-muted">
                  {[album.date, album.team].filter(Boolean).join(" · ") || "Aucune date/équipe précisée"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-1 text-xs text-muted underline hover:text-foreground"
              >
                Modifier
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Import…" : "+ Ajouter des photos"}
          </button>
          <button
            type="button"
            onClick={handleDeleteAlbum}
            className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-muted hover:border-red-400 hover:text-red-400"
          >
            Supprimer l&apos;album
          </button>
        </div>
      </div>

      {!photos ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted">Aucune photo dans cet album pour l&apos;instant.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} onChange={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PhotoAlbumManager() {
  const [albums, setAlbums] = useState<Album[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [team, setTeam] = useState("");
  const [creating, setCreating] = useState(false);

  function refresh() {
    getPhotoAlbums().then(setAlbums);
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = albums?.find((a) => a.id === selectedId) ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const album = await createPhotoAlbum(name, date, team);
      setName("");
      setDate("");
      setTeam("");
      setShowForm(false);
      refresh();
      setSelectedId(album.id);
    } finally {
      setCreating(false);
    }
  }

  if (selected) {
    return (
      <AlbumView
        album={selected}
        onBack={() => setSelectedId(null)}
        onDeleted={() => {
          setSelectedId(null);
          refresh();
        }}
        onUpdated={refresh}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Albums (compétitions / événements)</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          {showForm ? "Annuler" : "+ Nouvel album"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-4 space-y-2 rounded-xl border border-border-subtle bg-surface p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Nom de l&apos;album (ex : Compétition 31 janvier à Rungis, Équipe B3)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Compétition 31 janvier à Rungis, Équipe B3"
              className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Date (optionnel)</label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="31 janvier 2027"
                className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Équipe (optionnel)</label>
              <input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Équipe B3"
                className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-accent-solid px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Créer l&apos;album
          </button>
        </form>
      )}

      {!albums ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : albums.length === 0 ? (
        <p className="text-sm text-muted">
          Aucun album pour l&apos;instant. Créez-en un pour commencer à classer vos photos par compétition/événement.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedId(a.id)}
              className="rounded-xl border border-border-subtle bg-surface-alt/40 p-3 text-left transition-colors hover:border-accent-solid"
            >
              <div className="font-medium text-foreground">{a.name}</div>
              <div className="mt-0.5 text-xs text-muted">
                {[a.date, a.team].filter(Boolean).join(" · ") || "Aucune date/équipe précisée"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
