import { getArche, getElement, getRegulation } from "@/regulation/loader";
import { getCheck } from "@/regulation/checks";
import { PALIER_ORDER, palierRank, type CheckSpec, type Evolution, type Palier, type RegElement } from "@/regulation/types";

export interface MovementElementRef {
  code: string;
  role: "ENTREE" | "ELEMENT" | "SORTIE";
}

export interface CheckResult {
  id: string;
  label: string;
  status: "OK" | "MANQUANT" | "A_CONFIRMER";
  auto: boolean;
  confirmedManually?: boolean;
  points?: number;
  pondere?: boolean;
}

export interface Diagnostic {
  apparatus: string;
  evolutionId: string;
  elementCount: number;
  archesUsed: string[];
  archesCount: number;
  troncCommun: {
    archesOk: boolean;
    countOk: boolean;
    exigences: CheckResult[];
    complete: boolean;
    points: number;
  };
  paliers: {
    horsAutorise: { code: string; palier: Palier }[]; // éléments dont le palier n'est pas autorisé au niveau
  };
  valorisations: {
    results: CheckResult[];
    validatedCount: number;
    choisir: number;
    parmi: number;
    points: number;
  };
  noteDepart: number;
  suggestions: Suggestion[];
}

export interface Suggestion {
  elementCode: string;
  elementName: string;
  archeId: string;
  palier: Palier;
  reasons: string[]; // ce que l'ajout apporterait
  score: number; // nombre d'avantages (pour trier, "plusieurs avantages" en tête)
  masteredByGymnast?: boolean;
}

function resolveElements(apparatus: string, refs: MovementElementRef[]): RegElement[] {
  return refs
    .map((r) => getElement(apparatus, r.code))
    .filter((e): e is RegElement => e !== undefined);
}

function archeCategory(apparatus: string, archeId: string): string | undefined {
  return getArche(apparatus, archeId)?.category;
}

function isSalto(name: string): boolean {
  return /salto/i.test(name);
}

// Détecte les "runs" (séquences consécutives) d'éléments de la même catégorie
// dans l'ordre du mouvement -> proxy pour les Liaisons Acrobatiques (LA).
function findCategoryRuns(
  apparatus: string,
  elements: RegElement[],
  category: string,
  minLength: number
): RegElement[][] {
  const runs: RegElement[][] = [];
  let current: RegElement[] = [];
  for (const el of elements) {
    if (archeCategory(apparatus, el.archeId) === category) {
      current.push(el);
    } else {
      if (current.length >= minLength) runs.push(current);
      current = [];
    }
  }
  if (current.length >= minLength) runs.push(current);
  return runs;
}

