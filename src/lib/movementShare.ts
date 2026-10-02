import { getRegulation } from "@/regulation/loader";
import type { Diagnostic } from "@/engine/composition";
import type { SautDiagnostic } from "@/engine/saut";
import type { MovementShareData } from "@/lib/shares";

// Construit l'instantané d'un mouvement tel qu'il s'affiche dans le constructeur
// (éléments + analyse + note), pour les liens de partage.
export function buildMovementShare(args: {
  gymnastFirstName: string;
  gymnastLastName: string;
  label: string;
  apparatus: string;
  evolutionId: string;
  codes: string[];
  diagnostic: Diagnostic | SautDiagnostic;
  penaliteMateriel?: number;
}): MovementShareData {
  const regulation = getRegulation(args.apparatus);
  const byCode = new Map<string, (typeof regulation.elements)[number]>();
  for (const e of regulation.elements) if (!byCode.has(e.code)) byCode.set(e.code, e);
  const archeName = new Map(regulation.arches.map((a) => [a.id, a.name]));
  const evolution = regulation.evolutions.find((e) => e.id === args.evolutionId);

  const elements =
    "sautsRequired" in args.diagnostic
      ? args.diagnostic.sauts.map((s) => ({
          code: s.code,
          name: s.name,
          palier: s.palier,
          branch: s.branch,
          archeName: archeName.get(s.archeId),
        }))
      : args.codes
          .map((c) => byCode.get(c))
          .filter((e): e is NonNullable<typeof e> => !!e)
          .map((e) => ({
            code: e.code,
            name: e.name,
            palier: e.palier,
            branch: e.branch,
            archeName: archeName.get(e.archeId),
          }));

  return {
    gymnastFirstName: args.gymnastFirstName,
    gymnastLastName: args.gymnastLastName,
    label: args.label,
    apparatus: args.apparatus,
    evolutionId: args.evolutionId,
    elements,
    // L'assistant (suggestions) reste interne : jamais exposé dans un lien public.
    diagnostic: { ...args.diagnostic, suggestions: [] },
    ...(evolution
      ? {
          requirements: {
            arches: evolution.troncCommun.arches,
            elementsMin: evolution.troncCommun.elementsMin,
            elementsMax: evolution.troncCommun.elementsMax,
          },
        }
      : {}),
    ...(args.penaliteMateriel ? { penaliteMateriel: args.penaliteMateriel } : {}),
  };
}

export function penaliteMaterielFromStorage(movementId: string): number {
  try {
    const raw = localStorage.getItem(`saut-materiel-${movementId}`);
    if (!raw) return 0;
    const o = JSON.parse(raw) as { trampoTremp?: boolean; miniTrampoline?: boolean; plus13ans?: boolean };
    return (o.trampoTremp && o.plus13ans ? 1 : 0) + (o.miniTrampoline ? 1 : 0);
  } catch {
    return 0;
  }
}
