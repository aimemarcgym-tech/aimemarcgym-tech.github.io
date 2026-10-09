import { getArche, getElement, getRegulation } from "@/regulation/loader";
import { getCheck } from "@/regulation/checks";
import { isVariantElement, isSortieElement, countingKey } from "@/regulation/variants";
import { PALIER_ORDER, palierRank, type CheckSpec, type Evolution, type Palier, type RegElement } from "@/regulation/types";

export interface MovementElementRef {
  code: string;
  role: "ENTREE" | "ELEMENT" | "SORTIE";
  // Pastille de série posée sur l'élément (Sol et Poutre) : simple annotation, sans effet sur le calcul.
  serie?: "MIXTE" | "GYMNIQUE" | "ACRO";
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
  liaisons: {
    // Dans une série d'éléments liés (LA/LG/LM), le dernier élément ne peut
    // pas être une variante — seuls les éléments intermédiaires le peuvent.
    dernierEnVariante: { code: string; name: string; category: string }[];
  };
  valorisations: {
    results: CheckResult[];
    validatedCount: number;
    choisir: number;
    parmi: number;
    points: number;
  };
  noteDepart: number;
  noteDepartMax: number;
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

// Toutes les catégories dans lesquelles un élément compte : celle de son
// arche, plus ses éventuelles extraCategories (élément partagé entre deux
// catégories, ex : ACRO + SORTIES).
function elementCategories(apparatus: string, el: RegElement): string[] {
  const primary = archeCategory(apparatus, el.archeId);
  const cats = primary ? [primary] : [];
  return el.extraCategories ? [...cats, ...el.extraCategories] : cats;
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
    if (elementCategories(apparatus, el).includes(category)) {
      current.push(el);
    } else {
      if (current.length >= minLength) runs.push(current);
      current = [];
    }
  }
  if (current.length >= minLength) runs.push(current);
  return runs;
}

// Catégories pouvant composer une liaison au sens du lexique officiel :
// LA = acros enchaînés (ACRO), LG = 2 éléments gymniques différents (PIVOT
// et SAUT_GYM uniquement), LM = 1 élément gymnique (PIVOT/SAUT_GYM) + 1
// acrobatique ou inversement. Les trois partagent donc un même ensemble de
// catégories "enchaînables" : un run de 2+ éléments consécutifs dont CHACUN
// appartient à cet ensemble (peu importe lequel exactement, pour couvrir
// aussi les LM qui mélangent ACRO et PIVOT/SAUT_GYM) est une liaison
// candidate.
const LIAISON_CATEGORIES = ["ACRO", "PIVOT", "SAUT_GYM"];

// Dans une liaison (série d'éléments enchaînables dans l'ordre du mouvement
// — proxy pour LA/LG/LM), seuls les éléments avant le dernier peuvent être
// des variantes : le dernier élément de la série doit être la forme de base.
function findVariantEndingViolations(
  apparatus: string,
  elements: RegElement[]
): { code: string; name: string; category: string }[] {
  const isLiaisonEligible = (el: RegElement) =>
    elementCategories(apparatus, el).some((c) => LIAISON_CATEGORIES.includes(c));

  const runs: RegElement[][] = [];
  let current: RegElement[] = [];
  for (const el of elements) {
    if (isLiaisonEligible(el)) current.push(el);
    else {
      if (current.length >= 2) runs.push(current);
      current = [];
    }
  }
  if (current.length >= 2) runs.push(current);

  const violations: { code: string; name: string; category: string }[] = [];
  for (const run of runs) {
    const last = run[run.length - 1];
    if (isVariantElement(last.code, last.name)) {
      const category = elementCategories(apparatus, last).find((c) => LIAISON_CATEGORIES.includes(c)) ?? "";
      violations.push({ code: last.code, name: last.name, category });
    }
  }
  return violations;
}

