"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type MovementShareData, type ShareDoc } from "@/lib/shares";
import type { Diagnostic } from "@/engine/composition";
import type { SautDiagnostic } from "@/engine/saut";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

const PALIER_LABEL: Record<string, string> = {
  PREREQUIS: "Prérequis",
  PR1: "PR1",
  PR2: "PR2",
  PR3: "PR3",
  BASE: "Base",
  NOMADE: "Nomade",
};

function palierLabel(p: string) {
  return PALIER_LABEL[p] ?? p;
}

function isSautDiagnostic(d: Diagnostic | SautDiagnostic): d is SautDiagnostic {
  return "sautsRequired" in d;
}

function CheckLine({ status, label }: { status: "OK" | "MANQUANT" | "A_CONFIRMER"; label: string }) {
  const color = status === "OK" ? "text-success" : status === "A_CONFIRMER" ? "text-warning" : "text-danger";
  const icon = status === "OK" ? "✓" : status === "A_CONFIRMER" ? "⚠" : "✕";
  return (
    <p className={`text-sm ${color}`}>
      {icon} {label}
    </p>
  );
}

function MovementPartagePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);

  useEffect(() => {
    if (!id) {
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "movement" ? s : "not-found"))
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

  const data = share.data as MovementShareData;
  const diagnostic = data.diagnostic;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <p className="text-sm text-muted">
            {data.gymnastFirstName} {data.gymnastLastName}
          </p>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">{data.label}</span>
          </h1>
          <p className="text-sm text-muted">
            {APPARATUS_LABELS[data.apparatus] ?? data.apparatus} · Évolution {data.evolutionId}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Éléments</h2>
          {data.elements.length === 0 ? (
            <p className="text-sm text-muted">Aucun élément.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.elements.map((el, i) => (
                <li key={`${el.code}-${i}`} className="text-sm text-foreground">
                  <span className="mr-1.5 rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] text-muted">
                    {palierLabel(el.palier)}
                  </span>
                  {el.name}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Analyse</h2>

          {isSautDiagnostic(diagnostic) ? (
            <>
              <p className={`text-sm ${diagnostic.troncCommunOk ? "text-success" : "text-danger"}`}>
                {diagnostic.troncCommunOk ? "✓" : "✕"} {diagnostic.troncCommunMessage}
              </p>
              {diagnostic.sautsRequired >= 2 && (
                <p className={`mt-1 text-sm ${diagnostic.famillesDifferentes ? "text-success" : "text-muted"}`}>
                  {diagnostic.famillesDifferentes ? "✓" : "○"} 2 sauts de familles de 1<sup>er</sup> envol différentes
                </p>
              )}
              <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Valorisation</h3>
              <ul className="space-y-1">
                {(diagnostic.valorisations.some((v) => v.status === "OK")
                  ? diagnostic.valorisations.filter((v) => v.status === "OK")
                  : diagnostic.valorisations
                ).map((v) => (
                  <CheckLine key={v.id} status={v.status} label={v.label} />
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className={`text-sm ${diagnostic.troncCommun.complete ? "text-success" : "text-danger"}`}>
                {diagnostic.troncCommun.complete ? "✓ Tronc commun complet" : "✕ Tronc commun incomplet"}
              </p>
              <ul className="mt-1 space-y-1">
                {diagnostic.troncCommun.exigences.map((ex) => (
                  <CheckLine key={ex.id} status={ex.status} label={ex.label} />
                ))}
              </ul>
              <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Valorisations ({Math.min(diagnostic.valorisations.validatedCount, diagnostic.valorisations.choisir)}/
                {diagnostic.valorisations.choisir} parmi {diagnostic.valorisations.parmi})
              </h3>
              <ul className="space-y-1">
                {diagnostic.valorisations.results.map((v) => (
                  <CheckLine
                    key={v.id}
                    status={v.status}
                    label={`${v.label}${v.pondere ? " ★" : ""}${v.points ? ` (+${v.points} pts)` : ""}`}
                  />
                ))}
              </ul>
            </>
          )}

          <div className="mt-4 accent-gradient rounded px-4 py-3 text-white shadow-lg shadow-accent-from/20">
            <div className="text-xs uppercase text-white/70">Note de départ</div>
            <div className="text-3xl font-bold">{diagnostic.noteDepart.toFixed(1)}</div>
          </div>
        </section>

        <p className="text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function MovementPartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <MovementPartagePageInner />
    </Suspense>
  );
}
