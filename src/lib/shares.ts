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
  elements: { code: string; name: string; palier: string; branch: string | null }[];
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

export type ShareDoc =
  | { type: "movement"; ownerUid: string; data: MovementShareData }
  | { type: "passageOrder"; ownerUid: string; data: PassageOrderShareData }
  | { type: "passageOrderAll"; ownerUid: string; data: PassageOrderAllShareData };

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
  type: "movement" | "passageOrder" | "passageOrderAll",
  data: MovementShareData | PassageOrderShareData | PassageOrderAllShareData
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
