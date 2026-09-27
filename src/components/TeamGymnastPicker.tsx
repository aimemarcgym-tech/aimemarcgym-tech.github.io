"use client";

import { useEffect, useMemo, useState } from "react";
import { getGymnasts, type TrainingTarget } from "@/lib/data";
import TrainingJournal from "@/components/TrainingJournal";

type Gymnast = Awaited<ReturnType<typeof getGymnasts>>[number];
type Selection = { target: TrainingTarget; label: string };

export default function TeamGymnastPicker({
  title,
  programType,
}: {
  title: string;
  programType: "TECHNIQUE" | "PHYSIQUE";
}) {
  const [gymnasts, setGymnasts] = useState<Gymnast[] | null>(null);
  const [teamKey, setTeamKey] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);

  useEffect(() => {
    getGymnasts().then(setGymnasts);
  }, []);

  const teams = useMemo(() => {
    if (!gymnasts) return [];
    const map = new Map<string, { club: string; team: string }>();
    for (const g of gymnasts) {
      if (!g.team) continue;
      const club = g.club?.name ?? "Sans club";
      const key = `${club}::${g.team}`;
      if (!map.has(key)) map.set(key, { club, team: g.team });
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [gymnasts]);

  const members = useMemo(() => {
    if (!gymnasts || !teamKey) return [];
    const selected = teams.find((t) => t.key === teamKey);
    if (!selected) return [];
    return gymnasts.filter((g) => (g.club?.name ?? "Sans club") === selected.club && g.team === selected.team);
  }, [gymnasts, teamKey, teams]);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>

      {!gymnasts ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune équipe trouvée. Renseignez le champ « Équipe » sur une gymnaste depuis l&apos;accueil.
        </p>
      ) : (
        <select
          value={teamKey}
          onChange={(e) => {
            setTeamKey(e.target.value);
            setSelection(null);
          }}
          className="w-full max-w-xs rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          <option value="">Sélectionner une équipe…</option>
          {teams.map((t) => (
            <option key={t.key} value={t.key}>
              {t.team} ({t.club})
            </option>
          ))}
        </select>
      )}

      {teamKey && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(() => {
            const selectedTeam = teams.find((t) => t.key === teamKey);
            const teamLabel = selectedTeam ? `Toute l'équipe ${selectedTeam.team} (${selectedTeam.club})` : "Toute l'équipe";
            const isTeamSelected = selection?.target.kind === "team" && selection.target.key === teamKey;
            return (
              <button
                type="button"
                onClick={() =>
                  setSelection((cur) =>
                    cur?.target.kind === "team" && cur.target.key === teamKey
                      ? null
                      : { target: { kind: "team", key: teamKey }, label: teamLabel }
                  )
                }
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  isTeamSelected
                    ? "border-accent-solid bg-accent-from/10 text-white"
                    : "border-accent-solid/60 bg-surface-alt text-foreground hover:bg-accent-from/10"
                }`}
              >
                ★ Toute l&apos;équipe
              </button>
            );
          })()}
          {members.map((g) => {
            const isSelected = selection?.target.kind === "gymnast" && selection.target.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() =>
                  setSelection((cur) =>
                    cur?.target.kind === "gymnast" && cur.target.id === g.id
                      ? null
                      : { target: { kind: "gymnast", id: g.id }, label: `${g.firstName} ${g.lastName}` }
                  )
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-accent-solid bg-accent-from/10 text-white"
                    : "border-border-strong bg-surface-alt text-foreground hover:border-accent-solid hover:text-white"
                }`}
              >
                {g.firstName} {g.lastName}
              </button>
            );
          })}
        </div>
      )}

      {selection && <TrainingJournal target={selection.target} targetLabel={selection.label} type={programType} />}
    </div>
  );
}
