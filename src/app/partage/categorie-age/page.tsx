"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type ShareDoc, type TeamCategoryShareData } from "@/lib/shares";

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

function CategorieAgePartagePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);

  useEffect(() => {
    if (!id) {
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "teamCategory" ? s : "not-found"))
      .catch(() => setShare("not-found"));
  }, [id]);

  if (share === null) {
    return (
      <main className="mx-auto max-w-xl px-6 py-10">
        <p className="text-sm text-muted">Chargement…</p>
      </main>
    );
  }

  if (share === "not-found") {
    return (
      <main className="mx-auto max-w-xl px-6 py-10">
        <p className="text-sm text-muted">Ce lien de partage n&apos;existe pas ou plus.</p>
      </main>
    );
  }

  const data = share.data as TeamCategoryShareData;

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-xl px-6 py-8">
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <h1 className="mb-3 text-sm font-semibold text-foreground">Vérifier une équipe</h1>
          <p className="mb-3 text-sm text-foreground">
            {data.team} ({data.club})
          </p>
          <ul className="space-y-1 text-sm text-muted">
            {data.members.map((g, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="text-foreground">
                  {g.firstName} {g.lastName}
                </span>
                <span>{g.birthYear ?? "année manquante"}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-4">
            {data.evolutions.map((ev) => (
              <div key={ev.evolution}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Évolution {ev.evolution}
                </p>
                {ev.categories.length === 0 ? (
                  <p className="text-sm text-warning">
                    ⚠ Aucune catégorie ne correspond à l&apos;écart d&apos;âge de cette équipe pour cette évolution.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ev.categories.map((cat, i) => (
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
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function CategorieAgePartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CategorieAgePartagePageInner />
    </Suspense>
  );
}
