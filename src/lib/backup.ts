import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db, getCurrentUid } from "@/lib/firebase";
import { getDb } from "@/lib/idb";

// Sauvegarde manuelle complète -> un seul fichier JSON téléchargeable, et sa
// réimportation. Clubs/gymnastes/mouvements vivent maintenant dans Firestore
// (synchronisés entre appareils, voir src/lib/data.ts) ; musiques, photos et
// vidéos restent volontairement locales à l'appareil (pas de synchro cloud
// automatique pour ces fichiers, cf. le choix fait avec l'utilisateur) — ce
// fichier de sauvegarde est donc leur seul moyen de transférer ces médias
// d'un appareil à l'autre ou vers leur propre stockage personnel.

const STORES = [
  "clubs",
  "gymnasts",
  "gymnastSkills",
  "movements",
  "movementElements",
  "movementSnapshots",
  "trainingSessions",
] as const;

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
  version: 1 | 2 | 3 | 4 | 5 | 6;
  exportedAt: string;
  clubs: unknown[];
  gymnasts: unknown[];
  gymnastSkills: unknown[];
  movements: unknown[];
  movementElements: unknown[];
  movementSnapshots: unknown[];
  trainingSessions?: unknown[];
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

// Remplace tout le contenu d'une collection Firestore par une nouvelle
// liste de lignes (chacune gardant son id d'origine), par lots de 450
// écritures max (limite Firestore : 500 opérations/batch).
async function replaceFirestoreCollection(uid: string, storeName: string, rows: Record<string, unknown>[]) {
  const colRef = collection(db, "users", uid, storeName);
  const existingSnap = await getDocs(colRef);
  const existingDocs = existingSnap.docs;
  for (let i = 0; i < existingDocs.length; i += 450) {
    const batch = writeBatch(db);
    for (const d of existingDocs.slice(i, i + 450)) batch.delete(d.ref);
    await batch.commit();
  }
  for (let i = 0; i < rows.length; i += 450) {
    const batch = writeBatch(db);
    for (const row of rows.slice(i, i + 450)) {
      const id = String((row as { id: string }).id);
      batch.set(doc(colRef, id), row);
    }
    await batch.commit();
  }
}

export async function exportAll(): Promise<BackupData> {
  const uid = getCurrentUid();
  const data = {} as Record<(typeof STORES)[number], unknown[]>;
  for (const store of STORES) {
    const snap = await getDocs(collection(db, "users", uid, store));
    data[store] = snap.docs.map((d) => d.data());
  }

  const localDb = await getDb();
  const musicRows = await localDb.getAll("gymnastMusic");
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

  const albumRows = await localDb.getAll("photoAlbums");
  const photoAlbums: BackupPhotoAlbumEntry[] = albumRows.map((a) => ({
    id: a.id,
    name: a.name,
    date: a.date,
    team: a.team,
    club: a.club,
    createdAt: a.createdAt,
  }));

  const photoRows = await localDb.getAll("photos");
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

  const videoAlbumRows = await localDb.getAll("videoAlbums");
  const videoAlbums: BackupVideoAlbumEntry[] = videoAlbumRows.map((a) => ({
    id: a.id,
    name: a.name,
    date: a.date,
    team: a.team,
    club: a.club,
    createdAt: a.createdAt,
  }));

  const videoRows = await localDb.getAll("videos");
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
    version: 6,
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
  if (!data || ![1, 2, 3, 4, 5, 6].includes(data.version)) {
    throw new Error("Fichier de sauvegarde invalide ou d'une version non prise en charge.");
  }
  const uid = getCurrentUid();
  const counts: Record<string, number> = {};

  for (const store of STORES) {
    const rows = (data[store] as Record<string, unknown>[]) ?? [];
    await replaceFirestoreCollection(uid, store, rows);
    counts[store] = rows.length;
  }

  const localDb = await getDb();
  const tx = localDb.transaction(["gymnastMusic", "photoAlbums", "photos", "videoAlbums", "videos"], "readwrite");

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
