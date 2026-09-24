import { getDb } from "@/lib/idb";

// Sauvegarde manuelle complète de la base locale (IndexedDB) -> un seul
// fichier JSON téléchargeable, et sa réimportation. Sert à la fois de
// filet de sécurité (pas de synchronisation automatique entre appareils)
// et de mécanisme de transfert d'un appareil à l'autre.

const STORES = ["clubs", "gymnasts", "gymnastSkills", "movements", "movementElements", "movementSnapshots"] as const;

// Les musiques (Blob) ne sont pas sérialisables telles quelles en JSON :
// elles sont converties en base64 à l'export, puis reconverties en Blob à
// l'import.
export interface BackupMusicEntry {
  id: string;
  gymnastId: string;
  fileName: string;
  mimeType: string;
  size: number;
  updatedAt: string;
  dataBase64: string;
}

export interface BackupPhotoAlbumEntry {
  id: string;
  name: string;
  date: string | null;
  team: string | null;
  club: string | null;
  createdAt: string;
}

export interface BackupPhotoEntry {
  id: string;
  albumId: string;
  fileName: string;
  mimeType: string;
  size: number;
  tags: string[];
  createdAt: string;
  dataBase64: string;
}

export interface BackupVideoAlbumEntry {
  id: string;
  name: string;
  date: string | null;
  team: string | null;
  club: string | null;
  createdAt: string;
}

export interface BackupVideoEntry {
  id: string;
  albumId: string;
  fileName: string;
  mimeType: string;
  size: number;
  tags: string[];
  createdAt: string;
  dataBase64: string;
}

export interface BackupData {
  version: 1 | 2 | 3 | 4;
  exportedAt: string;
  clubs: unknown[];
  gymnasts: unknown[];
  gymnastSkills: unknown[];
  movements: unknown[];
  movementElements: unknown[];
  movementSnapshots: unknown[];
  gymnastMusic?: BackupMusicEntry[];
  photoAlbums?: BackupPhotoAlbumEntry[];
  photos?: BackupPhotoEntry[];
  videoAlbums?: BackupVideoAlbumEntry[];
  videos?: BackupVideoEntry[];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // dataURL au format "data:<mime>;base64,<data>" -> ne garder que <data>
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

export async function exportAll(): Promise<BackupData> {
  const db = await getDb();
  const data = {} as Record<(typeof STORES)[number], unknown[]>;
  for (const store of STORES) {
    data[store] = await db.getAll(store);
  }
  const musicRows = await db.getAll("gymnastMusic");
  const gymnastMusic: BackupMusicEntry[] = await Promise.all(
    musicRows.map(async (m) => ({
      id: m.id,
      gymnastId: m.gymnastId,
      fileName: m.fileName,
      mimeType: m.mimeType,
      size: m.size,
      updatedAt: m.updatedAt,
      dataBase64: await blobToBase64(m.blob),
    }))
  );

  const albumRows = await db.getAll("photoAlbums");
  const photoAlbums: BackupPhotoAlbumEntry[] = albumRows.map((a) => ({
    id: a.id,
    name: a.name,
    date: a.date,
    team: a.team,
    club: a.club,
    createdAt: a.createdAt,
  }));

  const photoRows = await db.getAll("photos");
  const photos: BackupPhotoEntry[] = await Promise.all(
    photoRows.map(async (p) => ({
      id: p.id,
      albumId: p.albumId,
      fileName: p.fileName,
      mimeType: p.mimeType,
      size: p.size,
      tags: p.tags,
      createdAt: p.createdAt,
      dataBase64: await blobToBase64(p.blob),
    }))
  );

  const videoAlbumRows = await db.getAll("videoAlbums");
  const videoAlbums: BackupVideoAlbumEntry[] = videoAlbumRows.map((a) => ({
    id: a.id,
    name: a.name,
    date: a.date,
    team: a.team,
    club: a.club,
    createdAt: a.createdAt,
  }));

  const videoRows = await db.getAll("videos");
  const videos: BackupVideoEntry[] = await Promise.all(
    videoRows.map(async (v) => ({
      id: v.id,
      albumId: v.albumId,
      fileName: v.fileName,
      mimeType: v.mimeType,
      size: v.size,
      tags: v.tags,
      createdAt: v.createdAt,
      dataBase64: await blobToBase64(v.blob),
    }))
  );

  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    ...data,
    gymnastMusic,
    photoAlbums,
    photos,
    videoAlbums,
    videos,
  } as BackupData;
}

export async function importAll(data: BackupData): Promise<{ counts: Record<string, number> }> {
  if (!data || (data.version !== 1 && data.version !== 2 && data.version !== 3 && data.version !== 4)) {
    throw new Error("Fichier de sauvegarde invalide ou d'une version non prise en charge.");
  }
  const db = await getDb();
  const tx = db.transaction(
    [...STORES, "gymnastMusic", "photoAlbums", "photos", "videoAlbums", "videos"],
    "readwrite"
  );
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

  const musicStore = tx.objectStore("gymnastMusic");
  await musicStore.clear();
  const musicRows = data.gymnastMusic ?? [];
  for (const entry of musicRows) {
    await musicStore.put({
      id: entry.id,
      gymnastId: entry.gymnastId,
      fileName: entry.fileName,
      mimeType: entry.mimeType,
      size: entry.size,
      updatedAt: entry.updatedAt,
      blob: base64ToBlob(entry.dataBase64, entry.mimeType),
    });
  }
  counts.gymnastMusic = musicRows.length;

  const albumStore = tx.objectStore("photoAlbums");
  await albumStore.clear();
  const albumRows = data.photoAlbums ?? [];
  for (const entry of albumRows) {
    await albumStore.put(entry);
  }
  counts.photoAlbums = albumRows.length;

  const photoStore = tx.objectStore("photos");
  await photoStore.clear();
  const photoRows = data.photos ?? [];
  for (const entry of photoRows) {
    await photoStore.put({
      id: entry.id,
      albumId: entry.albumId,
      fileName: entry.fileName,
      mimeType: entry.mimeType,
      size: entry.size,
      tags: entry.tags,
      createdAt: entry.createdAt,
      blob: base64ToBlob(entry.dataBase64, entry.mimeType),
    });
  }
  counts.photos = photoRows.length;

  const videoAlbumStore = tx.objectStore("videoAlbums");
  await videoAlbumStore.clear();
  const videoAlbumRows = data.videoAlbums ?? [];
  for (const entry of videoAlbumRows) {
    await videoAlbumStore.put(entry);
  }
  counts.videoAlbums = videoAlbumRows.length;

  const videoStore = tx.objectStore("videos");
  await videoStore.clear();
  const videoRows = data.videos ?? [];
  for (const entry of videoRows) {
    await videoStore.put({
      id: entry.id,
      albumId: entry.albumId,
      fileName: entry.fileName,
      mimeType: entry.mimeType,
      size: entry.size,
      tags: entry.tags,
      createdAt: entry.createdAt,
      blob: base64ToBlob(entry.dataBase64, entry.mimeType),
    });
  }
  counts.videos = videoRows.length;

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
