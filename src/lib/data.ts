import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, getCurrentUid } from "@/lib/firebase";
import {
  getDb,
  type ClubRow,
  type GymnastRow,
  type GymnastSkillRow,
  type MovementRow,
  type MovementElementRow,
  type MovementSnapshotRow,
  type EquipmentSettings,
  type TrainingSessionRow,
  type ResultDocRow,
} from "@/lib/idb";
import type { PhotoAlbumRow, PhotoRow } from "@/lib/idb";
import { REGULATION_VERSION } from "@/regulation/loader";

// Couche de données : clubs/gymnastes/mouvements passent par Firestore
// (synchronisés entre appareils, cf. le plan de migration cloud), tandis que
// musiques/photos/vidéos restent en IndexedDB local (données binaires,
// hors périmètre de la synchro pour l'instant). Mêmes noms/signatures que
// l'ancienne couche 100% locale pour que les composants appelants n'aient
// rien à changer.

function nowIso() {
  return new Date().toISOString();
}

function col(name: string) {
  return collection(db, "users", getCurrentUid(), name);
}

function docRef(name: string, id: string) {
  return doc(db, "users", getCurrentUid(), name, id);
}

async function findOrCreateClub(clubName: string): Promise<string | undefined> {
  if (!clubName) return undefined;
  const snap = await getDocs(col("clubs"));
  const existing = snap.docs.find((d) => (d.data() as ClubRow).name === clubName);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  const club: ClubRow = { id, name: clubName, createdAt: nowIso() };
  await setDoc(docRef("clubs", id), club);
  return id;
}

export async function createGymnast(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthYearRaw = String(formData.get("birthYear") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();
  if (!firstName || !lastName) throw new Error("Nom et prénom requis");

  const clubId = await findOrCreateClub(String(formData.get("clubName") ?? "").trim());

  const gymnast: GymnastRow = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    clubId: clubId ?? null,
    team: team || null,
    birthYear: birthYearRaw ? Number(birthYearRaw) : null,
    createdAt: nowIso(),
  };
  await setDoc(docRef("gymnasts", gymnast.id), gymnast);
  return gymnast;
}

export async function getGymnasts() {
  const [gymnastsSnap, clubsSnap, movementsSnap] = await Promise.all([
    getDocs(col("gymnasts")),
    getDocs(col("clubs")),
    getDocs(col("movements")),
  ]);
  const gymnasts = gymnastsSnap.docs.map((d) => d.data() as GymnastRow);
  const clubs = clubsSnap.docs.map((d) => d.data() as ClubRow);
  const movements = movementsSnap.docs.map((d) => d.data() as MovementRow);

  const clubById = new Map(clubs.map((c) => [c.id, c]));
  const movementsByGymnast = new Map<string, MovementRow[]>();
  for (const m of movements) {
    const list = movementsByGymnast.get(m.gymnastId) ?? [];
    list.push(m);
    movementsByGymnast.set(m.gymnastId, list);
  }

  const enriched = gymnasts.map((g) => ({
    ...g,
    club: g.clubId ? (clubById.get(g.clubId) ?? null) : null,
    movements: movementsByGymnast.get(g.id) ?? [],
  }));

  enriched.sort((a, b) => {
    const clubCmp = (a.club?.name ?? "").localeCompare(b.club?.name ?? "");
    if (clubCmp !== 0) return clubCmp;
    return a.lastName.localeCompare(b.lastName);
  });
  return enriched;
}

// Renomme un club pour tout le monde d'un coup (le club est une entité à
// part, référencée par id -> il suffit de mettre à jour son nom, chaque
// gymnaste qui pointe dessus suit automatiquement).
export async function renameClub(clubId: string, newName: string) {
  const trimmed = newName.trim();
  if (!trimmed) return;
  const ref = docRef("clubs", clubId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, { name: trimmed });
}

