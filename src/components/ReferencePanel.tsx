"use client";

import { useMemo, useState } from "react";
import { getReference } from "@/regulation/loader";

export default function ReferencePanel({ apparatus, evolutionId }: { apparatus: string; evolutionId: string }) {
  const reference = getReference(apparatus);
  const [tab, setTab] = useState<"temps" | "lexique" | "infos">("temps");

  const tempsMax = useMemo(() => {
    if (!reference) return undefined;
    return reference.tempsMax.find((t) => (t.evolutions as string[]).includes(evolutionId));
  }, [reference, evolutionId]);

  if (!reference) {
    return (
      <section className="rounded-lg border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Référence</h2>
        <p className="text-sm text-muted">Aucune donnée de référence disponible pour cet agrès.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Référence</h2>

      <div className="mb-3 flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1">
        <button
          onClick={() => setTab("temps")}
          className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
            tab === "temps" ? "accent-gradient text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Temps
        </button>
        <button
          onClick={() => setTab("lexique")}
          className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
            tab === "lexique" ? "accent-gradient text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Lexique
        </button>
        <button
          onClick={() => setTab("infos")}
          className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
            tab === "infos" ? "accent-gradient text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Infos
        </button>
      </div>

      {tab === "temps" && reference.tempsMax.length === 0 && (
        <p className="text-sm text-muted">Aucun temps limite réglementaire pour cet agrès.</p>
      )}
      {tab === "temps" && reference.tempsMax.length > 0 && (
        <div>
          <div className="mb-3 rounded-lg bg-gradient-to-br from-accent-from/15 to-accent-to/15 p-4 text-center">
            <div className="text-xs uppercase text-muted">Temps max — {evolutionId}</div>
            <div className="text-3xl font-bold accent-gradient-text">{tempsMax?.duree ?? "—"}</div>
            {tempsMax && <div className="mt-1 text-xs text-muted">{tempsMax.label}</div>}
          </div>
          <ul className="space-y-1 text-xs text-muted">
            {reference.tempsMax.map((t) => (
              <li
                key={t.label}
                className={`flex justify-between rounded px-2 py-1 ${
                  (t.evolutions as string[]).includes(evolutionId) ? "bg-accent-from/10 text-foreground" : ""
                }`}
              >
                <span>{t.label}</span>
                <span className="font-medium">{t.duree}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "lexique" && (
        <ul className="space-y-3">
          {reference.lexique.map((l) => (
            <li key={l.acronym} className="border-b border-border-subtle pb-2 last:border-0">
              <div className="text-sm font-semibold text-foreground">
                {l.acronym} <span className="font-normal text-muted">— {l.name}</span>
              </div>
              <div className="text-xs text-muted">{l.definition}</div>
            </li>
          ))}
        </ul>
      )}

      {tab === "infos" && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Matériel</h3>
            <p className="text-xs text-muted">{reference.materiel.praticable}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Musique</h3>
            <p className="text-xs text-muted">{reference.materiel.musique}</p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Jugement</h3>
            <p className="text-xs text-muted">
              Début : {reference.materiel.jugementDebut}
              <br />
              Fin : {reference.materiel.jugementFin}
            </p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">Règles générales</h3>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
              {reference.regleGenerales.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
