import { getElement, getEvolution } from "@/regulation/loader";
import type { Palier } from "@/regulation/types";
import type { MovementElementRef } from "@/engine/composition";

// Le Saut ne fonctionne pas comme les autres agrès : pas de tronc commun
// d'arches/éléments cumulés dans une séquence, mais le choix d'1 ou 2 sauts
// (selon l'évolution) dont chacun a une valeur de départ fixe déterminée par
// son palier (barème "Valeur des sauts"). Voir src/regulation/data/saut/.

export interface SautResult {
  code: string;
  name: string;
  archeId: string;
  branch: string | null;
  palier: Palier;
  value: number;
  horsPalierAutorise: boolean;
}

export interface SautValorisationResult {
  id: string;
  label: string;
  status: "OK" | "MANQUANT" | "A_CONFIRMER";
  auto: boolean;
  confirmedManually?: boolean;
}

export interface SautDiagnostic {
  apparatus: "SAUT";
  evolutionId: string;
  sautsRequired: number;
  sauts: SautResult[];
  troncCommunOk: boolean;
  troncCommunMessage: string;
  famillesDifferentes: boolean;
  auMoinsUnDansPaliersValorisables: boolean;
  valorisations: SautValorisationResult[];
  noteDepart: number;
}

// PR1/PR2/PR3 (paliers prérequis propres au barème de valeur des sauts) sont
// tous traités comme "PREREQUIS" du point de vue des paliers autorisés par
// évolution (qui utilisent la catégorie générique PREREQUIS/PR, commune aux
// autres agrès).
const PREREQUIS_TIER: Palier[] = ["PREREQUIS", "PR1", "PR2", "PR3"];

export function analyzeSaut(
  evolutionId: string,
  elements: MovementElementRef[],
  manualConfirmations: Set<string>
): SautDiagnostic {
  const evolution = getEvolution("SAUT", evolutionId);
  if (!evolution) {
    throw new Error(`Évolution Saut "${evolutionId}" introuvable.`);
  }
  const sautsRequired = evolution.troncCommun.elementsMax;

  const sauts: SautResult[] = elements
    .map((e) => getElement("SAUT", e.code))
    .filter((el): el is NonNullable<typeof el> => !!el)
    .map((el) => {
      const autorise =
        el.palier === "BASE" ||
        el.palier === "NOMADE" ||
        evolution.paliersAutorises.some((p) =>
          PREREQUIS_TIER.includes(el.palier) ? PREREQUIS_TIER.includes(p) : p === el.palier
        );
      return {
        code: el.code,
        name: el.name,
        archeId: el.archeId,
        branch: el.branch,
        palier: el.palier,
        value: el.value ?? 0,
        horsPalierAutorise: !autorise,
      };
    });

  const troncCommunOk = sauts.length === sautsRequired && sauts.every((s) => !s.horsPalierAutorise);
  const troncCommunMessage =
    sauts.length !== sautsRequired
      ? `${sauts.length}/${sautsRequired} saut(s) sélectionné(s)`
      : sauts.some((s) => s.horsPalierAutorise)
        ? "Un saut sélectionné n'est pas dans les paliers autorisés pour cette évolution."
        : "Conforme.";

  const uniqueArches = new Set(sauts.map((s) => s.archeId));
  const famillesDifferentes = sautsRequired < 2 || (sauts.length === 2 && uniqueArches.size === 2);

  const estValorisable = (p: Palier) => evolution.paliersValorisables.includes(p);
  const auMoinsUnDansPaliersValorisables = sauts.some((s) => estValorisable(s.palier));

  const valorisations: SautValorisationResult[] = evolution.valorisations.options.map((opt) => {
    if (opt.label.startsWith("2 sauts de 1er envol différents")) {
      const ok = sautsRequired >= 2 && sauts.length === sautsRequired && famillesDifferentes && auMoinsUnDansPaliersValorisables;
      return { id: opt.id, label: opt.label, status: ok ? "OK" : "MANQUANT", auto: true };
    }
    const confirmed = manualConfirmations.has(opt.id);
    return { id: opt.id, label: opt.label, status: confirmed ? "OK" : "A_CONFIRMER", auto: false, confirmedManually: confirmed };
  });

  const noteDepart = sauts.length > 0 ? Math.max(...sauts.map((s) => s.value)) : 0;

  return {
    apparatus: "SAUT",
    evolutionId,
    sautsRequired,
    sauts,
    troncCommunOk,
    troncCommunMessage,
    famillesDifferentes,
    auMoinsUnDansPaliersValorisables,
    valorisations,
    noteDepart,
  };
}
