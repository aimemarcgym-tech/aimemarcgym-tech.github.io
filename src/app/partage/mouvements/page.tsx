"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type MovementsAllShareData, type ShareDoc } from "@/lib/shares";
import SharedMovementView, { movementHeaderSubtitle } from "@/components/SharedMovementView";

function MouvementsPartagePageInner() {
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
      .then((s) => setShare(s && s.type === "movementsAll" ? s : "not-found"))
      .catch(() => setShare("not-found"));
  }, [id]);

  if (share === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-muted">Chargement…</p>
      </main>
    );
  }

  if (share === "not-found") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-muted">Ce lien de partage n&apos;existe pas ou plus.</p>
      </main>
    );
  }

  const data = share.data as MovementsAllShareData;
  const current = data.movements[active] ?? data.movements[0];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">
              {data.gymnastFirstName} {data.gymnastLastName}
            </span>
          </h1>
          <p className="text-sm text-muted">Mouvements</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {data.movements.length === 0 ? (
          <p className="text-sm text-muted">Aucun mouvement.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1">
              {data.movements.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`min-w-[7rem] flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                    i === active ? "accent-gradient text-white" : "text-muted hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {current && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{current.label}</h2>
                  <p className="text-sm text-muted">{movementHeaderSubtitle(current)}</p>
                </div>
                <SharedMovementView data={current} />
              </>
            )}
          </>
        )}
        <p className="text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function MouvementsPartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <MouvementsPartagePageInner />
    </Suspense>
  );
}
