import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, getCurrentUid } from "@/lib/firebase";
import type { Diagnostic } from "@/engine/composition";
import type { SautDiagnostic } from "@/engine/saut";

// Partage par lien public : contrairement aux musiques/photos/vidéos (restées
// locales, partagées via le partage natif de l'appareil), un mouvement ou un
// ordre de passage vit dans Firestore sous users/{uid}/... — pour le rendre
// consultable sans compte, on écrit une COPIE FIGÉE (instantané) dans une
// collection publique séparée `shares/`, jamais une référence live vers les
// données privées du coach. Chaque clic sur "Partager" crée un nouveau lien
// (pas de mise à jour/révocation en v1) : un lien reste valide même si le
// mouvement change ensuite, puisque c'est un instantané au moment du partage.

export interface MovementShareData {
  gymnastFirstName: string;
  gymnastLastName: string;
  label: string;
  apparatus: string;
  evolutionId: string;
  elements: { code: string; name: string; palier: string; branch: string | null; archeName?: string }[];
  diagnostic: Diagnostic | SautDiagnostic;
  // Optionnels : absents des liens créés avant l'affichage "comme le constructeur".
  requirements?: { arches: number; elementsMin: number; elementsMax: number };
  penaliteMateriel?: number;
  // Instantanés enregistrés dans l'historique du mouvement (lecture seule dans le lien).
  snapshots?: SnapshotShareData[];
}

// Une version enregistrée du mouvement : de quoi l'afficher comme le mouvement actuel.
export interface SnapshotShareData {
  name?: string;
  createdAt: string;
  noteDepart: number;
  elements: MovementShareData["elements"];
  diagnostic: Diagnostic | SautDiagnostic;
}

export interface PassageOrderShareData {
  club: string;
  team: string;
  apparatus: string;
  apparatusLabel: string;
  gymnasts: { firstName: string; lastName: string }[];
}

// Un seul lien pour les 4 agrès à la fois (une fois que le coach a fini de
// régler l'ordre de passage partout) : même structure que PassageOrderShareData,
// répétée par agrès plutôt que d'obliger à partager 4 liens séparés.
export interface PassageOrderAllShareData {
  club: string;
  team: string;
  apparatuses: {
    apparatus: string;
    apparatusLabel: string;
    gymnasts: { firstName: string; lastName: string }[];
  }[];
}

// Pièce jointe encodée directement dans le document Firestore (pas de vrai
// stockage de fichiers type Firebase Storage) : ça reste gratuit et simple,
// mais limite la taille à un petit document (voir MAX_ATTACHMENT_BYTES dans
// TrainingJournal.tsx) à cause de la limite Firestore de 1 Mo par document.
export interface ShareAttachment {
  fileName: string;
  mimeType: string;
  dataBase64: string;
}

// Journal d'entraînement (Programme technique/physique) : instantané des
// séances au moment du partage, pour une gymnaste ou pour toute une équipe.
export interface TrainingJournalShareData {
  targetLabel: string;
  programType: "TECHNIQUE" | "PHYSIQUE";
  sessions: { date: string; content: string }[];
  attachment?: ShareAttachment;
}

export interface MovementsAllShareData {
  gymnastFirstName: string;
  gymnastLastName: string;
  movements: MovementShareData[];
}

// Panneau "Vérifier une équipe" (catégories d'âge) tel qu'affiché au moment du partage.
export interface TeamCategoryShareData {
  club: string;
  team: string;
  members: { firstName: string; lastName: string; birthYear: number | null }[];
  evolutions: {
    evolution: string;
    categories: { ans: string; annees: string; filiere: string }[];
  }[];
}

// Tout ce qui concerne une équipe en un seul lien : ordres de passage et mouvements de chaque gymnaste.
export interface TeamAllShareData {
  club: string;
  team: string;
  passageOrder: PassageOrderAllShareData;
  gymnasts: MovementsAllShareData[];
}

export type ShareDoc =
  | { type: "movement"; ownerUid: string; data: MovementShareData }
  | { type: "passageOrder"; ownerUid: string; data: PassageOrderShareData }
  | { type: "passageOrderAll"; ownerUid: string; data: PassageOrderAllShareData }
  | { type: "trainingJournal"; ownerUid: string; data: TrainingJournalShareData }
  | { type: "movementsAll"; ownerUid: string; data: MovementsAllShareData }
  | { type: "teamCategory"; ownerUid: string; data: TeamCategoryShareData }
  | { type: "teamAll"; ownerUid: string; data: TeamAllShareData };

export async function createShare(
  type: "movement",
  data: MovementShareData
): Promise<string>;
export async function createShare(
  type: "passageOrder",
  data: PassageOrderShareData
): Promise<string>;
export async function createShare(
  type: "passageOrderAll",
  data: PassageOrderAllShareData
): Promise<string>;
export async function createShare(
  type: "trainingJournal",
  data: TrainingJournalShareData
): Promise<string>;
export async function createShare(
  type: "movementsAll",
  data: MovementsAllShareData
): Promise<string>;
export async function createShare(
  type: "teamCategory",
  data: TeamCategoryShareData
): Promise<string>;
export async function createShare(
  type: "teamAll",
  data: TeamAllShareData
): Promise<string>;
export async function createShare(
  type: "movement" | "passageOrder" | "passageOrderAll" | "trainingJournal" | "movementsAll" | "teamCategory" | "teamAll",
  data:
    | MovementShareData
    | PassageOrderShareData
    | PassageOrderAllShareData
    | TrainingJournalShareData
    | MovementsAllShareData
    | TeamCategoryShareData
    | TeamAllShareData
): Promise<string> {
  const ref = doc(collection(db, "shares"));
  await setDoc(ref, {
    type,
    ownerUid: getCurrentUid(),
    data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Lecture publique : pas de getCurrentUid() ici, le visiteur d'un lien de
// partage n'est jamais connecté.
export async function getShare(shareId: string): Promise<ShareDoc | null> {
  const snap = await getDoc(doc(db, "shares", shareId));
  if (!snap.exists()) return null;
  return snap.data() as ShareDoc;
}
