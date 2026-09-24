"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getRegulation, getAvailableApparatuses } from "@/regulation/loader";
import { palierRank, type Palier } from "@/regulation/types";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

function palierLabel(p: Palier) {
  if (p === "BASE") return "Base";
  if (p === "NOMADE") return "Nomade";
  if (p === "PREREQUIS") return "Prérequis";
  return p;
}

function palierBadgeClasses(p: Palier) {
  if (p === "PREREQUIS") return "border-border-strong text-muted";
  if (p === "BASE") return "border-sky-400/40 bg-sky-400/10 text-sky-300";
  if (p === "NOMADE") return "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";
  return "border-accent-solid/50 bg-accent-from/10 text-white";
}

export default function TablePage() {
  const apparatuses = getAvailableApparatuses();
  const [apparatus, setApparatus] = useState(apparatuses[0]);

  const regulation = useMemo(() => getRegulation(apparatus), [apparatus]);

  const archesWithElements = useMemo(() => {
    return regulation.arches.map((arche) => {
      const elements = regulation.elements
        .filter((e) => e.archeId === arche.id)
        .slice()
        .sort((a, b) => {
          const branchCmp = (a.branch ?? "").localeCompare(b.branch ?? "");
          if (branchCmp !== 0) return branchCmp;
          const rankCmp = palierRank(a.palier) - palierRank(b.palier);
          if (rankCmp !== 0) return rankCmp;
          return a.code.localeCompare(b.code);
        });
      return { arche, elements };
    });
  }, [regulation]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Table des éléments</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tous les éléments de chaque arche, par agrès, avec leur code et leur palier (P1 à P7).
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10 space-y-6">
        <div className="flex flex-wrap gap-2">
          {apparatuses.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setApparatus(a)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                apparatus === a
                  ? "border-border-strong bg-surface-alt text-white"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {APPARATUS_LABELS[a] ?? a}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {archesWithElements.map(({ arche, elements }) => (
            <section key={arche.id} className="overflow-hidden rounded-xl border border-border-subtle">
              <div className="border-b border-border-subtle bg-surface-alt/50 px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {arche.name}
                  {arche.subtitle && <span className="ml-1.5 font-normal text-muted">— {arche.subtitle}</span>}
                </h2>
                <p className="text-xs text-muted">
                  {arche.category} · page {arche.sourcePage}
                  {arche.dataQuality === "a_verifier" && (
                    <span className="ml-1.5 text-warning">⚠ à confirmer</span>
                  )}
                </p>
              </div>
              {elements.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted">Aucun élément recensé pour cette arche.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-surface-alt text-left text-xs uppercase tracking-wide text-muted">
                        <th className="px-4 py-2 font-semibold">Code</th>
                        <th className="px-4 py-2 font-semibold">Nom</th>
                        <th className="px-4 py-2 font-semibold">Branche</th>
                        <th className="px-4 py-2 font-semibold">Palier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elements.map((el) => (
                        <tr key={el.code} className="border-t border-border-subtle">
                          <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-foreground">{el.code}</td>
                          <td className="px-4 py-2 text-foreground">
                            {el.name}
                            {!el.verified && <span className="ml-1.5 text-xs text-warning">⚠ à confirmer</span>}
                          </td>
                          <td className="px-4 py-2 text-xs text-muted">{el.branch ?? "—"}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${palierBadgeClasses(el.palier)}`}
                            >
                              {palierLabel(el.palier)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
