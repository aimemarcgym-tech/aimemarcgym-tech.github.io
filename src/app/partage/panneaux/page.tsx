"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type EquipmentShareData, type ShareDoc, type TeamPanelsShareData } from "@/lib/shares";
import { summarizeTeamNotes } from "@/lib/teamNotes";
import TeamNotesTable from "@/components/TeamNotesTable";

function Reglages({ settings }: { settings: EquipmentShareData["gymnasts"][number]["settings"] }) {
  const lines = [
    { label: "Écart des barres", value: settings.ecartBarres, unit: "cm" },
    { label: "Tremplin", value: settings.tremplinCm, unit: "cm" },
    { label: "Tremplin", value: settings.tremplinPas, unit: "pas" },
  ];
  return (
    <div className="space-y-1">
      {lines.map((l, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-foreground">{l.label}</span>
          <span className="font-semibold text-foreground">
            {l.value ? `${l.value} ${l.unit}` : <span className="font-normal text-muted">non renseigné</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function Contenu({ data }: { data: TeamPanelsShareData }) {
  const notes = data.notes;
  const table = useMemo(() => (notes ? summarizeTeamNotes(notes) : null), [notes]);
  const section = "rounded-lg border border-border-subtle bg-surface p-4";
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <section className={section}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Ordres de passage</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.passageOrder.apparatuses.map((a) => (
            <div key={a.apparatus}>
              <h3 className="mb-1.5 text-sm font-semibold text-foreground">{a.apparatusLabel}</h3>
              <ol className="space-y-1.5">
                {a.gymnasts.map((g, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-alt/40 p-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[11px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <span className="text-foreground">
                      {g.firstName} {g.lastName}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className={section}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Notes de départ</h2>
        {notes && table ? (
          <TeamNotesTable data={notes} table={table} />
        ) : (
          <p className="text-sm text-muted">Évolution de l&apos;équipe indéterminée : notes non calculées.</p>
        )}
      </section>

      <section className={section}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Réglages du matériel</h2>
        <div className="space-y-3">
          {[...(data.equipment.wholeTeam ? [{ name: "Toute l’équipe", settings: data.equipment.wholeTeam }] : []), ...data.equipment.gymnasts].map((g, i) => (
            <div key={i} className="rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
              <div className="mb-2 text-sm font-medium text-foreground">{g.name}</div>
              <Reglages settings={g.settings} />
            </div>
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-muted">
        Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
      </p>
    </main>
  );
}

function PanneauxPartagePageInner() {
  const id = useSearchParams().get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "teamPanels" ? s : "not-found"))
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
  const data = share.data as TeamPanelsShareData;
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Ordres de passage, notes et réglages</span>
          </h1>
          <p className="text-sm text-muted">
            {data.team} ({data.club})
          </p>
        </div>
      </header>
      <Contenu data={data} />
    </div>
  );
}

export default function PanneauxPartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PanneauxPartagePageInner />
    </Suspense>
  );
}
