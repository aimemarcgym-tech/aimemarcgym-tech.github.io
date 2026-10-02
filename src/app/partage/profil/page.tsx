"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type TechProfileShareData, type ShareDoc } from "@/lib/shares";

function ProfilPartagePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!id) {
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "techProfile" ? s : "not-found"))
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

  const data = share.data as TechProfileShareData;
  const current = data.apparatuses[active] ?? data.apparatuses[0];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">
              {data.gymnastFirstName} {data.gymnastLastName}
            </span>
          </h1>
          <p className="text-sm text-muted">Éléments maîtrisés par agrès</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1">
          {data.apparatuses.map((a, i) => (
            <button
              key={a.apparatus}
              onClick={() => setActive(i)}
              className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                i === active ? "accent-gradient text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {a.apparatusLabel}
            </button>
          ))}
        </div>

        {current && (
          <section className="rounded-lg border border-border-subtle bg-surface p-4">
            {current.masteredElements.length === 0 ? (
              <p className="text-sm text-muted">Aucun élément maîtrisé renseigné pour cet agrès.</p>
            ) : (
              <ul className="space-y-1.5">
                {current.masteredElements.map((e) => (
                  <li
                    key={e.code}
                    className="rounded-lg border border-border-subtle bg-surface-alt/40 p-2 text-sm text-foreground"
                  >
                    <span className="mr-2 text-xs text-muted">{e.code}</span>
                    {e.name}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function ProfilPartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProfilPartagePageInner />
    </Suspense>
  );
}
