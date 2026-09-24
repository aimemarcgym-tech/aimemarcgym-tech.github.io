"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import calendrierData from "@/regulation/data/calendrier.json";
import TeamCalendarChecker from "@/components/TeamCalendarChecker";

function FiliereBadges({ fj, fn }: { fj: boolean; fn: boolean }) {
  return (
    <span className="ml-1.5 inline-flex gap-1 align-middle">
      {fj && <span className="rounded-full border border-yellow-400/40 bg-yellow-400/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-300">FJ</span>}
      {fn && <span className="rounded-full border border-sky-400/40 bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">FN</span>}
    </span>
  );
}

export default function CalendrierPage() {
  const { departements, saison, source, note } = calendrierData;
  const [groupeFilter, setGroupeFilter] = useState<string>("all");

  const groupes = useMemo(() => {
    const set = new Set(departements.map((d) => d.groupe));
    return Array.from(set).sort();
  }, [departements]);

  const filteredDepartements = useMemo(() => {
    if (groupeFilter === "all") return departements;
    return departements.filter((d) => d.groupe === groupeFilter);
  }, [departements, groupeFilter]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Calendrier des compétitions</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            GAF — Saison {saison} — {source}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10 space-y-8">
        <div className="rounded-xl border border-border-strong bg-surface-alt/50 p-4 text-sm text-muted">{note}</div>

        <TeamCalendarChecker />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGroupeFilter("all")}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              groupeFilter === "all"
                ? "border-border-strong bg-surface-alt text-white"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Tous les groupes
          </button>
          {groupes.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupeFilter(g)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                groupeFilter === g
                  ? "border-border-strong bg-surface-alt text-white"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <section className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-alt text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Département</th>
                <th className="px-4 py-3 font-semibold">Phases départementales</th>
                <th className="px-4 py-3 font-semibold">Phases inter-départementales / régionales</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartements.map((dep) => (
                <tr key={`${dep.groupe}-${dep.num}`} className="border-t border-border-subtle align-top">
                  <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    {dep.num} — {dep.name}
                    <div className="text-xs font-normal text-muted">{dep.region}</div>
                  </td>
                  <td className="px-4 py-3">
                    {dep.departemental.length === 0 ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      <ul className="space-y-2">
                        {dep.departemental.map((entry, i) => (
                          <li key={i} className="text-xs">
                            <span className="whitespace-pre-line font-medium text-foreground">{entry.dateLieu || "Date/lieu non précisé"}</span>
                            <FiliereBadges fj={entry.fj} fn={entry.fn} />
                            <div className="whitespace-pre-line text-muted">{entry.niveau}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {dep.regional.length === 0 ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      <ul className="space-y-2">
                        {dep.regional.map((entry, i) => (
                          <li key={i} className="text-xs">
                            <span className="whitespace-pre-line font-medium text-foreground">{entry.dateLieu || "Date/lieu non précisé"}</span>
                            <FiliereBadges fj={entry.fj} fn={entry.fn} />
                            <div className="whitespace-pre-line text-muted">{entry.niveau}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
