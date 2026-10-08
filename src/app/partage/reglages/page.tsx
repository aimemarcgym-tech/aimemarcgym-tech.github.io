"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type EquipmentShareData, type ShareDoc } from "@/lib/shares";

function Card({ title, settings }: { title: string; settings: EquipmentShareData["gymnasts"][number]["settings"] }) {
  const lines: { label: string; value?: string; unit: string }[] = [
    { label: "Écart des barres asymétriques", value: settings.ecartBarres, unit: "cm" },
    { label: "Tremplin : distance à la table de saut", value: settings.tremplinCm, unit: "cm" },
    { label: "Tremplin : distance à la table de saut", value: settings.tremplinPas, unit: "pas" },
  ];
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-3">
      <h2 className="mb-2 text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{l.label}</span>
            <span className="text-lg font-semibold text-foreground">
              {l.value ? `${l.value} ${l.unit}` : <span className="text-sm font-normal text-muted">non renseigné</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Page publique des réglages du matériel d'une équipe (par gymnaste), en lecture seule et sans compte.
function ReglagesPartagePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);

  useEffect(() => {
    if (!id) {
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "equipment" ? s : "not-found"))
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

  const data = share.data as EquipmentShareData;
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Réglages du matériel</span>
          </h1>
          <p className="text-sm text-muted">
            {data.team} ({data.club})
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-3 px-6 py-8">
        {data.gymnasts.map((g, i) => (
          <Card key={i} title={g.name} settings={g.settings} />
        ))}
        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function ReglagesPartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ReglagesPartagePageInner />
    </Suspense>
  );
}
