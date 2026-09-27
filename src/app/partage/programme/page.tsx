"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type TrainingJournalShareData, type ShareDoc } from "@/lib/shares";

const PROGRAM_LABELS: Record<string, string> = {
  TECHNIQUE: "Programme technique",
  PHYSIQUE: "Programme physique",
};

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function ProgrammePartagePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);

  useEffect(() => {
    if (!id) {
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "trainingJournal" ? s : "not-found"))
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

  const data = share.data as TrainingJournalShareData;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">{PROGRAM_LABELS[data.programType] ?? data.programType}</span>
          </h1>
          <p className="text-sm text-muted">{data.targetLabel}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-6 py-8">
        {data.attachment && (
          <a
            href={`data:${data.attachment.mimeType};base64,${data.attachment.dataBase64}`}
            download={data.attachment.fileName}
            className="flex items-center gap-2 rounded-lg border border-accent-solid/40 bg-accent-from/10 p-3 text-sm font-medium accent-gradient-text"
          >
            📎 Télécharger « {data.attachment.fileName} »
          </a>
        )}

        {data.sessions.length === 0 ? (
          <p className="text-sm text-muted">Aucune séance enregistrée.</p>
        ) : (
          data.sessions.map((s, i) => (
            <div key={i} className="rounded-lg border border-border-subtle bg-surface p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {formatDate(s.date)}
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{s.content}</p>
            </div>
          ))
        )}

        <p className="mt-6 text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function ProgrammePartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProgrammePartagePageInner />
    </Suspense>
  );
}
