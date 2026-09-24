import { getDb, type ClubRow, type GymnastRow, type MovementRow } from "@/lib/idb";
import type { PhotoAlbumRow, PhotoRow } from "@/lib/idb";
import { REGULATION_VERSION } from "@/regulation/loader";

// Couche de données 100% locale (remplace les Server Actions + Prisma de
// l'ancienne version serveur). Mêmes noms/signatures que l'ancien
// src/app/actions.ts pour que les composants appelants n'aient qu'à changer
// leur import.

function nowIso() {
  return new Date().toISOString();
}

async function findOrCreateClub(clubName: string): Promise<string | undefined> {
  if (!clubName) return undefined;
  const db = await getDb();
  const all = await db.getAll("clubs");
  const existing = all.find((c) => c.name === clubName);
  if (existing) return existing.id;
  const club: ClubRow = { id: crypto.randomUUID(), name: clubName, createdAt: nowIso() };
  await db.put("clubs", club);
  return club.id;
}

export async function createGymnast(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthYearRaw = String(formData.get("birthYear") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();
  if (!firstName || !lastName) throw new Error("Nom et prénom requis");

  const clubId = await findOrCreateClub(String(formData.get("clubName") ?? "").trim());

  const db = await getDb();
  const gymnast: GymnastRow = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    clubId: clubId ?? null,
    team: team || null,
    birthYear: birthYearRaw ? Number(birthYearRaw) : null,
    createdAt: nowIso(),
  };
  await db.put("gymnasts", gymnast);
  return gymnast;
}

