import { getRegulation } from "@/regulation/loader";
import type { Diagnostic } from "@/engine/composition";
import type { SautDiagnostic } from "@/engine/saut";
import type { MovementShareData, SnapshotShareData } from "@/lib/shares";
import type { MovementSnapshotRow } from "@/lib/idb";
import { getMovement, getSnapshots } from "@/lib/data";
import { analyzeMovement } from "@/engine/composition";
import { analyzeSaut } from "@/engine/saut";

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
  snapshots?: MovementSnapshotRow[];
  // Pastilles de série de chaque élément, dans l'ordre de codes (Sol et Poutre).
  series?: (string | null)[];
}): MovementShareData {
  const regulation = getRegulation(args.apparatus);
  const evolution = regulation.evolutions.find((e) => e.id === args.evolutionId);
  const elements = shareElements(args.apparatus, args.codes, args.diagnostic, args.series);
  const snapshots = snapshotShares(args.apparatus, args.evolutionId, args.snapshots ?? []);

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
    ...(snapshots.length > 0 ? { snapshots } : {}),
  };
}

// Éléments affichables (nom, palier, arche) d'une liste de codes ; au Saut, ce sont les sauts du diagnostic.
function shareElements(apparatus: string, codes: string[], diagnostic: Diagnostic | SautDiagnostic, series?: (string | null)[]) {
  const regulation = getRegulation(apparatus);
  const byCode = new Map<string, (typeof regulation.elements)[number]>();
  for (const e of regulation.elements) if (!byCode.has(e.code)) byCode.set(e.code, e);
  const archeName = new Map(regulation.arches.map((a) => [a.id, a.name]));
  if ("sautsRequired" in diagnostic) {
    return diagnostic.sauts.map((s) => ({
      code: s.code,
      name: s.name,
      palier: s.palier,
      branch: s.branch,
      archeName: archeName.get(s.archeId),
    }));
  }
  return codes
    .map((c, i) => ({ e: byCode.get(c), serie: series?.[i] ?? null }))
    .filter((x): x is { e: NonNullable<typeof x.e>; serie: string | null } => !!x.e)
    .map(({ e, serie }) => ({
      code: e.code,
      name: e.name,
      palier: e.palier,
      branch: e.branch,
      archeName: archeName.get(e.archeId),
      ...(serie ? { serie } : {}),
    }));
}

const MAX_SNAPSHOTS_SHARED = 10;

// Les instantanés de l'historique, au format du lien : on garde l'analyse enregistrée au moment de
// l'instantané ; si elle est absente ou d'un ancien format, on la recalcule à partir des éléments.
export function snapshotShares(apparatus: string, evolutionId: string, rows: MovementSnapshotRow[]): SnapshotShareData[] {
  // Les plus récents (10 au maximum), présentés dans l'ordre de création comme dans l'historique.
  const recent = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_SNAPSHOTS_SHARED).reverse();
  const out: SnapshotShareData[] = [];
  for (const row of recent) {
    try {
      const codes = JSON.parse(row.elementCodes) as string[];
      let diagnostic: Diagnostic | SautDiagnostic | null = null;
      try {
        const stored = JSON.parse(row.detailJson) as Diagnostic | SautDiagnostic;
        const valide = apparatus === "SAUT" ? "sautsRequired" in stored : "troncCommun" in stored && "valorisations" in stored;
        if (valide) diagnostic = stored;
      } catch {}
      if (!diagnostic) {
        const refs = codes.map((code) => ({ code, role: "ELEMENT" as const }));
        diagnostic = apparatus === "SAUT" ? analyzeSaut(evolutionId, refs, new Set()) : analyzeMovement(apparatus, evolutionId, refs, new Set());
      }
      out.push({
        ...(row.name ? { name: row.name } : {}),
        createdAt: row.createdAt,
        noteDepart: row.noteDepart,
        elements: shareElements(apparatus, codes, diagnostic, row.series),
        diagnostic: { ...diagnostic, suggestions: [] },
      });
    } catch {
      // instantané illisible : on l'ignore plutôt que de bloquer le partage
    }
  }
  return out;
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

const APPARATUS_ORDER = ["SAUT", "BARRES_ASYM", "POUTRE", "SOL"];

// Instantané de tous les mouvements d'une gymnaste (ordre officiel de rotation), avec les mêmes
// confirmations manuelles et pénalités matériel que dans le constructeur (stockées par appareil).
export async function buildGymnastMovementShares(gymnast: {
  firstName: string;
  lastName: string;
  movements: { id: string; apparatus: string; evolution: string; label: string }[];
}): Promise<MovementShareData[]> {
  const sorted = [...gymnast.movements].sort(
    (a, b) => APPARATUS_ORDER.indexOf(a.apparatus) - APPARATUS_ORDER.indexOf(b.apparatus)
  );
  const out: MovementShareData[] = [];
  for (const m of sorted) {
    const full = await getMovement(m.id);
    if (!full) continue;
    const refs = full.elements.map((e) => ({ code: e.elementCode, role: e.role as "ENTREE" | "ELEMENT" | "SORTIE" }));
    const seriesList = full.elements.map((e) => e.serie ?? null);
    let confirmations = new Set<string>();
    try {
      const raw = localStorage.getItem(`manual-confirm-${m.id}`);
      if (raw) confirmations = new Set(JSON.parse(raw));
    } catch {}
    const diagnostic =
      m.apparatus === "SAUT"
        ? analyzeSaut(m.evolution, refs, confirmations)
        : analyzeMovement(m.apparatus, m.evolution, refs, confirmations);
    out.push(
      buildMovementShare({
        gymnastFirstName: gymnast.firstName,
        gymnastLastName: gymnast.lastName,
        label: m.label,
        apparatus: m.apparatus,
        evolutionId: m.evolution,
        codes: refs.map((r) => r.code),
        series: seriesList,
        diagnostic,
        penaliteMateriel: m.apparatus === "SAUT" ? penaliteMaterielFromStorage(m.id) : undefined,
        snapshots: await getSnapshots(m.id),
      })
    );
  }
  return out;
}
