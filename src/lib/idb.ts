import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// Stockage 100% local (IndexedDB) — remplace le serveur Prisma/SQLite pour
// que l'appli fonctionne hors-ligne, sur n'importe quel appareil, sans
// synchronisation entre appareils (voir /sauvegarde pour l'export/import
// manuel).

export interface ClubRow {
  id: string;
  name: string;
  createdAt: string;
}

export interface GymnastRow {
  id: string;
  firstName: string;
  lastName: string;
  clubId: string | null;
  team: string | null;
  birthYear: number | null;
  createdAt: string;
  // Ordre d'affichage dans l'onglet Musiques (glisser-déposer). Absent
  // (undefined) pour les gymnastes créées avant cette fonctionnalité ->
  // on retombe alors sur l'ordre alphabétique habituel.
  musicOrder?: number | null;
  // Ordre de passage à chaque agrès (clé = code agrès : SOL, BARRES_ASYM,
  // POUTRE, SAUT), réglé par glisser-déposer dans l'onglet Musiques >
  // Ordres de passage. Indépendant par agrès.
  passageOrder?: Record<string, number> | null;
}

export interface GymnastSkillRow {
  id: string;
  gymnastId: string;
  elementCode: string;
  status: string;
  updatedAt: string;
}

export interface MovementRow {
  id: string;
  label: string;
  gymnastId: string;
  apparatus: string;
  evolution: string;
  regulationVer: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovementElementRow {
  id: string;
  movementId: string;
  elementCode: string;
  position: number;
  role: string;
}

export interface MovementSnapshotRow {
  id: string;
  movementId: string;
  createdAt: string;
  elementCodes: string;
  noteDepart: number;
  detailJson: string;
}

export interface GymnastMusicRow {
  id: string;
  gymnastId: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
  updatedAt: string;
}

interface AppDB extends DBSchema {
  clubs: { key: string; value: ClubRow };
  gymnasts: { key: string; value: GymnastRow; indexes: { clubId: string } };
  gymnastSkills: {
    key: string;
    value: GymnastSkillRow;
    indexes: { gymnastId: string; gymnastId_elementCode: [string, string] };
  };
  movements: { key: string; value: MovementRow; indexes: { gymnastId: string } };
  movementElements: { key: string; value: MovementElementRow; indexes: { movementId: string } };
  movementSnapshots: { key: string; value: MovementSnapshotRow; indexes: { movementId: string } };
  gymnastMusic: { key: string; value: GymnastMusicRow; indexes: { gymnastId: string } };
}

const DB_NAME = "ufolep-gaf";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<AppDB>> {
  if (typeof window === "undefined") {
    throw new Error("getDb() ne peut être appelé que côté navigateur.");
  }
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("clubs")) {
          db.createObjectStore("clubs", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("gymnasts")) {
          const gymnasts = db.createObjectStore("gymnasts", { keyPath: "id" });
          gymnasts.createIndex("clubId", "clubId");
        }

        if (!db.objectStoreNames.contains("gymnastSkills")) {
          const skills = db.createObjectStore("gymnastSkills", { keyPath: "id" });
          skills.createIndex("gymnastId", "gymnastId");
          skills.createIndex("gymnastId_elementCode", ["gymnastId", "elementCode"], { unique: true });
        }

        if (!db.objectStoreNames.contains("movements")) {
          const movements = db.createObjectStore("movements", { keyPath: "id" });
          movements.createIndex("gymnastId", "gymnastId");
        }

        if (!db.objectStoreNames.contains("movementElements")) {
          const elements = db.createObjectStore("movementElements", { keyPath: "id" });
          elements.createIndex("movementId", "movementId");
        }

        if (!db.objectStoreNames.contains("movementSnapshots")) {
          const snapshots = db.createObjectStore("movementSnapshots", { keyPath: "id" });
          snapshots.createIndex("movementId", "movementId");
        }

        if (!db.objectStoreNames.contains("gymnastMusic")) {
          const music = db.createObjectStore("gymnastMusic", { keyPath: "id" });
          music.createIndex("gymnastId", "gymnastId");
        }
      },
    });
  }
  return dbPromise;
}

export type { AppDB };