function evaluateCheck(
  apparatus: string,
  spec: CheckSpec,
  elements: RegElement[]
): { ok: boolean; detail: string } {
  // Les éléments NOMADE ne comptent jamais pour une valorisation (règle Généralités).
  const usable = elements.filter((e) => e.palier !== "NOMADE");

  switch (spec.type) {
    case "CATEGORY_COUNT": {
      const matches = usable.filter((e) => {
        const cat = archeCategory(apparatus, e.archeId);
        if (cat !== spec.category) return false;
        if (spec.branch && e.branch !== spec.branch) return false;
        return true;
      });
      return { ok: matches.length >= spec.min, detail: `${matches.length}/${spec.min} trouvé(s)` };
    }
    case "ELEMENT_AT_PALIER_MIN": {
      const minRank = palierRank(spec.palierMin);
      const needed = spec.min ?? 1;
      const matches = usable.filter((e) => {
        if (spec.category && archeCategory(apparatus, e.archeId) !== spec.category) return false;
        return palierRank(e.palier) >= minRank && minRank >= 0;
      });
      return { ok: matches.length >= needed, detail: matches.length > 0 ? `${matches.length}/${needed} — ex: ${matches[0].name}` : "aucun élément au palier requis" };
    }
    case "SALTO_AT_PALIER_MIN": {
      const minRank = palierRank(spec.palierMin);
      const matches = usable.filter((e) => isSalto(e.name) && palierRank(e.palier) >= minRank);
      return { ok: matches.length > 0, detail: matches.length > 0 ? `ex: ${matches[0].name}` : "aucun salto au palier requis" };
    }
    case "TWO_ACRO_DIFFERENT_DIRECTIONS": {
      const acros = usable.filter((e) => archeCategory(apparatus, e.archeId) === "ACRO");
      const hasAvant = acros.some((e) => e.branch === "avant");
      const hasArriere = acros.some((e) => e.branch === "arriere");
      return { ok: hasAvant && hasArriere, detail: hasAvant && hasArriere ? "avant + arrière présents" : "il manque un sens (avant ou arrière)" };
    }
    case "LIAISON_ACRO": {
      // Une "run" de N éléments ACRO consécutifs peut former plusieurs
      // liaisons distinctes (groupes non chevauchants de runMinLength) :
      // ex. 5 éléments consécutifs -> 2 liaisons de 2 éléments (1 élément non utilisé).
      const runs = findCategoryRuns(apparatus, usable, "ACRO", spec.runMinLength);
      const liaisonsCount = runs.reduce((sum, r) => sum + Math.floor(r.length / spec.runMinLength), 0);
      return {
        ok: liaisonsCount >= spec.runsNeeded,
        detail: `${liaisonsCount}/${spec.runsNeeded} liaison(s) acrobatique(s) détectée(s) (≥${spec.runMinLength} éléments ACRO consécutifs)`,
      };
    }
    case "FORCE_OR_PG": {
      const hasForce = usable.some((e) => archeCategory(apparatus, e.archeId) === "FORCE");
      // PG (Passage Gymnique) = "Enchaînement de 2 sauts minimum différents
      // liés directement OU INDIRECTEMENT avec des pas courus, petits sauts,
      // pas chassés, tour chorégraphique... etc" (Généralités, lexique). Les
      // pas/tours de liaison ne sont pas des éléments codifiés dans le
      // référentiel : on ne peut donc pas exiger une adjacence stricte entre
      // les 2 sauts dans la séquence saisie -> on vérifie juste la présence
      // de 2 sauts gymniques différents (peu importe l'appel 1 ou 2 pieds,
      // la catégorie SAUT_GYM regroupe déjà les deux arches).
      const sauts = usable.filter((e) => archeCategory(apparatus, e.archeId) === "SAUT_GYM");
      const hasPG = new Set(sauts.map((e) => e.code)).size >= 2;
      return { ok: hasForce || hasPG, detail: hasForce ? "1 élément FORCE présent" : hasPG ? "passage gymnique (2 sauts différents) détecté" : "ni FORCE ni PG détecté" };
    }
    case "NAME_CONTAINS_ALL": {
      const min = spec.min ?? 1;
      const matches = usable.filter((e) => spec.terms.every((t) => e.name.toLowerCase().includes(t)));
      return { ok: matches.length >= min, detail: matches.length > 0 ? `${matches.length}/${min} — ex: ${matches[0].name}` : "élément correspondant non trouvé" };
    }
    case "MANUAL":
    default:
      return { ok: false, detail: "vérification manuelle requise" };
  }
}

export function analyzeMovement(
  apparatus: string,
  evolutionId: string,
  refs: MovementElementRef[],
  manualConfirmations: Set<string> = new Set()
): Diagnostic {
  const evolution = getRegulation(apparatus).evolutions.find((e) => e.id === evolutionId) as Evolution;
  if (!evolution) throw new Error(`Évolution inconnue: ${evolutionId}`);

  const elements = resolveElements(apparatus, refs);
  const archesUsed = Array.from(new Set(elements.map((e) => e.archeId)));

  // Tronc commun
  const tcExigences: CheckResult[] = evolution.troncCommun.exigences.map((ex) => {
    const spec = getCheck(ex.id, apparatus);
    if (spec.type === "MANUAL") {
      const confirmed = manualConfirmations.has(ex.id);
      return { id: ex.id, label: ex.label, status: confirmed ? "OK" : "A_CONFIRMER", auto: false, confirmedManually: confirmed };
    }
    const { ok } = evaluateCheck(apparatus, spec, elements);
    return { id: ex.id, label: ex.label, status: ok ? "OK" : "MANQUANT", auto: true };
  });
  const archesOk = archesUsed.length >= evolution.troncCommun.arches;
  const countOk = elements.length >= evolution.troncCommun.elementsMin && elements.length <= evolution.troncCommun.elementsMax;
  const tcExigencesOk = tcExigences.every((r) => r.status === "OK");
  const troncCommunComplete = archesOk && countOk && tcExigencesOk;
  const troncCommunPoints = (archesOk ? 1 : 0) + (countOk ? 1 : 0) + tcExigences.filter((r) => r.status === "OK").length;

  // Paliers autorisés
  const autorisesSet = new Set(evolution.paliersAutorises);
  const NON_RANKED_PALIERS: Palier[] = ["PREREQUIS", "NOMADE", "BASE"];
  const horsAutorise = elements
    .filter((e) => !NON_RANKED_PALIERS.includes(e.palier) && !autorisesSet.has(e.palier))
    .map((e) => ({ code: e.code, palier: e.palier }));

  // Valorisations
  const valoResults: CheckResult[] = evolution.valorisations.options.map((opt) => {
    const spec = getCheck(opt.id, apparatus);
    if (spec.type === "MANUAL") {
      const confirmed = manualConfirmations.has(opt.id);
      return {
        id: opt.id,
        label: opt.label,
        status: confirmed ? "OK" : "A_CONFIRMER",
        auto: false,
        confirmedManually: confirmed,
        points: opt.points,
        pondere: opt.pondere,
      };
    }
    const { ok } = evaluateCheck(apparatus, spec, elements);
    return { id: opt.id, label: opt.label, status: ok ? "OK" : "MANQUANT", auto: true, points: opt.points, pondere: opt.pondere };
  });
  const validated = valoResults.filter((r) => r.status === "OK");
  // On ne compte que les "choisir" meilleures valorisations validées (priorité aux pondérées)
  const sortedValidated = [...validated].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const counted = sortedValidated.slice(0, evolution.valorisations.choisir);
  const valorisationsPoints = counted.reduce((sum, r) => sum + (r.points ?? 0), 0);

  const noteDepart = troncCommunPoints + valorisationsPoints;

  const suggestions = computeSuggestions(apparatus, evolution, elements, tcExigences, valoResults, archesUsed);

  return {
    apparatus,
    evolutionId,
    elementCount: elements.length,
    archesUsed,
    archesCount: archesUsed.length,
    troncCommun: {
      archesOk,
      countOk,
      exigences: tcExigences,
      complete: troncCommunComplete,
      points: troncCommunPoints,
    },
    paliers: { horsAutorise },
    valorisations: {
      results: valoResults,
      validatedCount: validated.length,
      choisir: evolution.valorisations.choisir,
      parmi: evolution.valorisations.parmi,
      points: valorisationsPoints,
    },
    noteDepart,
    suggestions,
  };
}

