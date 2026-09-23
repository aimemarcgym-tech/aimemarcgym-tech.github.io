import type { CheckSpec } from "./types";

/**
 * Association exigence/valorisation -> méthode de vérification automatique.
 *
 * Certaines règles du programme (LAE avec envol, "liés directement ou
 * indirectement", combinaisons nominatives comme "Sursaut + fente + roue")
 * ne sont pas déductibles de façon fiable à partir des seules données
 * actuellement numérisées (paliers/branches). Plutôt que de deviner, ces
 * exigences sont marquées MANUAL : l'application les affiche comme
 * "⚠ à confirmer" et laisse l'entraîneur cocher une confirmation explicite.
 *
 * Tout ce qui n'est pas listé ici est traité par défaut comme MANUAL.
 */
export const SOL_CHECKS: Record<string, CheckSpec> = {
  // --- Tronc commun ---
  "A1-TC-1": { type: "CATEGORY_COUNT", category: "MAINTIEN_SOUPLESSE", branch: "souplesse", min: 1 },
  "A1-TC-2": { type: "CATEGORY_COUNT", category: "ACRO", min: 2 },
  "A2-TC-1": { type: "CATEGORY_COUNT", category: "SAUT_GYM", min: 1 },
  "A2-TC-2": { type: "CATEGORY_COUNT", category: "ACRO", min: 2 },
  "B1-TC-1": { type: "LIAISON_ACRO", runMinLength: 2, runsNeeded: 1 },
  "B2-TC-1": { type: "LIAISON_ACRO", runMinLength: 2, runsNeeded: 2 },
  "B2-TC-2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4" },
  "B3-TC-1": { type: "FORCE_OR_PG" },
  "B3-TC-2": { type: "LIAISON_ACRO", runMinLength: 2, runsNeeded: 2 },
  "B3-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P5" },
  "C1-TC-1": { type: "FORCE_OR_PG" },
  "C1-TC-2": { type: "LIAISON_ACRO", runMinLength: 2, runsNeeded: 2 },
  "C1-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P6" },
  "C2-TC-1": { type: "FORCE_OR_PG" },
  "C2-TC-2": { type: "LIAISON_ACRO", runMinLength: 2, runsNeeded: 2 },
  "C2-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P5" },
  "C3-TC-1": { type: "FORCE_OR_PG" },
  "C3-TC-2": { type: "LIAISON_ACRO", runMinLength: 2, runsNeeded: 2 },
  "C3-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P7" },

  // --- Valorisations ---
  "A1-V1": { type: "NAME_CONTAINS_ALL", terms: ["atr", "fente"] },
  "A1-V2": { type: "CATEGORY_COUNT", category: "SAUT_GYM", min: 1 },
  "A1-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P2" },
  "A1-V4": { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" },

  "A2-V1": { type: "NAME_CONTAINS_ALL", terms: ["atr", "fente"] },
  "A2-V2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P2", category: "SAUT_GYM" },
  "A2-V4": { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" },

  "B1-V1": { type: "NAME_CONTAINS_ALL", terms: ["atr", "fente"] },
  "B1-V5": { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" },

  "B2-V4": { type: "SALTO_AT_PALIER_MIN", palierMin: "P4" },
  "B2-V5": { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" },

  "B3-V4": { type: "SALTO_AT_PALIER_MIN", palierMin: "P5" },
  "B3-V5": { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" },

  "C1-V1": { type: "SALTO_AT_PALIER_MIN", palierMin: "P1" }, // "position tendue" non vérifiable -> confirmer manuellement le "tendu"
  "C1-V5": { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" },

  "C2-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P6", category: "ACRO" },
  "C2-V5": { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" },

  "C3-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P7", category: "ACRO" },
  "C3-V5": { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" },
};

// Barres Asymétriques (GAF). Catégories d'arches : BALANCES, VENIR_APPUI,
// ELANS, ROTATIONS (voir src/regulation/data/barres/arches.json).
export const BARRES_ASYM_CHECKS: Record<string, CheckSpec> = {
  // --- Tronc commun ---
  "BA-A1-TC-2": { type: "CATEGORY_COUNT", category: "BALANCES", min: 1 },
  "BA-A2-TC-2": { type: "CATEGORY_COUNT", category: "BALANCES", min: 1 },
  "BA-B1-TC-1": { type: "CATEGORY_COUNT", category: "BALANCES", min: 1 },
  "BA-B1-TC-2": { type: "CATEGORY_COUNT", category: "VENIR_APPUI", min: 1 },
  "BA-B2-TC-2": { type: "CATEGORY_COUNT", category: "ELANS", min: 1 },
  "BA-B2-TC-3": { type: "CATEGORY_COUNT", category: "VENIR_APPUI", min: 1 },
  "BA-B3-TC-2": { type: "CATEGORY_COUNT", category: "BALANCES", min: 1 },
  "BA-B3-TC-3": { type: "CATEGORY_COUNT", category: "VENIR_APPUI", min: 1 },
  "BA-C1-TC-2": { type: "CATEGORY_COUNT", category: "ELANS", min: 1 },
  "BA-C1-TC-3": { type: "CATEGORY_COUNT", category: "BALANCES", min: 1 },
  "BA-C2-TC-2": { type: "CATEGORY_COUNT", category: "BALANCES", min: 1 },
  "BA-C2-TC-3": { type: "NAME_CONTAINS_ALL", terms: ["atr"], min: 1 },
  "BA-C3-TC-2": { type: "CATEGORY_COUNT", category: "BALANCES", min: 1 },
  "BA-C3-TC-3": { type: "NAME_CONTAINS_ALL", terms: ["atr"], min: 2 },

  // --- Valorisations ---
  "BA-B1-V2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P2" },
  // BA-B1-V5 "1 sortie amenée du balancé arrière" : condition d'enchaînement
  // non vérifiable automatiquement -> confirmation manuelle.

  "BA-B2-V2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3" },
  "BA-B2-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", category: "ROTATIONS" },
  "BA-B2-V5": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", category: "SORTIES" },

  "BA-B3-V2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", min: 2 },
  "BA-B3-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", category: "ROTATIONS" },
  "BA-B3-V5": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "SORTIES" },

  "BA-C1-V1": { type: "NAME_CONTAINS_ALL", terms: ["lâch"] },
  "BA-C1-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4" },
  "BA-C1-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "ROTATIONS" },
  // BA-C1-V6 "1 sortie P4 (min.) amené du balancé" : condition d'enchaînement
  // (amené du balancé) non vérifiable automatiquement -> confirmation manuelle.

  "BA-C2-V1": { type: "NAME_CONTAINS_ALL", terms: ["lâch"] },
  "BA-C2-V2": { type: "NAME_CONTAINS_ALL", terms: ["grand tour"] },
  "BA-C2-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P5" },
  "BA-C2-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "ROTATIONS" },
  "BA-C2-V6": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P5", category: "SORTIES" },

  "BA-C3-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P5" },
  "BA-C3-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P6", category: "ROTATIONS" },
  // BA-C3-V6 "1 sortie P5 (min.) amené d'un élément P5 (min.)" : condition
  // d'enchaînement non vérifiable automatiquement -> confirmation manuelle.
};

