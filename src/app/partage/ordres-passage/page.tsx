"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type PassageOrderAllShareData, type ShareDoc } from "@/lib/shares";

function OrdresPassagePartagePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);

  useEffect(() => {
    if (!id) {
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "passageOrderAll" ? s : "not-found"))
      .catch(() => setShare("not-found"));
  }, [id]);

  if (share === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-muted">Chargement…</p>
      </main>
    );
  }

  if (share === "not-found") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-muted">Ce lien de partage n&apos;existe pas ou plus.</p>
      </main>
    );
  }

  const data = share.data as PassageOrderAllShareData;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Ordres de passage</span>
          </h1>
          <p className="text-sm text-muted">
            {data.team} ({data.club})
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {data.apparatuses.map((a) => (
          <section key={a.apparatus} className="rounded-lg border border-border-subtle bg-surface p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{a.apparatusLabel}</h2>
            {a.gymnasts.length === 0 ? (
              <p className="text-sm text-muted">Aucune gymnaste dans cette équipe.</p>
            ) : (
              <ol className="space-y-1.5">
                {a.gymnasts.map((g, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-alt/40 p-2 text-sm"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[11px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <span className="text-foreground">
                      {g.firstName} {g.lastName}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}

        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function OrdresPassagePartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <OrdresPassagePartagePageInner />
    </Suspense>
  );
}
