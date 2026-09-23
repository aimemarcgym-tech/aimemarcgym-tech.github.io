"use client";

import { useEffect, useMemo, useState } from "react";
import { getGymnasts } from "@/lib/data";
import categoriesData from "@/regulation/data/categories-age.json";

type Gymnast = Awaited<ReturnType<typeof getGymnasts>>[number];

const FILIERE_LABEL: Record<string, string> = {
  jeune: "Filière jeune",
  groupe: "Finalité groupe",
  nationale: "Filière nationale",
};

const FILIERE_STYLE: Record<string, string> = {
  jeune: "bg-yellow-400/15 text-yellow-300 border-yellow-400/40",
  groupe: "bg-orange-400/15 text-orange-300 border-orange-400/40",
  nationale: "bg-sky-400/15 text-sky-300 border-sky-400/40",
};

// "2019/2017" -> {min: 2017, max: 2019} ; "2015 et avant" -> {min: -Infinity, max: 2015}
function parseAnnees(annees: string): { min: number; max: number } {
  if (annees.includes("et avant")) {
    return { min: -Infinity, max: parseInt(annees, 10) };
  }
  const parts = annees.split("/").map((s) => parseInt(s.trim(), 10));
  return { min: Math.min(...parts), max: Math.max(...parts) };
}

export default function TeamCategoryChecker() {
  const [gymnasts, setGymnasts] = useState<Gymnast[] | null>(null);
  const [teamKey, setTeamKey] = useState("");

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

  const evolutions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of members) {
      for (const m of g.movements) {
        counts.set(m.evolution, (counts.get(m.evolution) ?? 0) + 1);
      }
    }
    return Array.from(counts.keys()).sort();
  }, [members]);

  const birthYears = members.filter((g) => g.birthYear != null).map((g) => g.birthYear as number);
  const missingBirthYear = members.some((g) => g.birthYear == null);

  return (
    <div className="max-w-xl rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Vérifier une équipe</h2>

      {!gymnasts ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune équipe trouvée. Renseignez le champ « Équipe » sur une gymnaste depuis l&apos;accueil.
        </p>
      ) : (
        <>
          <select
            value={teamKey}
            onChange={(e) => setTeamKey(e.target.value)}
            className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
          >
            <option value="">Sélectionner une équipe…</option>
            {teams.map((t) => (
              <option key={t.key} value={t.key}>
                {t.team} ({t.club})
              </option>
            ))}
          </select>

          {teamKey && (
            <div className="mt-4 space-y-4">
              <ul className="space-y-1 text-sm text-muted">
                {members.map((g) => (
                  <li key={g.id} className="flex justify-between gap-2">
                    <span className="text-foreground">
                      {g.firstName} {g.lastName}
                    </span>
                    <span>{g.birthYear ?? "année manquante"}</span>
                  </li>
                ))}
              </ul>

              {missingBirthYear && (
                <p className="text-xs text-warning">
                  ⚠ Année de naissance manquante pour au moins une gymnaste — complétez sa fiche pour un résultat fiable.
                </p>
              )}

              {evolutions.length === 0 ? (
                <p className="text-sm text-muted">
                  Aucun mouvement créé pour cette équipe — impossible de déterminer l&apos;évolution.
                </p>
              ) : birthYears.length === 0 ? (
                <p className="text-sm text-muted">Aucune année de naissance renseignée pour cette équipe.</p>
              ) : (
                evolutions.map((evolution) => {
                  const niveau = categoriesData.niveaux.find((n) => n.evolution === evolution);
                  if (!niveau) return null;
                  const matches = niveau.categories.filter((cat) => {
                    const { min, max } = parseAnnees(cat.annees);
                    return birthYears.every((y) => y >= min && y <= max);
                  });
                  return (
                    <div key={evolution}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                        Évolution {evolution}
                      </p>
                      {matches.length === 0 ? (
                        <p className="text-sm text-warning">
                          ⚠ Aucune catégorie ne correspond à l&apos;écart d&apos;âge de cette équipe pour cette évolution.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {matches.map((cat, i) => (
                            <span
                              key={i}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${FILIERE_STYLE[cat.filiere]}`}
                              title={FILIERE_LABEL[cat.filiere]}
                            >
                              {cat.ans}
                              <span className="ml-1 opacity-70">({cat.annees})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
