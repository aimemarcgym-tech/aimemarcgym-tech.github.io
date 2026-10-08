"use client";

import { useEffect, useMemo, useState } from "react";
import { computeTeamStartNotes, summarizeTeamNotes, type TeamStartNotes } from "@/lib/teamNotes";
import TeamNotesTable from "@/components/TeamNotesTable";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  movements: { id: string; apparatus: string; evolution: string }[];
}


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

  const table = useMemo(() => (data ? summarizeTeamNotes(data) : null), [data]);

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
        <TeamNotesTable data={data} table={table} />
      )}
    </div>
  );
}
