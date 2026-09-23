"use client";

import { useEffect, useMemo, useState } from "react";
import { getGymnasts } from "@/lib/data";
import calendrierData from "@/regulation/data/calendrier.json";

type Gymnast = Awaited<ReturnType<typeof getGymnasts>>[number];
type Entry = { dateLieu: string; niveau: string; fj: boolean; fn: boolean };
type Department = (typeof calendrierData.departements)[number];

// Un département "rattaché au X" n'a pas ses propres dates : ses compétitions
// se déroulent avec celles du département X. On suit la référence pour
// afficher les vraies dates plutôt que le seul texte "rattaché au X".
function parseRattache(dateLieu: string): string | null {
  const m = dateLieu.match(/rattach[ée]e?\s*(?:au)?\s*(\d+)/i);
  return m ? m[1] : null;
}

function resolveEntries(
  entries: Entry[],
  kind: "departemental" | "regional",
  allDepartments: Department[],
  viaChain: string[] = []
): { entry: Entry; via: string[] }[] {
  const result: { entry: Entry; via: string[] }[] = [];
  for (const entry of entries) {
    const targetNum = parseRattache(entry.dateLieu);
    if (targetNum && !viaChain.includes(targetNum)) {
      const target = allDepartments.find((d) => d.num === targetNum);
      if (target) {
        const targetEntries = kind === "departemental" ? target.departemental : target.regional;
        result.push(...resolveEntries(targetEntries, kind, allDepartments, [...viaChain, targetNum]));
        continue;
      }
    }
    result.push({ entry, via: viaChain });
  }
  return result;
}

// Règle des catégories d'âges : la/le gym la/le plus jeune détermine la
// filière (7-10 ans -> jeune, 11 ans et + -> nationale). Année 2016 = 10 ans,
// 2015 = 11 ans cette saison (voir categories-age.json / ageAnnee).
function filiereFromBirthYears(birthYears: number[]): "jeune" | "nationale" | null {
  if (birthYears.length === 0) return null;
  const youngestBirthYear = Math.max(...birthYears);
  return youngestBirthYear >= 2016 ? "jeune" : "nationale";
}

function matchesFiliere(entry: Entry, filiere: "jeune" | "nationale" | null): boolean {
  if (!filiere) return true;
  if (!entry.fj && !entry.fn) return true; // non précisé -> on ne l'exclut pas
  return filiere === "jeune" ? entry.fj : entry.fn;
}

function EntryRow({ entry, highlight, via }: { entry: Entry; highlight: boolean; via?: string }) {
  return (
    <li className={`rounded-lg border px-3 py-2 text-sm ${highlight ? "border-accent-solid/50 bg-accent-solid/10" : "border-border-subtle bg-surface-alt/40 opacity-60"}`}>
      {via && <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-accent-solid">→ Rattaché à {via}</div>}
      <div className="whitespace-pre-line font-medium text-foreground">{entry.dateLieu || "Date/lieu non précisé"}</div>
      <div className="mt-0.5 whitespace-pre-line text-xs text-muted">{entry.niveau}</div>
      <div className="mt-1 flex gap-1.5">
        {entry.fj && <span className="rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2 py-0.5 text-[10px] font-medium text-yellow-300">FJ</span>}
        {entry.fn && <span className="rounded-full border border-sky-400/40 bg-sky-400/15 px-2 py-0.5 text-[10px] font-medium text-sky-300">FN</span>}
        {!entry.fj && !entry.fn && <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] font-medium text-muted">non précisé</span>}
      </div>
    </li>
  );
}

export default function TeamCalendarChecker() {
  const [gymnasts, setGymnasts] = useState<Gymnast[] | null>(null);
  const [teamKey, setTeamKey] = useState("");
  const [dept, setDept] = useState("");

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

  const birthYears = members.filter((g) => g.birthYear != null).map((g) => g.birthYear as number);
  const filiere = filiereFromBirthYears(birthYears);

  const department = useMemo(() => {
    const num = dept.trim();
    if (!num) return null;
    return calendrierData.departements.find((d) => d.num === num) ?? undefined;
  }, [dept]);

  const departmentName = (num: string) => calendrierData.departements.find((d) => d.num === num)?.name ?? num;

  const resolvedDepartemental = useMemo(() => {
    if (!department) return [];
    return resolveEntries(department.departemental, "departemental", calendrierData.departements);
  }, [department]);

  const resolvedRegional = useMemo(() => {
    if (!department) return [];
    return resolveEntries(department.regional, "regional", calendrierData.departements);
  }, [department]);

  return (
    <div className="max-w-2xl rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Vérifier une équipe</h2>

      {!gymnasts ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune équipe trouvée. Renseignez le champ « Équipe » sur une gymnaste depuis l&apos;accueil.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Équipe</label>
            <select
              value={teamKey}
              onChange={(e) => setTeamKey(e.target.value)}
              className="rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
            >
              <option value="">Sélectionner une équipe…</option>
              {teams.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.team} ({t.club})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">N° de département</label>
            <input
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              placeholder="Ex : 91"
              inputMode="numeric"
              className="w-28 rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
            />
          </div>
        </div>
      )}

      {teamKey && (
        <div className="mt-4 space-y-3">
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
          {filiere && (
            <p className="text-xs text-muted">
              Filière déterminée pour cette équipe :{" "}
              <span className="font-semibold text-foreground">{filiere === "jeune" ? "Filière jeune (FJ)" : "Filière nationale (FN)"}</span>
            </p>
          )}
        </div>
      )}

      {teamKey && dept.trim() && (
        <div className="mt-4">
          {department === undefined ? (
            <p className="text-sm text-warning">⚠ Département « {dept} » introuvable dans le calendrier.</p>
          ) : department ? (
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Phases départementales — {department.name} ({department.num})
                </h3>
                {resolvedDepartemental.length === 0 ? (
                  <p className="text-sm text-muted">Aucune information départementale.</p>
                ) : (
                  <ul className="space-y-2">
                    {resolvedDepartemental.map(({ entry, via }, i) => (
                      <EntryRow
                        key={i}
                        entry={entry}
                        highlight={matchesFiliere(entry, filiere)}
                        via={via.length > 0 ? departmentName(via[via.length - 1]) : undefined}
                      />
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Phases inter-départementales / régionales</h3>
                {resolvedRegional.length === 0 ? (
                  <p className="text-sm text-muted">Aucune information régionale.</p>
                ) : (
                  <ul className="space-y-2">
                    {resolvedRegional.map(({ entry, via }, i) => (
                      <EntryRow
                        key={i}
                        entry={entry}
                        highlight={matchesFiliere(entry, filiere)}
                        via={via.length > 0 ? departmentName(via[via.length - 1]) : undefined}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
