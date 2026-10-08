"use client";

import { useEffect, useMemo, useState } from "react";
import { NOTES_APPARATUS, computeTeamStartNotes, formatNote, type TeamStartNotes } from "@/lib/teamNotes";

const LABELS: Record<(typeof NOTES_APPARATUS)[number], string> = {
  SAUT: "Saut",
  BARRES_ASYM: "Barres",
  POUTRE: "Poutre",
  SOL: "Sol",
};

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  movements: { id: string; apparatus: string; evolution: string }[];
}

const cell = "px-2 py-1.5 text-right tabular-nums";

// Notes de départ de l'équipe : une ligne par gymnaste (meilleur mouvement à chaque agrès), les notes
// retenues en gras, puis le total d'équipe, le total max du niveau et le rapport des deux.
export default function TeamStartNotesPanel({ teamName, members }: { teamName: string | null; members: Member[] }) {
  const [data, setData] = useState<TeamStartNotes | null>(null);
  const [loading, setLoading] = useState(false);

  // Se recalcule quand l'équipe, ses membres ou leurs mouvements changent.
  const signature = useMemo(
    () => (teamName ? `${teamName}|${members.map((g) => `${g.id}:${g.movements.map((m) => m.id).join(",")}`).join(";")}` : ""),
    [teamName, members]
  );

  useEffect(() => {
    if (!teamName || members.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null);
      return;
    }
    let alive = true;
    setLoading(true);
    computeTeamStartNotes(teamName, members)
      .then((d) => alive && setData(d))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const table = useMemo(() => {
    if (!data) return null;
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
  }, [data]);

  return (
    <div className="w-full min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Notes de départ</h2>
      {!teamName ? (
        <p className="text-sm text-muted">
          Sélectionnez une équipe pour voir la note de départ de chaque gymnaste à chaque agrès, avec les totaux.
        </p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted">Cette équipe n&apos;a pas encore de gymnaste.</p>
      ) : !data || !table ? (
        <p className="text-sm text-muted">{loading ? "Calcul des notes…" : "—"}</p>
      ) : !data.evolution ? (
        <p className="text-sm text-muted">
          Évolution de l&apos;équipe indéterminée : créez des mouvements pour ses gymnastes (ou nommez l&apos;équipe avec son
          niveau, par exemple « B1 »).
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted">
                <th className="px-2 py-1.5 text-left font-semibold">Gymnaste</th>
                {NOTES_APPARATUS.map((a) => (
                  <th key={a} className="px-2 py-1.5 text-right font-semibold">
                    {LABELS[a]}
                  </th>
                ))}
                <th className="px-2 py-1.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.gymnasts.map((g) => (
                <tr key={g.id} className="border-t border-border-subtle">
                  <td className="px-2 py-1.5 text-foreground">{g.name}</td>
                  {NOTES_APPARATUS.map((a, i) => {
                    const n = g.notes[i];
                    const counts = n !== null && table.kept[i].has(g.id);
                    return (
                      <td key={a} className={`${cell} ${counts ? "font-semibold text-foreground" : "text-muted"}`}>
                        {n === null ? "—" : formatNote(n)}
                      </td>
                    );
                  })}
                  <td className={`${cell} font-semibold text-foreground`}>
                    {formatNote(g.notes.reduce<number>((t, n) => t + (n ?? 0), 0))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border-strong font-semibold text-foreground">
                <td className="px-2 py-1.5">Total équipe</td>
                {table.teamPerApparatus.map((n, i) => (
                  <td key={i} className={cell}>
                    {formatNote(n)}
                  </td>
                ))}
                <td className={`${cell} accent-gradient-text`}>{formatNote(table.teamTotal)}</td>
              </tr>
              <tr className="text-muted">
                <td className="px-2 py-1.5">Total max</td>
                {table.maxPerApparatus.map((n, i) => (
                  <td key={i} className={cell}>
                    {formatNote(n)}
                  </td>
                ))}
                <td className={cell}>{formatNote(table.maxTotal)}</td>
              </tr>
              <tr className="text-foreground">
                <td className="px-2 py-1.5" colSpan={5}>
                  Total / total max
                </td>
                <td className={`${cell} font-semibold`}>
                  {formatNote(table.teamTotal)} / {formatNote(table.maxTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-2 text-xs text-muted">
            Note de départ du meilleur mouvement de chaque gymnaste à chaque agrès, à l&apos;évolution de l&apos;équipe (
            {data.evolution}) ; « — » : aucun mouvement créé. Total équipe : les {data.nbCompte} meilleures notes de chaque
            agrès (en gras), les autres sont en gris. Total max : {data.nbCompte} × la note de départ maximale du niveau à
            chaque agrès.
          </p>
        </div>
      )}
    </div>
  );
}
