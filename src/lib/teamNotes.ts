import { getMovement } from "@/lib/data";
import { penaliteMaterielFromStorage } from "@/lib/movementShare";
import { analyzeMovement } from "@/engine/composition";
import { analyzeSaut } from "@/engine/saut";
import categoriesData from "@/regulation/data/categories-age.json";

// Dans l'ordre de rotation d'une compétition.
export const NOTES_APPARATUS = ["SAUT", "BARRES_ASYM", "POUTRE", "SOL"] as const;

interface MemberLike {
  id: string;
  firstName: string;
  lastName: string;
  movements: { id: string; apparatus: string; evolution: string }[];
}

export interface TeamStartNotes {
  evolution: string | null;
  // Nombre de notes retenues par agrès pour le total d'équipe (format « 6 gyms / 4 notes »).
  nbCompte: number;
  gymnasts: { id: string; name: string; notes: (number | null)[] }[];
  // Note de départ maximale du niveau, à chaque agrès (une seule note).
  maxPerApparatus: number[];
}

// L'évolution de l'équipe : celle que son nom indique (« B1 »…), sinon la plus courante dans les mouvements de ses gymnastes.
export function teamEvolution(teamName: string, members: MemberLike[]): string | null {
  const fromName = teamName.match(/\b([ABC][123])\b/i)?.[1]?.toUpperCase();
  if (fromName) return fromName;
  const counts = new Map<string, number>();
  for (const g of members) for (const m of g.movements) counts.set(m.evolution, (counts.get(m.evolution) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return best ? best[0] : null;
}

// « 6 gyms / 4 notes » -> 4 (repli : 4, valeur courante du programme).
export function notesComptees(evolution: string | null): number {
  const format = categoriesData.niveaux.find((n) => n.evolution === evolution)?.format ?? "";
  const m = format.match(/(\d+)\s*notes?/i);
  return m ? parseInt(m[1], 10) : 4;
}

export function formatNote(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

// Note de départ de chaque gymnaste à chaque agrès : celle de son meilleur mouvement à l'évolution de
// l'équipe, avec les mêmes confirmations manuelles que dans le constructeur (au Saut, après pénalité matériel).
export async function computeTeamStartNotes(teamName: string, members: MemberLike[]): Promise<TeamStartNotes> {
  const evolution = teamEvolution(teamName, members);
  const nbCompte = notesComptees(evolution);

  const noteOf = async (m: { id: string; apparatus: string; evolution: string }): Promise<number | null> => {
    const full = await getMovement(m.id);
    if (!full) return null;
    const refs = full.elements.map((e) => ({ code: e.elementCode, role: e.role as "ENTREE" | "ELEMENT" | "SORTIE" }));
    let confirmations = new Set<string>();
    try {
      const raw = localStorage.getItem(`manual-confirm-${m.id}`);
      if (raw) confirmations = new Set(JSON.parse(raw));
    } catch {}
    try {
      if (m.apparatus === "SAUT") {
        const d = analyzeSaut(m.evolution, refs, confirmations);
        return Math.max(0, d.noteDepart - penaliteMaterielFromStorage(m.id));
      }
      return analyzeMovement(m.apparatus, m.evolution, refs, confirmations).noteDepart;
    } catch {
      return null;
    }
  };

  const gymnasts = await Promise.all(
    members.map(async (g) => ({
      id: g.id,
      name: `${g.firstName} ${g.lastName}`,
      notes: await Promise.all(
        NOTES_APPARATUS.map(async (apparatus) => {
          const notes = (
            await Promise.all(
              g.movements.filter((m) => m.apparatus === apparatus && m.evolution === evolution).map(noteOf)
            )
          ).filter((n): n is number => n !== null);
          return notes.length ? Math.max(...notes) : null;
        })
      ),
    }))
  );

  const maxPerApparatus = NOTES_APPARATUS.map((apparatus) => {
    if (!evolution) return 0;
    try {
      return apparatus === "SAUT"
        ? analyzeSaut(evolution, [], new Set()).noteDepartMax
        : analyzeMovement(apparatus, evolution, [], new Set()).noteDepartMax;
    } catch {
      return 0;
    }
  });

  return { evolution, nbCompte, gymnasts, maxPerApparatus };
}

// Notes retenues par agrès (les nbCompte meilleures), totaux d'équipe et totaux max : partagé entre le panneau et la page publique.
export function summarizeTeamNotes(data: TeamStartNotes) {
  const kept = NOTES_APPARATUS.map((_, a) => {
    const ranked = data.gymnasts
      .map((g) => ({ id: g.id, n: g.notes[a] }))
      .filter((x): x is { id: string; n: number } => x.n !== null)
      .sort((x, y) => y.n - x.n)
      .slice(0, data.nbCompte);
    return new Set(ranked.map((x) => x.id));
  });
  const teamPerApparatus = NOTES_APPARATUS.map((_, a) =>
    data.gymnasts.reduce((t, g) => t + (kept[a].has(g.id) ? (g.notes[a] ?? 0) : 0), 0)
  );
  const maxPerApparatus = data.maxPerApparatus.map((m) => m * data.nbCompte);
  return {
    kept,
    teamPerApparatus,
    maxPerApparatus,
    teamTotal: teamPerApparatus.reduce((t, n) => t + n, 0),
    maxTotal: maxPerApparatus.reduce((t, n) => t + n, 0),
  };
}
