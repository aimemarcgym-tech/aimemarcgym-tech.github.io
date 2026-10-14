"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAvailableApparatuses, getRegulation } from "@/regulation/loader";
import { getExemple } from "@/lib/exemples";
import { champ } from "@/lib/styles";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

export default function ExemplesPage() {
  const apparatuses = getAvailableApparatuses();
  const [apparatus, setApparatus] = useState(apparatuses[0]);
  const evolutions = useMemo(() => [...getRegulation(apparatus).evolutions].sort((a, b) => a.ordre - b.ordre), [apparatus]);
  const [evolutionId, setEvolutionId] = useState("A1");
  const exemple = getExemple(apparatus, evolutionId);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Exemples de mouvements</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Un mouvement type par niveau et par agrès, construit pour viser la note de départ maximale.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 px-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Niveau</span>
            <select value={evolutionId} onChange={(e) => setEvolutionId(e.target.value)} className={champ} aria-label="Niveau">
              {evolutions.map((e) => (
                <option key={e.id} value={e.id}>
                  Évolution {e.id}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Agrès</span>
            <select value={apparatus} onChange={(e) => setApparatus(e.target.value)} className={champ} aria-label="Agrès">
              {apparatuses.map((a) => (
                <option key={a} value={a}>
                  {APPARATUS_LABELS[a] ?? a}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className="rounded-xl border border-border-subtle bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            {APPARATUS_LABELS[apparatus] ?? apparatus} — Évolution {evolutionId}
          </h2>
          {exemple ? (
            <p className="text-sm text-foreground">{exemple.titre}</p>
          ) : (
            <p className="text-sm text-muted">Aucun exemple pour l&apos;instant : ils seront ajoutés prochainement.</p>
          )}
        </section>
      </main>
    </div>
  );
}
