import solArchesJson from "./data/sol/arches.json";
import solElementsJson from "./data/sol/elements.json";
import solDecompositionJson from "./data/sol/decomposition.json";
import solReferenceJson from "./data/sol/reference.json";
import barresArchesJson from "./data/barres/arches.json";
import barresElementsJson from "./data/barres/elements.json";
import barresDecompositionJson from "./data/barres/decomposition.json";
import barresReferenceJson from "./data/barres/reference.json";
import generalitesJson from "./data/generalites.json";
import type { Arche, ApparatusRegulation, Evolution, RegElement } from "./types";

// Version des données réglementaires chargées (affichée dans l'UI pour traçabilité).
export const REGULATION_VERSION =
  "UFOLEP NPT — Sol & Barres asym. SEPT.26 / Décomposition note 11 sept 2026";

const solRegulation: ApparatusRegulation = {
  apparatus: "SOL",
  arches: solArchesJson.arches as Arche[],
  elements: solElementsJson.elements as RegElement[],
  evolutions: solDecompositionJson.evolutions as Evolution[],
};

const barresRegulation: ApparatusRegulation = {
  apparatus: "BARRES_ASYM",
  arches: barresArchesJson.arches as Arche[],
  elements: barresElementsJson.elements as RegElement[],
  evolutions: barresDecompositionJson.evolutions as Evolution[],
};

const REGULATIONS: Partial<Record<string, ApparatusRegulation>> = {
  SOL: solRegulation,
  BARRES_ASYM: barresRegulation,
};

const REFERENCES: Partial<Record<string, typeof solReferenceJson>> = {
  SOL: solReferenceJson,
  BARRES_ASYM: barresReferenceJson,
};

export function getReference(apparatus: string) {
  return REFERENCES[apparatus];
}

export function getGeneralites() {
  return generalitesJson;
}

export function getRegulation(apparatus: string): ApparatusRegulation {
  const reg = REGULATIONS[apparatus];
  if (!reg) {
    throw new Error(
      `Aucune donnée réglementaire chargée pour l'agrès "${apparatus}". Seuls le Sol et les Barres asymétriques sont disponibles pour le moment.`
    );
  }
  return reg;
}

export function getAvailableApparatuses(): string[] {
  return Object.keys(REGULATIONS);
}

export function getArche(apparatus: string, archeId: string): Arche | undefined {
  return getRegulation(apparatus).arches.find((a) => a.id === archeId);
}

export function getElement(apparatus: string, code: string): RegElement | undefined {
  return getRegulation(apparatus).elements.find((e) => e.code === code);
}

export function getEvolution(apparatus: string, evolutionId: string): Evolution | undefined {
  return getRegulation(apparatus).evolutions.find((e) => e.id === evolutionId);
}

export function getElementsByArche(apparatus: string, archeId: string): RegElement[] {
  return getRegulation(apparatus).elements.filter((e) => e.archeId === archeId);
}
