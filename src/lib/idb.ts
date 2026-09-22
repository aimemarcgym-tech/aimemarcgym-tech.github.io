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
}

const DB_NAME = "ufolep-gaf";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<AppDB>> {
  if (typeof window === "undefined") {
    throw new Error("getDb() ne peut être appelé que côté navigateur.");
  }
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("clubs", { keyPath: "id" });

        const gymnasts = db.createObjectStore("gymnasts", { keyPath: "id" });
        gymnasts.createIndex("clubId", "clubId");

        const skills = db.createObjectStore("gymnastSkills", { keyPath: "id" });
        skills.createIndex("gymnastId", "gymnastId");
        skills.createIndex("gymnastId_elementCode", ["gymnastId", "elementCode"], { unique: true });

        const movements = db.createObjectStore("movements", { keyPath: "id" });
        movements.createIndex("gymnastId", "gymnastId");

        const elements = db.createObjectStore("movementElements", { keyPath: "id" });
        elements.createIndex("movementId", "movementId");

        const snapshots = db.createObjectStore("movementSnapshots", { keyPath: "id" });
        snapshots.createIndex("movementId", "movementId");
      },
    });
  }
  return dbPromise;
}

export type { AppDB };