function evaluateCheck(
  apparatus: string,
  spec: CheckSpec,
  elements: RegElement[],
  context: "TRONC_COMMUN" | "VALORISATION",
  paliersValorisables: Palier[],
  paliersAutorises: Palier[] = []
): { ok: boolean; detail: string } {
  // Prérequis, Base et Nomade peuvent valider une exigence de tronc commun,
  // mais jamais une valorisation (règle confirmée par l'utilisateur) : en
  // contexte VALORISATION, seuls les éléments dont le palier fait partie
  // des "paliers valorisables" de l'évolution comptent — ce champ des
  // données (déjà présent par évolution) exclut naturellement ces 3
  // paliers puisqu'aucun d'eux n'y apparaît jamais, et respecte aussi la
  // borne haute propre à chaque évolution (ex. un élément P7 ne doit pas
  // valoriser une évolution dont les paliers valorisables s'arrêtent à P4).
  const valorisableSet = new Set(paliersValorisables);
  const usable =
    context === "VALORISATION" ? elements.filter((e) => valorisableSet.has(e.palier)) : elements;

  // FAQ #160 : un même élément réalisé plusieurs fois ne compte qu'une fois (pour les exigences et les
  // valorisations) ; seules les liaisons gardent la séquence complète, répétitions comprises.
  const uniq = usable.filter((e, k) => usable.findIndex((x) => x.code === e.code) === k);

  switch (spec.type) {
    case "CATEGORY_COUNT": {
      const matches = uniq.filter((e) => {
        if (!elementCategories(apparatus, e).includes(spec.category)) return false;
        if (spec.branch && e.branch !== spec.branch) return false;
        // FAQ #145 : en poutre, une sortie ne compte comme acro en poutre haute
        // (tronc commun) que si son palier est autorisé au niveau.
        if (
          apparatus === "POUTRE" &&
          context === "TRONC_COMMUN" &&
          spec.category === "ACRO" &&
          paliersAutorises.length > 0 &&
          isSortieElement(e.archeId, e.extraCategories) &&
          !["PREREQUIS", "NOMADE", "BASE"].includes(e.palier) &&
          !paliersAutorises.includes(e.palier)
        ) {
          return false;
        }
        return true;
      });
      return { ok: matches.length >= spec.min, detail: `${matches.length}/${spec.min} trouvé(s)` };
    }
    case "ELEMENT_AT_PALIER_MIN": {
      const minRank = palierRank(spec.palierMin);
      const needed = spec.min ?? 1;
      const matches = uniq.filter((e) => {
        if (spec.category && !elementCategories(apparatus, e).includes(spec.category)) return false;
        // Une sortie ne valide jamais une valorisation "acro sur poutre" (elle
        // ne compte que pour le tronc commun et ses propres valorisations de
        // sortie) : réception sur poutre requise, pas en bout de poutre.
        if (spec.excludeSorties && isSortieElement(e.archeId, e.extraCategories)) return false;
        return palierRank(e.palier) >= minRank && minRank >= 0;
      });
      return { ok: matches.length >= needed, detail: matches.length > 0 ? `${matches.length}/${needed} — ex: ${matches[0].name}` : "aucun élément au palier requis" };
    }
    case "SALTO_AT_PALIER_MIN": {
      const minRank = palierRank(spec.palierMin);
      const matches = uniq.filter((e) => isSalto(e.name) && palierRank(e.palier) >= minRank);
      return { ok: matches.length > 0, detail: matches.length > 0 ? `ex: ${matches[0].name}` : "aucun salto au palier requis" };
    }
    case "TWO_ACRO_DIFFERENT_DIRECTIONS": {
      const acros = uniq.filter((e) => elementCategories(apparatus, e).includes("ACRO"));
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
      const hasForce = uniq.some((e) => elementCategories(apparatus, e).includes("FORCE"));
      // PG (Passage Gymnique) = "Enchaînement de 2 sauts minimum différents
      // liés directement OU INDIRECTEMENT avec des pas courus, petits sauts,
      // pas chassés, tour chorégraphique... etc" (Généralités, lexique). Les
      // pas/tours de liaison ne sont pas des éléments codifiés dans le
      // référentiel : on ne peut donc pas exiger une adjacence stricte entre
      // les 2 sauts dans la séquence saisie -> on vérifie juste la présence
      // de 2 sauts gymniques différents (peu importe l'appel 1 ou 2 pieds,
      // la catégorie SAUT_GYM regroupe déjà les deux arches).
      const sauts = uniq.filter((e) => elementCategories(apparatus, e).includes("SAUT_GYM"));
      const hasPG = new Set(sauts.map((e) => e.code)).size >= 2;
      return { ok: hasForce || hasPG, detail: hasForce ? "1 élément FORCE présent" : hasPG ? "passage gymnique (2 sauts différents) détecté" : "ni FORCE ni PG détecté" };
    }
    case "NAME_CONTAINS_ALL": {
      const min = spec.min ?? 1;
      const matches = uniq.filter((e) => spec.terms.every((t) => e.name.toLowerCase().includes(t)));
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
    const { ok } = evaluateCheck(apparatus, spec, elements, "TRONC_COMMUN", evolution.paliersValorisables, evolution.paliersAutorises);
    return { id: ex.id, label: ex.label, status: ok ? "OK" : "MANQUANT", auto: true };
  });
  const archesOk = archesUsed.length >= evolution.troncCommun.arches;
  // FAQ #160 : les répétitions d'un même élément ne comptent qu'une fois dans le nombre d'éléments.
  // Sol : rondade, flic-flac arrière et avant comptent pour un seul élément avec leur variante.
  const distinctCount = new Set(elements.map((e) => countingKey(apparatus, e.code))).size;
  const countOk = distinctCount >= evolution.troncCommun.elementsMin && distinctCount <= evolution.troncCommun.elementsMax;
  const tcExigencesOk = tcExigences.every((r) => r.status === "OK");
  const troncCommunComplete = archesOk && countOk && tcExigencesOk;
  const troncCommunPoints = (archesOk ? 1 : 0) + (countOk ? 1 : 0) + tcExigences.filter((r) => r.status === "OK").length;

  // Paliers autorisés
  const autorisesSet = new Set(evolution.paliersAutorises);
  const NON_RANKED_PALIERS: Palier[] = ["PREREQUIS", "NOMADE", "BASE"];
  const horsAutorise = elements
    .filter((e) => !NON_RANKED_PALIERS.includes(e.palier) && !autorisesSet.has(e.palier))
    .map((e) => ({ code: e.code, palier: e.palier }));

  // Valorisations : toujours confirmées à la main par l'entraîneur (jamais
  // validées automatiquement). Le moteur continue pourtant d'évaluer celles qu'il
  // sait vérifier, uniquement pour alimenter l'Assistant (valoriser en priorité).
  const valoAutoMissing = new Set<string>();
  const valoResults: CheckResult[] = evolution.valorisations.options.map((opt) => {
    const spec = getCheck(opt.id, apparatus);
    const confirmed = manualConfirmations.has(opt.id);
    if (spec.type !== "MANUAL" && !confirmed) {
      const { ok } = evaluateCheck(apparatus, spec, elements, "VALORISATION", evolution.paliersValorisables);
      if (!ok) valoAutoMissing.add(opt.id);
    }
    return {
      id: opt.id,
      label: opt.label,
      status: confirmed ? "OK" : "A_CONFIRMER",
      auto: false,
      confirmedManually: confirmed,
      points: opt.points,
      pondere: opt.pondere,
    };
  });
  const validated = valoResults.filter((r) => r.status === "OK");
  // On ne compte que les "choisir" meilleures valorisations validées (priorité aux pondérées)
  const sortedValidated = [...validated].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const counted = sortedValidated.slice(0, evolution.valorisations.choisir);
  const valorisationsPoints = counted.reduce((sum, r) => sum + (r.points ?? 0), 0);

  const noteDepart = troncCommunPoints + valorisationsPoints;

  // Note maximale atteignable pour cette évolution : tronc commun entièrement
  // validé (2 pts arches/nombre + 1 pt par exigence) + les "choisir" valeurs
  // de valorisations les plus hautes parmi les options existantes (fixe par
  // évolution, indépendant des éléments déjà posés dans ce mouvement précis).
  const noteDepartMax =
    2 +
    evolution.troncCommun.exigences.length +
    [...evolution.valorisations.options]
      .map((o) => o.points)
      .sort((a, b) => b - a)
      .slice(0, evolution.valorisations.choisir)
      .reduce((sum, p) => sum + p, 0);

  const suggestions = computeSuggestions(apparatus, evolution, elements, tcExigences, valoResults.filter((r) => valoAutoMissing.has(r.id)), archesUsed);

  return {
    apparatus,
    evolutionId,
    elementCount: distinctCount,
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
    liaisons: { dernierEnVariante: findVariantEndingViolations(apparatus, elements) },
    valorisations: {
      results: valoResults,
      validatedCount: validated.length,
      choisir: evolution.valorisations.choisir,
      parmi: evolution.valorisations.parmi,
      points: valorisationsPoints,
    },
    noteDepart,
    noteDepartMax,
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
  const missingValo = valoResults;
  const needsMoreArches = archesUsed.length < evolution.troncCommun.arches;

  if (missingTc.length === 0 && missingValo.length === 0 && !needsMoreArches) return [];

  const autorisesSet = new Set(evolution.paliersAutorises);
  // Les éléments PREREQUIS restent suggérables (ils peuvent compléter le
  // tronc commun, cf. evaluateCheck) — evaluateCheck se charge de ne jamais
  // leur attribuer une valorisation, donc l'Assistant ne les proposera
  // naturellement que pour ce que la règle autorise.
  const candidates = getRegulation(apparatus).elements.filter(
    (e) =>
      !currentCodes.has(e.code) &&
      (e.palier === "NOMADE" || e.palier === "BASE" || e.palier === "PREREQUIS" || autorisesSet.has(e.palier))
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
      const before = evaluateCheck(apparatus, spec, currentElements, "TRONC_COMMUN", evolution.paliersValorisables, evolution.paliersAutorises).ok;
      const after = evaluateCheck(apparatus, spec, hypothetical, "TRONC_COMMUN", evolution.paliersValorisables, evolution.paliersAutorises).ok;
      if (!before && after) reasons.push(`complète l'exigence « ${ex.label} »`);
    }

    for (const v of missingValo) {
      const spec = getCheck(v.id, apparatus);
      if (spec.type === "MANUAL") continue;
      const before = evaluateCheck(apparatus, spec, currentElements, "VALORISATION", evolution.paliersValorisables).ok;
      const after = evaluateCheck(apparatus, spec, hypothetical, "VALORISATION", evolution.paliersValorisables).ok;
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
