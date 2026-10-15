import { EXEMPLES_SOL } from "@/lib/exemples-sol";
import { EXEMPLES_SAUT } from "@/lib/exemples-saut";

// Mouvements d'exemple, un par agrès et par niveau, construits pour viser la note de départ maximale.
// Chaque exemple pointe vers des codes d'éléments du référentiel (src/regulation/data/*) ; le moteur calcule
// la note et les validations, rien d'autre n'est stocké ici. Pour l'instant la liste est vide (architecture).

export interface ExempleMouvement {
  apparatus: string; // SOL | BARRES_ASYM | POUTRE | SAUT
  evolutionId: string; // A1 … C3
  titre: string;
  // Éléments dans l'ordre du mouvement (code du référentiel ; série facultative pour Sol et Poutre).
  elements: { code: string; serie?: "MIXTE" | "GYMNIQUE" | "ACRO" }[];
  // Exigences du tronc commun et valorisations confirmées à la main (identifiants de decomposition.json).
  confirmations: string[];
  // Pour chaque exigence ou valorisation (identifiant de decomposition.json) : les codes des éléments qui la valident.
  validations: Record<string, string[]>;
  // Remarques à l'attention de l'entraîneur (points à confirmer, enchaînements attendus…).
  remarques?: string[];
}

export const EXEMPLES: ExempleMouvement[] = [...EXEMPLES_SOL, ...EXEMPLES_SAUT];

// Tous les exemples d'un agrès et d'un niveau (le Saut en propose plusieurs par niveau).
export function getExemples(apparatus: string, evolutionId: string): ExempleMouvement[] {
  return EXEMPLES.filter((e) => e.apparatus === apparatus && e.evolutionId === evolutionId);
}

// Chronologie habituelle d'un mouvement, à respecter dans les exemples (consignes de l'entraîneur).
export const CHRONOLOGIE: Record<string, string[]> = {
  SOL: [
    "On alterne les lignes d'acros et les pivots / sauts : par exemple un pivot, une ligne acro, une série de sauts, une autre ligne acro, etc.",
  ],
  BARRES_ASYM: [
    "Les éléments de l'arche Venir à l'appui sont souvent des entrées.",
    "On commence généralement sur la barre inférieure, puis on passe à la barre supérieure.",
    "La sortie vient en dernier.",
  ],
  POUTRE: [
    "On commence par l'entrée.",
    "On alterne ensuite pivots, acros et sauts, ou séries gymniques, séries mixtes et séries acro.",
    "La sortie vient en dernier.",
  ],
  SAUT: [],
};