// Supprime un club : les gymnastes qui y étaient rattachées ne sont pas
// supprimées, elles repassent simplement "sans club" (clubId à null).
export async function deleteClub(clubId: string) {
  const snap = await getDocs(query(col("gymnasts"), where("clubId", "==", clubId)));
  const batch = writeBatch(db);
  for (const d of snap.docs) batch.update(d.ref, { clubId: null });
  batch.delete(docRef("clubs", clubId));
  await batch.commit();
}

// Renomme une équipe pour toutes les gymnastes qui la partagent (le champ
// "team" est un texte libre par gymnaste, pas une entité séparée -> on met
// à jour chaque gymnaste du club dont le champ correspond à l'ancien nom).
export async function renameTeam(clubId: string | null, oldTeamName: string, newTeamName: string) {
  const trimmed = newTeamName.trim();
  if (!trimmed) return;
  const snap = await getDocs(col("gymnasts"));
  const matching = snap.docs.filter((d) => {
    const g = d.data() as GymnastRow;
    return (g.clubId ?? null) === clubId && g.team === oldTeamName;
  });
  if (matching.length === 0) return;
  const batch = writeBatch(db);
  for (const d of matching) batch.update(d.ref, { team: trimmed });
  await batch.commit();
}

export async function updateGymnastTeam(gymnastId: string, team: string) {
  const ref = docRef("gymnasts", gymnastId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, { team: team.trim() || null });
}

export async function updateGymnast(
  gymnastId: string,
  data: { firstName: string; lastName: string; clubName: string; birthYear: string }
) {
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  if (!firstName || !lastName) throw new Error("Nom et prénom requis");

  const clubId = await findOrCreateClub(data.clubName.trim());

  const ref = docRef("gymnasts", gymnastId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, {
    firstName,
    lastName,
    clubId: clubId ?? null,
    birthYear: data.birthYear.trim() ? Number(data.birthYear) : null,
  });
}

export async function deleteGymnast(gymnastId: string) {
  const [skillsSnap, movementsSnap, trainingSnap] = await Promise.all([
    getDocs(query(col("gymnastSkills"), where("gymnastId", "==", gymnastId))),
    getDocs(query(col("movements"), where("gymnastId", "==", gymnastId))),
    getDocs(query(col("trainingSessions"), where("gymnastId", "==", gymnastId))),
  ]);
  for (const m of movementsSnap.docs) {
    await deleteMovementCascade(m.id);
  }
  const batch = writeBatch(db);
  batch.delete(docRef("gymnasts", gymnastId));
  for (const s of skillsSnap.docs) batch.delete(s.ref);
  for (const t of trainingSnap.docs) batch.delete(t.ref);
  await batch.commit();

  // La musique reste locale à l'appareil (non synchronisée) : on nettoie
  // directement dans IndexedDB.
  const localDb = await getDb();
  const music = await localDb.getAllFromIndex("gymnastMusic", "gymnastId", gymnastId);
  if (music.length > 0) {
    const tx = localDb.transaction("gymnastMusic", "readwrite");
    await Promise.all([...music.map((m) => tx.objectStore("gymnastMusic").delete(m.id)), tx.done]);
  }
}

export async function getGymnast(id: string) {
  const ref = docRef("gymnasts", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const gymnast = snap.data() as GymnastRow;

  const [clubSnap, skillsSnap, movementsSnap] = await Promise.all([
    gymnast.clubId ? getDoc(docRef("clubs", gymnast.clubId)) : Promise.resolve(null),
    getDocs(query(col("gymnastSkills"), where("gymnastId", "==", id))),
    getDocs(query(col("movements"), where("gymnastId", "==", id))),
  ]);

  const skills = skillsSnap.docs.map((d) => d.data() as GymnastSkillRow);
  const movements = movementsSnap.docs.map((d) => d.data() as MovementRow);
  movements.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    ...gymnast,
    club: clubSnap && clubSnap.exists() ? (clubSnap.data() as ClubRow) : null,
    skills,
    movements,
  };
}

