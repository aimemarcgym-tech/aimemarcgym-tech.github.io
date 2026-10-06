"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type ShareDoc, type TeamAllShareData } from "@/lib/shares";
import SharedMovementView, { movementHeaderSubtitle } from "@/components/SharedMovementView";

type Section = "ordres" | "mouvements";

function PassageOrders({ data }: { data: TeamAllShareData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.passageOrder.apparatuses.map((a) => (
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
    </div>
  );
}

function Movements({ data }: { data: TeamAllShareData }) {
  const [g, setG] = useState(0);
  const [m, setM] = useState(0);
  const gymnast = data.gymnasts[g] ?? data.gymnasts[0];
  const movement = gymnast?.movements[m] ?? gymnast?.movements[0];

  if (!gymnast) return <p className="text-sm text-muted">Aucune gymnaste.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {data.gymnasts.map((x, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setG(i);
              setM(0);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              i === g ? "accent-gradient border-transparent text-white" : "border-border-strong text-foreground"
            }`}
          >
            {x.gymnastFirstName} {x.gymnastLastName}
          </button>
        ))}
      </div>
      {gymnast.movements.length === 0 ? (
        <p className="text-sm text-muted">Aucun mouvement pour cette gymnaste.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1">
            {gymnast.movements.map((x, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setM(i)}
                className={`min-w-[7rem] flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                  i === m ? "accent-gradient text-white" : "text-muted hover:text-foreground"
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
          {movement && (
            <>
              <div>
                <h2 className="text-lg font-bold text-foreground">{movement.label}</h2>
                <p className="text-sm text-muted">{movementHeaderSubtitle(movement)}</p>
              </div>
              <SharedMovementView data={movement} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function EquipePartagePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);
  const [section, setSection] = useState<Section>("ordres");

  useEffect(() => {
    if (!id) {
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "teamAll" ? s : "not-found"))
      .catch(() => setShare("not-found"));
  }, [id]);

  if (share === null) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-muted">Chargement…</p>
      </main>
    );
  }

  if (share === "not-found") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-muted">Ce lien de partage n&apos;existe pas ou plus.</p>
      </main>
    );
  }

  const data = share.data as TeamAllShareData;
  const tabs: { id: Section; label: string }[] = [
    { id: "ordres", label: "Ordres de passage" },
    { id: "mouvements", label: "Mouvements" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">{data.team}</span>
          </h1>
          <p className="text-sm text-muted">{data.club}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id)}
              className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                section === t.id ? "accent-gradient text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {section === "ordres" && <PassageOrders data={data} />}
        {section === "mouvements" && <Movements data={data} />}

        <p className="text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function EquipePartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <EquipePartagePageInner />
    </Suspense>
  );
}