// Poutre (GAF). Catégories d'arches : ATR_MAINTIEN, PIVOT, ACRO, SAUT_GYM,
// ENTREE, SORTIES (voir src/regulation/data/poutre/arches.json). Les 2 arches de
// sauts (appel 1 pied / 2 pieds) partagent la catégorie SAUT_GYM : les
// exigences qui distinguent précisément l'appel ne sont donc pas
// vérifiables automatiquement (confirmation manuelle) tant que le système
// de vérification ne sait pas filtrer par archeId.
export const POUTRE_CHECKS: Record<string, CheckSpec> = {
  // --- Tronc commun ---
  "P-A1-TC-1": { type: "CATEGORY_COUNT", category: "ACRO", min: 1 },
  "P-A1-TC-2": { type: "CATEGORY_COUNT", category: "SAUT_GYM", min: 2 },
  "P-A2-TC-1": { type: "CATEGORY_COUNT", category: "ACRO", min: 1 },
  "P-A2-TC-2": { type: "CATEGORY_COUNT", category: "SAUT_GYM", min: 2 },
  "P-B1-TC-1": { type: "CATEGORY_COUNT", category: "ACRO", min: 2 },
  "P-B1-TC-2": { type: "CATEGORY_COUNT", category: "SAUT_GYM", min: 2 },
  "P-B1-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P2", category: "ACRO" },
  "P-B2-TC-1": { type: "CATEGORY_COUNT", category: "ACRO", min: 2 },
  "P-B2-TC-2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "PIVOT" },
  "P-B2-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3" },
  "P-B2-TC-4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", category: "ACRO" },
  "P-B3-TC-1": { type: "CATEGORY_COUNT", category: "ACRO", min: 3 },
  "P-B3-TC-2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "PIVOT" },
  "P-B3-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4" },
  "P-B3-TC-4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "ACRO" },
  "P-C1-TC-1": { type: "CATEGORY_COUNT", category: "ACRO", min: 3 },
  "P-C1-TC-2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "PIVOT" },
  "P-C1-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P5" },
  "P-C2-TC-1": { type: "CATEGORY_COUNT", category: "ACRO", min: 3 },
  "P-C2-TC-2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "PIVOT" },
  "P-C2-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P6" },
  "P-C3-TC-1": { type: "CATEGORY_COUNT", category: "ACRO", min: 3 },
  "P-C3-TC-2": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "PIVOT" },
  "P-C3-TC-3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P7" },
  // P-A1-TC-3 "1 ATR (PR)", P-A2-TC-3 "Roue", P-C1/C2/C3-TC-4 "1 LA ..." :
  // exigences "poutre mousse" (catégorie ACRO, arche Accro poutre mousse)
  // non vérifiables précisément avec le système de vérification actuel
  // (palier PR / élément nominatif / liaison chaînée) -> confirmation
  // manuelle. Pour B1/B2/B3, la vérification par catégorie ACRO ci-dessus
  // ne distingue pas l'arche Accro poutre mousse des autres arches ACRO
  // (Acros 1/2) faute de filtrage par archeId dans le système actuel.

  // --- Valorisations ---
  "P-A1-V1": { type: "CATEGORY_COUNT", category: "PIVOT", min: 1 },
  // P-A1-V2 "1 cabriole", P-A1-V3 "ATR 1 jambe ou placement du dos" (2
  // options) : non vérifiables précisément -> confirmation manuelle.

  // P-A2-V1/V2 (demi pivot précis / saut appel 2 pieds précis) et P-A2-V3
  // (ATR spécifiquement branche "atr" à P2) : non distinguables avec le
  // système de vérification actuel -> confirmation manuelle.

  "P-B1-V1": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", category: "PIVOT" },
  "P-B1-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P2", category: "ACRO" },
  "P-B1-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", category: "SORTIES" },
  // P-B1-V2 "1 saut P3 (min.)" : catégorie SAUT_GYM commune aux 2 arches de
  // sauts, palier P3 pas atteint dans les données actuelles -> manuel.

  "P-B2-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", category: "ACRO" },
  "P-B2-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P3", category: "SORTIES" },

  "P-B3-V3": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "ACRO" },
  "P-B3-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P4", category: "SORTIES" },

  "P-C1-V4": { type: "ELEMENT_AT_PALIER_MIN", palierMin: "P5", category: "ACRO" },
  // P-C1-V5/P-C2-V5/P-C3-V5 "1 sortie avec liaison acro..." : condition de
  // liaison acrobatique (chaînage de plusieurs éléments avec envol) non
  // vérifiable automatiquement -> confirmation manuelle.
};

const CHECKS_BY_APPARATUS: Record<string, Record<string, CheckSpec>> = {
  SOL: SOL_CHECKS,
  BARRES_ASYM: BARRES_ASYM_CHECKS,
  POUTRE: POUTRE_CHECKS,
};

export function getCheck(id: string, apparatus: string = "SOL"): CheckSpec {
  return CHECKS_BY_APPARATUS[apparatus]?.[id] ?? { type: "MANUAL" };
}
