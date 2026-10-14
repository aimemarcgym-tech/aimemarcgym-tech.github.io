// Mouvements d'exemple, un par agrès et par niveau, construits pour viser la note de départ maximale.
// Pour l'instant : l'architecture seulement (la liste est vide). Chaque exemple pointera vers des codes
// d'éléments du référentiel (src/regulation/data/*) ; le moteur calcule la note, rien n'est stocké ici.

export interface ExempleMouvement {
  apparatus: string; // SOL | BARRES_ASYM | POUTRE | SAUT
  evolutionId: string; // A1 … C3
  titre: string;
  // Éléments dans l'ordre du mouvement (code du référentiel ; série facultative pour Sol et Poutre).
  elements: { code: string; serie?: "MIXTE" | "GYMNIQUE" | "ACRO" }[];
  // Valorisations que l'entraîneur confirmerait à la main (identifiants de decomposition.json).
  valorisationsConfirmees: string[];
  // Remarques à l'attention de l'entraîneur (points à confirmer, enchaînements attendus…).
  remarques?: string[];
}

export const EXEMPLES: ExempleMouvement[] = [];

export function getExemple(apparatus: string, evolutionId: string): ExempleMouvement | undefined {
  return EXEMPLES.find((e) => e.apparatus === apparatus && e.evolutionId === evolutionId);
}