export async function getGymnasts() {
  const db = await getDb();
  const [gymnasts, clubs, movements] = await Promise.all([
    db.getAll("gymnasts"),
    db.getAll("clubs"),
    db.getAll("movements"),
  ]);
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

export async function updateGymnastTeam(gymnastId: string, team: string) {
  const db = await getDb();
  const gymnast = await db.get("gymnasts", gymnastId);
  if (!gymnast) return;
  gymnast.team = team.trim() || null;
  await db.put("gymnasts", gymnast);
}

export async function updateGymnast(
  gymnastId: string,
  data: { firstName: string; lastName: string; clubName: string; birthYear: string }
) {
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  if (!firstName || !lastName) throw new Error("Nom et prénom requis");

  const clubName = data.clubName.trim();
  const clubId = await findOrCreateClub(clubName);

  const db = await getDb();
  const gymnast = await db.get("gymnasts", gymnastId);
  if (!gymnast) return;
  gymnast.firstName = firstName;
  gymnast.lastName = lastName;
  gymnast.clubId = clubId ?? null;
  gymnast.birthYear = data.birthYear.trim() ? Number(data.birthYear) : null;
  await db.put("gymnasts", gymnast);
}

export async function deleteGymnast(gymnastId: string) {
  const db = await getDb();
  const [skills, movements, music] = await Promise.all([
    db.getAllFromIndex("gymnastSkills", "gymnastId", gymnastId),
    db.getAllFromIndex("movements", "gymnastId", gymnastId),
    db.getAllFromIndex("gymnastMusic", "gymnastId", gymnastId),
  ]);
  for (const m of movements) {
    await deleteMovementCascade(m.id);
  }
  const tx = db.transaction(["gymnasts", "gymnastSkills", "gymnastMusic"], "readwrite");
  await Promise.all([
    tx.objectStore("gymnasts").delete(gymnastId),
    ...skills.map((s) => tx.objectStore("gymnastSkills").delete(s.id)),
    ...music.map((m) => tx.objectStore("gymnastMusic").delete(m.id)),
    tx.done,
  ]);
}

export async function getGymnast(id: string) {
  const db = await getDb();
  const gymnast = await db.get("gymnasts", id);
  if (!gymnast) return null;
  const [club, skills, movements] = await Promise.all([
    gymnast.clubId ? db.get("clubs", gymnast.clubId) : Promise.resolve(undefined),
    db.getAllFromIndex("gymnastSkills", "gymnastId", id),
    db.getAllFromIndex("movements", "gymnastId", id),
  ]);
  movements.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { ...gymnast, club: club ?? null, skills, movements };
}

export async function setSkillStatus(gymnastId: string, elementCode: string, status: string) {
  const db = await getDb();
  const existing = await db.getFromIndex("gymnastSkills", "gymnastId_elementCode", [gymnastId, elementCode]);
  await db.put("gymnastSkills", {
    id: existing?.id ?? crypto.randomUUID(),
    gymnastId,
    elementCode,
    status,
    updatedAt: nowIso(),
  });
}

export async function createMovement(gymnastId: string, apparatus: string, evolution: string, label: string) {
  const db = await getDb();
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
  await db.put("movements", movement);
  return movement;
}

export async function getMovement(id: string) {
  const db = await getDb();
  const movement = await db.get("movements", id);
  if (!movement) return null;
  const [elements, gymnast] = await Promise.all([
    db.getAllFromIndex("movementElements", "movementId", id),
    db.get("gymnasts", movement.gymnastId),
  ]);
  elements.sort((a, b) => a.position - b.position);
  const skills = gymnast ? await db.getAllFromIndex("gymnastSkills", "gymnastId", gymnast.id) : [];
  return {
    ...movement,
    elements,
    gymnast: gymnast ? { ...gymnast, skills } : null,
  };
}

export async function saveMovementElements(movementId: string, elements: { code: string; role: string }[]) {
  const db = await getDb();
  const existing = await db.getAllFromIndex("movementElements", "movementId", movementId);
  const movement = await db.get("movements", movementId);
  const tx = db.transaction(["movements", "movementElements"], "readwrite");
  const store = tx.objectStore("movementElements");
  await Promise.all(existing.map((e) => store.delete(e.id)));
  await Promise.all(
    elements.map((e, i) =>
      store.put({
        id: crypto.randomUUID(),
        movementId,
        elementCode: e.code,
        role: e.role,
        position: i,
      })
    )
  );
  if (movement) {
    movement.updatedAt = nowIso();
    await tx.objectStore("movements").put(movement);
  }
  await tx.done;
}

export async function saveSnapshot(movementId: string, elementCodes: string[], noteDepart: number, detail: unknown) {
  const db = await getDb();
  await db.put("movementSnapshots", {
    id: crypto.randomUUID(),
    movementId,
    createdAt: nowIso(),
    elementCodes: JSON.stringify(elementCodes),
    noteDepart,
    detailJson: JSON.stringify(detail),
  });
}

export async function getSnapshots(movementId: string) {
  const db = await getDb();
  const snapshots = await db.getAllFromIndex("movementSnapshots", "movementId", movementId);
  snapshots.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return snapshots;
}

async function deleteMovementCascade(movementId: string) {
  const db = await getDb();
  const [elements, snapshots] = await Promise.all([
    db.getAllFromIndex("movementElements", "movementId", movementId),
    db.getAllFromIndex("movementSnapshots", "movementId", movementId),
  ]);
  const tx = db.transaction(["movements", "movementElements", "movementSnapshots"], "readwrite");
  await Promise.all([
    tx.objectStore("movements").delete(movementId),
    ...elements.map((e) => tx.objectStore("movementElements").delete(e.id)),
    ...snapshots.map((s) => tx.objectStore("movementSnapshots").delete(s.id)),
    tx.done,
  ]);
}

export async function deleteMovement(movementId: string) {
  await deleteMovementCascade(movementId);
}

export async function getGymnastMusic(gymnastId: string) {
  const db = await getDb();
  return db.getFromIndex("gymnastMusic", "gymnastId", gymnastId);
}

export async function saveGymnastMusic(gymnastId: string, file: File) {
  const db = await getDb();
  const existing = await db.getFromIndex("gymnastMusic", "gymnastId", gymnastId);
  const row = {
    id: existing?.id ?? crypto.randomUUID(),
    gymnastId,
    fileName: file.name,
    mimeType: file.type || "audio/mpeg",
    size: file.size,
    blob: file,
    updatedAt: nowIso(),
  };
  await db.put("gymnastMusic", row);
  return row;
}

export async function deleteGymnastMusic(gymnastId: string) {
  const db = await getDb();
  const existing = await db.getFromIndex("gymnastMusic", "gymnastId", gymnastId);
  if (existing) await db.delete("gymnastMusic", existing.id);
}

export async function setGymnastsMusicOrder(orderedGymnastIds: string[]) {
  const db = await getDb();
  const tx = db.transaction("gymnasts", "readwrite");
  const store = tx.objectStore("gymnasts");
  await Promise.all(
    orderedGymnastIds.map(async (id, index) => {
      const gymnast = await store.get(id);
      if (!gymnast) return;
      gymnast.musicOrder = index;
      await store.put(gymnast);
    })
  );
  await tx.done;
}

export async function setGymnastsPassageOrder(apparatus: string, orderedGymnastIds: string[]) {
  const db = await getDb();
  const tx = db.transaction("gymnasts", "readwrite");
  const store = tx.objectStore("gymnasts");
  await Promise.all(
    orderedGymnastIds.map(async (id, index) => {
      const gymnast = await store.get(id);
      if (!gymnast) return;
      gymnast.passageOrder = { ...(gymnast.passageOrder ?? {}), [apparatus]: index };
      await store.put(gymnast);
    })
  );
  await tx.done;
}

export async function getPhotoAlbums() {
  const db = await getDb();
  const albums = await db.getAll("photoAlbums");
  albums.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return albums;
}

export async function createPhotoAlbum(name: string, date: string, team: string): Promise<PhotoAlbumRow> {
  const db = await getDb();
  const album: PhotoAlbumRow = {
    id: crypto.randomUUID(),
    name: name.trim(),
    date: date.trim() || null,
    team: team.trim() || null,
    createdAt: nowIso(),
  };
  await db.put("photoAlbums", album);
  return album;
}

export async function deletePhotoAlbum(albumId: string) {
  const db = await getDb();
  const photos = await db.getAllFromIndex("photos", "albumId", albumId);
  const tx = db.transaction(["photoAlbums", "photos"], "readwrite");
  await Promise.all([
    tx.objectStore("photoAlbums").delete(albumId),
    ...photos.map((p) => tx.objectStore("photos").delete(p.id)),
    tx.done,
  ]);
}

export async function getPhotosByAlbum(albumId: string) {
  const db = await getDb();
  const photos = await db.getAllFromIndex("photos", "albumId", albumId);
  photos.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return photos;
}

export async function addPhoto(albumId: string, file: File): Promise<PhotoRow> {
  const db = await getDb();
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
  await db.put("photos", photo);
  return photo;
}

export async function setPhotoTags(photoId: string, tags: string[]) {
  const db = await getDb();
  const photo = await db.get("photos", photoId);
  if (!photo) return;
  photo.tags = tags;
  await db.put("photos", photo);
}

export async function deletePhoto(photoId: string) {
  const db = await getDb();
  await db.delete("photos", photoId);
}
