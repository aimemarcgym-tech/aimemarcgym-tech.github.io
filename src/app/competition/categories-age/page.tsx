import Link from "next/link";
import categoriesData from "@/regulation/data/categories-age.json";
import TeamCategoryChecker from "@/components/TeamCategoryChecker";

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

export default function CategoriesAgePage() {
  const { niveaux, ageAnnee, regles, saison, source } = categoriesData;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Catégories d&apos;âges</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            GAF — Saison {saison} — {source}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10 space-y-8">
        <section className="flex flex-wrap gap-3 text-xs">
          {Object.entries(FILIERE_LABEL).map(([key, label]) => (
            <span key={key} className={`rounded-full border px-3 py-1 font-medium ${FILIERE_STYLE[key]}`}>
              {label}
            </span>
          ))}
        </section>

        <TeamCategoryChecker />

        <section className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-alt text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Évolution</th>
                <th className="px-4 py-3 font-semibold">Format</th>
                <th className="px-4 py-3 font-semibold">Catégories d&apos;âges possibles</th>
              </tr>
            </thead>
            <tbody>
              {niveaux.map((niveau) => (
                <tr key={niveau.evolution} className="border-t border-border-subtle">
                  <td className="px-4 py-3 font-semibold text-foreground align-top">{niveau.evolution}</td>
                  <td className="px-4 py-3 text-muted align-top whitespace-nowrap">{niveau.format}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {niveau.categories.map((cat, i) => (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Correspondance âge / année de naissance</h2>
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[720px] border-collapse text-center text-xs">
              <thead>
                <tr className="bg-surface-alt text-muted">
                  {ageAnnee.map((a) => (
                    <th key={a.ans} className="px-2 py-2 font-semibold">
                      {a.ans} ans
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border-subtle text-foreground">
                  {ageAnnee.map((a) => (
                    <td key={a.ans} className="px-2 py-2">
                      {a.annee}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border-strong bg-surface-alt/50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Règles de composition d&apos;équipe</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            {regles.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