// Pour chaque élément du référentiel non présent dans le mouvement, on simule
// son ajout et on regarde ce que ça change -> base de "Que puis-je ajouter ?"
function computeSuggestions(
  apparatus: string,
  evolution: Evolution,
  currentElements: RegElement[],
  tcExigences: CheckResult[],
  valoResults: CheckResult[],
  archesUsed: string[]
): Suggestion[] {
  const currentCodes = new Set(currentElements.map((e) => e.code));
  const missingTc = tcExigences.filter((r) => r.status === "MANQUANT");
  const missingValo = valoResults.filter((r) => r.status === "MANQUANT" && r.auto);
  const needsMoreArches = archesUsed.length < evolution.troncCommun.arches;

  if (missingTc.length === 0 && missingValo.length === 0 && !needsMoreArches) return [];

  const autorisesSet = new Set(evolution.paliersAutorises);
  const candidates = getRegulation(apparatus).elements.filter(
    (e) =>
      !currentCodes.has(e.code) &&
      e.palier !== "PREREQUIS" &&
      (e.palier === "NOMADE" || e.palier === "BASE" || autorisesSet.has(e.palier))
  );

  const suggestions: Suggestion[] = [];
  for (const candidate of candidates) {
    const hypothetical = [...currentElements, candidate];
    const reasons: string[] = [];

    if (needsMoreArches && !archesUsed.includes(candidate.archeId)) {
      reasons.push("ajoute une nouvelle arche au tronc commun");
    }

    for (const ex of missingTc) {
      const spec = getCheck(ex.id, apparatus);
      if (spec.type === "MANUAL") continue;
      const before = evaluateCheck(apparatus, spec, currentElements).ok;
      const after = evaluateCheck(apparatus, spec, hypothetical).ok;
      if (!before && after) reasons.push(`complète l'exigence « ${ex.label} »`);
    }

    for (const v of missingValo) {
      const spec = getCheck(v.id, apparatus);
      if (spec.type === "MANUAL") continue;
      const before = evaluateCheck(apparatus, spec, currentElements).ok;
      const after = evaluateCheck(apparatus, spec, hypothetical).ok;
      if (!before && after) reasons.push(`apporte la valorisation « ${v.label} » (+${v.points} pts)`);
    }

    if (reasons.length > 0) {
      suggestions.push({
        elementCode: candidate.code,
        elementName: candidate.name,
        archeId: candidate.archeId,
        palier: candidate.palier,
        reasons,
        score: reasons.length,
      });
    }
  }

  // Pas de troncature ici : un filtre ultérieur (ex. "éléments maîtrisés
  // uniquement") doit pouvoir s'appliquer sur l'ensemble des suggestions
  // pertinentes, pas seulement sur les mieux classées.
  return suggestions.sort((a, b) => b.score - a.score);
}