export async function setSkillStatus(gymnastId: string, elementCode: string, status: string) {
  // Id déterministe = clé unique (gymnastId, elementCode), remplace l'index
  // composé unique qu'IndexedDB permettait.
  const id = `${gymnastId}_${elementCode}`;
  const row: GymnastSkillRow = { id, gymnastId, elementCode, status, updatedAt: nowIso() };
  await setDoc(docRef("gymnastSkills", id), row);
}

export async function createMovement(gymnastId: string, apparatus: string, evolution: string, label: string) {
  const movement: MovementRow = {
    id: crypto.randomUUID(),
    label,
    gymnastId,
    apparatus,
    evolution,
    regulationVer: REGULATION_VERSION,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await setDoc(docRef("movements", movement.id), movement);
  return movement;
}

export async function getMovement(id: string) {
  const ref = docRef("movements", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const movement = snap.data() as MovementRow;

  const [elementsSnap, gymnastSnap] = await Promise.all([
    getDocs(query(col("movementElements"), where("movementId", "==", id))),
    getDoc(docRef("gymnasts", movement.gymnastId)),
  ]);

  const elements = elementsSnap.docs.map((d) => d.data() as MovementElementRow);
  elements.sort((a, b) => a.position - b.position);

  let gymnastWithSkills: (GymnastRow & { skills: GymnastSkillRow[] }) | null = null;
  if (gymnastSnap.exists()) {
    const gymnast = gymnastSnap.data() as GymnastRow;
    const skillsSnap = await getDocs(query(col("gymnastSkills"), where("gymnastId", "==", gymnast.id)));
    gymnastWithSkills = { ...gymnast, skills: skillsSnap.docs.map((d) => d.data() as GymnastSkillRow) };
  }

  return { ...movement, elements, gymnast: gymnastWithSkills };
}

export async function saveMovementElements(movementId: string, elements: { code: string; role: string; serie?: string }[]) {
  const existingSnap = await getDocs(query(col("movementElements"), where("movementId", "==", movementId)));
  const batch = writeBatch(db);
  for (const d of existingSnap.docs) batch.delete(d.ref);
  elements.forEach((e, i) => {
    const id = crypto.randomUUID();
    const row: MovementElementRow = { id, movementId, elementCode: e.code, role: e.role, position: i, ...(e.serie ? { serie: e.serie } : {}) };
    batch.set(docRef("movementElements", id), row);
  });
  batch.update(docRef("movements", movementId), { updatedAt: nowIso() });
  await batch.commit();
}

export async function saveSnapshot(
  movementId: string,
  elementCodes: string[],
  noteDepart: number,
  detail: unknown,
  series?: (string | null)[]
) {
  const id = crypto.randomUUID();
  const row: MovementSnapshotRow = {
    id,
    movementId,
    createdAt: nowIso(),
    elementCodes: JSON.stringify(elementCodes),
    noteDepart,
    detailJson: JSON.stringify(detail),
    ...(series && series.some(Boolean) ? { series } : {}),
  };
  await setDoc(docRef("movementSnapshots", id), row);
  return row;
}

export async function updateSnapshot(
  snapshotId: string,
  elementCodes: string[],
  noteDepart: number,
  detail: unknown,
  series?: (string | null)[]
) {
  await updateDoc(docRef("movementSnapshots", snapshotId), {
    elementCodes: JSON.stringify(elementCodes),
    noteDepart,
    detailJson: JSON.stringify(detail),
    series: series && series.some(Boolean) ? series : deleteField(),
  });
}

export async function renameSnapshot(snapshotId: string, name: string) {
  await updateDoc(docRef("movementSnapshots", snapshotId), { name });
}

export async function deleteSnapshot(snapshotId: string) {
  await deleteDoc(docRef("movementSnapshots", snapshotId));
}

export async function getSnapshots(movementId: string) {
  const snap = await getDocs(query(col("movementSnapshots"), where("movementId", "==", movementId)));
  const snapshots = snap.docs.map((d) => d.data() as MovementSnapshotRow);
  snapshots.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return snapshots;
}

async function deleteMovementCascade(movementId: string) {
  const [elementsSnap, snapshotsSnap] = await Promise.all([
    getDocs(query(col("movementElements"), where("movementId", "==", movementId))),
    getDocs(query(col("movementSnapshots"), where("movementId", "==", movementId))),
  ]);
  const batch = writeBatch(db);
  batch.delete(docRef("movements", movementId));
  for (const d of elementsSnap.docs) batch.delete(d.ref);
  for (const d of snapshotsSnap.docs) batch.delete(d.ref);
  await batch.commit();
}

export async function deleteMovement(movementId: string) {
  await deleteMovementCascade(movementId);
}

export async function getGymnastMusic(gymnastId: string) {
  const localDb = await getDb();
  return localDb.getFromIndex("gymnastMusic", "gymnastId", gymnastId);
}

export async function saveGymnastMusic(gymnastId: string, file: File) {
  const localDb = await getDb();
  const existing = await localDb.getFromIndex("gymnastMusic", "gymnastId", gymnastId);
  const row = {
    id: existing?.id ?? crypto.randomUUID(),
    gymnastId,
    fileName: file.name,
    mimeType: file.type || "audio/mpeg",
    size: file.size,
    blob: file,
    updatedAt: nowIso(),
  };
  await localDb.put("gymnastMusic", row);
  return row;
}

export async function renameGymnastMusic(gymnastId: string, fileName: string) {
  const localDb = await getDb();
  const existing = await localDb.getFromIndex("gymnastMusic", "gymnastId", gymnastId);
  if (!existing) return;
  await localDb.put("gymnastMusic", { ...existing, fileName, updatedAt: nowIso() });
}

export async function deleteGymnastMusic(gymnastId: string) {
  const localDb = await getDb();
  const existing = await localDb.getFromIndex("gymnastMusic", "gymnastId", gymnastId);
  if (existing) await localDb.delete("gymnastMusic", existing.id);
}

export async function setGymnastsMusicOrder(orderedGymnastIds: string[]) {
  const batch = writeBatch(db);
  orderedGymnastIds.forEach((id, index) => {
    batch.update(docRef("gymnasts", id), { musicOrder: index });
  });
  await batch.commit();
}

export async function setGymnastsHomeOrder(orderedGymnastIds: string[]) {
  const batch = writeBatch(db);
  orderedGymnastIds.forEach((id, index) => {
    batch.update(docRef("gymnasts", id), { homeOrder: index });
  });
  await batch.commit();
}

export async function setGymnastEquipment(gymnastId: string, patch: Partial<Record<keyof EquipmentSettings, string>>) {
  const fields = Object.fromEntries(Object.entries(patch).map(([k, v]) => [`reglages.${k}`, v]));
  await updateDoc(docRef("gymnasts", gymnastId), fields);
}

export async function setGymnastsPassageOrder(apparatus: string, orderedGymnastIds: string[]) {
  const batch = writeBatch(db);
  orderedGymnastIds.forEach((id, index) => {
    batch.update(docRef("gymnasts", id), { [`passageOrder.${apparatus}`]: index });
  });
  await batch.commit();
}

export async function getPhotoAlbums() {
  const localDb = await getDb();
  const albums = await localDb.getAll("photoAlbums");
  albums.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return albums;
}

export async function createPhotoAlbum(
  name: string,
  date: string,
  team: string,
  club: string
): Promise<PhotoAlbumRow> {
  const localDb = await getDb();
  const album: PhotoAlbumRow = {
    id: crypto.randomUUID(),
    name: name.trim(),
    date: date.trim() || null,
    team: team.trim() || null,
    club: club.trim() || null,
    createdAt: nowIso(),
  };
  await localDb.put("photoAlbums", album);
  return album;
}

export async function updatePhotoAlbum(albumId: string, name: string, date: string, team: string, club: string) {
  const localDb = await getDb();
  const album = await localDb.get("photoAlbums", albumId);
  if (!album) return;
  album.name = name.trim() || album.name;
  album.date = date.trim() || null;
  album.team = team.trim() || null;
  album.club = club.trim() || null;
  await localDb.put("photoAlbums", album);
}

export async function deletePhotoAlbum(albumId: string) {
  const localDb = await getDb();
  const photos = await localDb.getAllFromIndex("photos", "albumId", albumId);
  const tx = localDb.transaction(["photoAlbums", "photos"], "readwrite");
  await Promise.all([
    tx.objectStore("photoAlbums").delete(albumId),
    ...photos.map((p) => tx.objectStore("photos").delete(p.id)),
    tx.done,
  ]);
}

export async function getPhotosByAlbum(albumId: string) {
  const localDb = await getDb();
  const photos = await localDb.getAllFromIndex("photos", "albumId", albumId);
  photos.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return photos;
}

export async function addPhoto(albumId: string, file: File): Promise<PhotoRow> {
  const localDb = await getDb();
  const photo: PhotoRow = {
    id: crypto.randomUUID(),
    albumId,
    fileName: file.name,
    mimeType: file.type || "image/jpeg",
    size: file.size,
    blob: file,
    tags: [],
    createdAt: nowIso(),
  };
  await localDb.put("photos", photo);
  return photo;
}

export async function setPhotoTags(photoId: string, tags: string[]) {
  const localDb = await getDb();
  const photo = await localDb.get("photos", photoId);
  if (!photo) return;
  photo.tags = tags;
  await localDb.put("photos", photo);
}

export async function deletePhoto(photoId: string) {
  const localDb = await getDb();
  await localDb.delete("photos", photoId);
}

export async function getVideoAlbums() {
  const localDb = await getDb();
  const albums = await localDb.getAll("videoAlbums");
  albums.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return albums;
}

export async function createVideoAlbum(name: string, date: string, team: string, club: string) {
  const localDb = await getDb();
  const album = {
    id: crypto.randomUUID(),
    name: name.trim(),
    date: date.trim() || null,
    team: team.trim() || null,
    club: club.trim() || null,
    createdAt: nowIso(),
  };
  await localDb.put("videoAlbums", album);
  return album;
}

export async function updateVideoAlbum(albumId: string, name: string, date: string, team: string, club: string) {
  const localDb = await getDb();
  const album = await localDb.get("videoAlbums", albumId);
  if (!album) return;
  album.name = name.trim() || album.name;
  album.date = date.trim() || null;
  album.team = team.trim() || null;
  album.club = club.trim() || null;
  await localDb.put("videoAlbums", album);
}

export async function deleteVideoAlbum(albumId: string) {
  const localDb = await getDb();
  const videos = await localDb.getAllFromIndex("videos", "albumId", albumId);
  const tx = localDb.transaction(["videoAlbums", "videos"], "readwrite");
  await Promise.all([
    tx.objectStore("videoAlbums").delete(albumId),
    ...videos.map((v) => tx.objectStore("videos").delete(v.id)),
    tx.done,
  ]);
}

export async function getVideosByAlbum(albumId: string) {
  const localDb = await getDb();
  const videos = await localDb.getAllFromIndex("videos", "albumId", albumId);
  videos.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return videos;
}

export async function addVideo(albumId: string, file: File) {
  const localDb = await getDb();
  const video = {
    id: crypto.randomUUID(),
    albumId,
    fileName: file.name,
    mimeType: file.type || "video/mp4",
    size: file.size,
    blob: file,
    tags: [] as string[],
    createdAt: nowIso(),
  };
  await localDb.put("videos", video);
  return video;
}

export async function setVideoTags(videoId: string, tags: string[]) {
  const localDb = await getDb();
  const video = await localDb.get("videos", videoId);
  if (!video) return;
  video.tags = tags;
  await localDb.put("videos", video);
}

export async function deleteVideo(videoId: string) {
  const localDb = await getDb();
  await localDb.delete("videos", videoId);
}

// Journal d'entraînement (onglet Entraînement > Programme technique/physique) :
// une séance datée, soit pour une gymnaste précise, soit pour toute une
// équipe (clé "club::équipe", même format que passageOrder ailleurs).
export type TrainingTarget = { kind: "gymnast"; id: string } | { kind: "team"; key: string };

function trainingTargetFilter(target: TrainingTarget) {
  return target.kind === "gymnast"
    ? where("gymnastId", "==", target.id)
    : where("teamKey", "==", target.key);
}

export async function getTrainingSessions(target: TrainingTarget, type: "TECHNIQUE" | "PHYSIQUE") {
  const snap = await getDocs(
    query(col("trainingSessions"), trainingTargetFilter(target), where("type", "==", type))
  );
  const rows = snap.docs.map((d) => d.data() as TrainingSessionRow);
  rows.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  return rows;
}

export async function addTrainingSession(
  target: TrainingTarget,
  type: "TECHNIQUE" | "PHYSIQUE",
  date: string,
  content: string
) {
  const row: TrainingSessionRow = {
    id: crypto.randomUUID(),
    ...(target.kind === "gymnast" ? { gymnastId: target.id } : { teamKey: target.key }),
    type,
    date,
    content,
    createdAt: nowIso(),
  };
  await setDoc(docRef("trainingSessions", row.id), row);
  return row;
}

export async function updateTrainingSession(sessionId: string, date: string, content: string) {
  await updateDoc(docRef("trainingSessions", sessionId), { date, content });
}

export async function deleteTrainingSession(sessionId: string) {
  await deleteDoc(docRef("trainingSessions", sessionId));
}

// Documents de résultats (Word/PDF/etc.) — même logique cible "gymnaste
// précise ou toute une équipe" que le journal d'entraînement, mais stockés
// en local (IndexedDB) comme les musiques/photos/vidéos : ce sont des
// fichiers binaires, hors périmètre de la synchro Firestore pour l'instant.
function resultDocTargetKey(target: TrainingTarget) {
  return target.kind === "gymnast" ? `gymnast::${target.id}` : `team::${target.key}`;
}

export async function getResultDocs(target: TrainingTarget) {
  const localDb = await getDb();
  const docs = await localDb.getAllFromIndex("resultDocs", "targetKey", resultDocTargetKey(target));
  docs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.createdAt.localeCompare(a.createdAt));
  return docs;
}

export async function addResultDoc(target: TrainingTarget, file: File, date: string | null): Promise<ResultDocRow> {
  const localDb = await getDb();
  const row: ResultDocRow = {
    id: crypto.randomUUID(),
    targetKey: resultDocTargetKey(target),
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    blob: file,
    date: date || null,
    createdAt: nowIso(),
  };
  await localDb.put("resultDocs", row);
  return row;
}

export async function updateResultDocDate(docId: string, date: string | null) {
  const localDb = await getDb();
  const doc = await localDb.get("resultDocs", docId);
  if (!doc) return;
  doc.date = date || null;
  await localDb.put("resultDocs", doc);
}

export async function deleteResultDoc(docId: string) {
  const localDb = await getDb();
  await localDb.delete("resultDocs", docId);
}

// Réglages du matériel valables pour toute une équipe (carte « Toute l'équipe »), propres à l'équipe :
// ils ne modifient pas ceux des gymnastes. Clé d'équipe « club::équipe ».
export async function getTeamEquipment(teamKey: string): Promise<EquipmentSettings> {
  const snap = await getDoc(docRef("teamEquipment", encodeURIComponent(teamKey)));
  return snap.exists() ? ((snap.data().reglages as EquipmentSettings) ?? {}) : {};
}

export async function setTeamEquipment(teamKey: string, patch: Partial<Record<keyof EquipmentSettings, string>>) {
  await setDoc(docRef("teamEquipment", encodeURIComponent(teamKey)), { reglages: patch }, { merge: true });
}
