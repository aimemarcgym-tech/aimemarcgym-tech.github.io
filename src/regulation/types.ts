// Types du modèle réglementaire UFOLEP (issus des documents officiels du
// Nouveau Programme Technique). Ce fichier ne code aucune règle métier :
// il ne fait que typer les données JSON versionnées dans /data.

export type Apparatus = "SOL" | "POUTRE" | "BARRES_ASYM" | "SAUT";

export type Palier =
  | "PREREQUIS"
  | "BASE"
  | "P1"
  | "P2"
  | "P3"
  | "P4"
  | "P5"
  | "P6"
  | "P7"
  | "NOMADE";

// Ordre de progression technique (du plus facile au plus difficile).
// PREREQUIS et NOMADE ne comptent pas dans l'ordre de palier (traités à part).
export const PALIER_ORDER: Palier[] = ["BASE", "P1", "P2", "P3", "P4", "P5", "P6", "P7"];

export function palierRank(p: Palier): number {
  const idx = PALIER_ORDER.indexOf(p);
  return idx === -1 ? -1 : idx; // PREREQUIS/NOMADE -> -1 (hors classement)
}

export interface Arche {
  id: string;
  name: string;
  subtitle: string | null;
  category: string; // ACRO | FORCE | CERCLES | MAINTIEN_SOUPLESSE | PIVOT | SAUT_GYM ...
  sourcePage: number;
  baseElement: { code: string; name: string } | null;
  branches: string[];
  dataQuality?: "a_verifier";
}

export interface RegElement {
  code: string;
  name: string;
  archeId: string;
  branch: string | null;
  palier: Palier;
  rotationDeg?: number;
  sourcePage: number;
  verified: boolean;
}

export interface TroncCommunExigence {
  id: string;
  label: string;
}

export interface ValorisationOption {
  id: string;
  label: string;
  pondere: boolean;
  points: number;
}

export interface Evolution {
  id: string; // A1, A2, B1...
  genre: "GAF" | "GAM" | "GAF/GAM";
  ordre: number;
  troncCommun: {
    arches: number;
    elementsMin: number;
    elementsMax: number;
    exigences: TroncCommunExigence[];
  };
  paliersAutorises: Palier[];
  paliersValorisables: Palier[];
  valorisations: {
    choisir: number;
    parmi: number;
    options: ValorisationOption[];
  };
}

export interface ApparatusRegulation {
  apparatus: Apparatus;
  arches: Arche[];
  elements: RegElement[];
  evolutions: Evolution[];
}

// Type de vérification automatique applicable à une exigence / valorisation.
export type CheckSpec =
  | { type: "CATEGORY_COUNT"; category: string; min: number; branch?: string }
  | { type: "ELEMENT_AT_PALIER_MIN"; palierMin: Palier; category?: string; min?: number }
  | { type: "SALTO_AT_PALIER_MIN"; palierMin: Palier }
  | { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" }
  | { type: "LIAISON_ACRO"; runMinLength: number; runsNeeded: number }
  | { type: "FORCE_OR_PG" }
  | { type: "NAME_CONTAINS_ALL"; terms: string[]; min?: number }
  | { type: "MANUAL" }; // ne peut pas être vérifié automatiquement -> confirmation entraîneur
