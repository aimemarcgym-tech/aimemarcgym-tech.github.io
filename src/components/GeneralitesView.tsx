"use client";

import { useState } from "react";
import type { getGeneralites } from "@/regulation/loader";

type Generalites = ReturnType<typeof getGeneralites>;

const PORTEE_COLOR: Record<string, string> = {
  MIXTE: "text-accent-solid",
  GAF: "text-danger",
  GAM: "text-success",
};

export default function GeneralitesView({ data }: { data: Generalites }) {
  const [tab, setTab] = useState<"regles" | "lexique" | "agres">("regles");
  const [selectedAgres, setSelectedAgres] = useState(data.agres[0]?.id ?? "");

  const agres = data.agres.find((a) => a.id === selectedAgres) ?? data.agres[0];

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1">
        <button
          onClick={() => setTab("regles")}
          className={`flex-1 rounded px-3 py-2 text-sm font-semibold uppercase tracking-wide ${
            tab === "regles" ? "accent-gradient text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Règles de jugement
        </button>
        <button
          onClick={() => setTab("lexique")}
          className={`flex-1 rounded px-3 py-2 text-sm font-semibold uppercase tracking-wide ${
            tab === "lexique" ? "accent-gradient text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Lexique
        </button>
        <button
          onClick={() => setTab("agres")}
          className={`flex-1 rounded px-3 py-2 text-sm font-semibold uppercase tracking-wide ${
            tab === "agres" ? "accent-gradient text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Matériel &amp; jugement par agrès
        </button>
      </div>

      {tab === "regles" && (
        <ul className="space-y-3">
          {data.reglesJugement.map((r, i) => (
            <li key={i} className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded-full border border-border-strong px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    PORTEE_COLOR[r.portee] ?? "text-muted"
                  }`}
                >
                  {r.portee}
                </span>
                <span className="text-sm font-semibold text-foreground">{r.theme}</span>
              </div>
              {r.detail.length === 1 ? (
                <p className="text-sm text-muted">{r.detail[0]}</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                  {r.detail.map((d, j) => (
                    <li key={j}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === "lexique" && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.lexique.map((l) => (
            <li key={l.acronym} className="rounded-lg border border-border-subtle bg-surface p-4">
              <div className="mb-1 text-sm font-semibold text-foreground">{l.acronym}</div>
              <div className="text-xs text-muted">{l.definition}</div>
            </li>
          ))}
        </ul>
      )}

      {tab === "agres" && agres && (
        <div>
          <div className="mb-4 flex flex-wrap gap-1">
            {data.agres.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAgres(a.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  a.id === agres.id
                    ? "border-accent-solid bg-accent-from/15 text-foreground"
                    : "border-border-subtle text-muted hover:text-foreground"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border-subtle bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{agres.name}</h3>
              <span
                className={`rounded-full border border-border-strong px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  PORTEE_COLOR[agres.genre] ?? "text-muted"
                }`}
              >
                {agres.genre}
              </span>
            </div>

            {agres.tempsMax && agres.tempsMax.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-1 text-xs font-semibold uppercase text-muted">Temps max</h4>
                <ul className="space-y-1 text-xs text-muted">
                  {agres.tempsMax.map((t) => (
                    <li key={t.label} className="flex justify-between">
                      <span>{t.label}</span>
                      <span className="font-medium text-foreground">{t.duree}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <h4 className="mb-1 text-xs font-semibold uppercase text-muted">Matériel</h4>
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
                {agres.materiel.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>

            {agres.musique && (
              <div className="mb-4">
                <h4 className="mb-1 text-xs font-semibold uppercase text-muted">Musique</h4>
                <p className="text-xs text-muted">{agres.musique}</p>
              </div>
            )}

            <div className="mb-4">
              <h4 className="mb-1 text-xs font-semibold uppercase text-muted">Jugement</h4>
              <p className="text-xs text-muted">
                Début : {agres.jugement.debut}
                <br />
                Fin : {agres.jugement.fin}
              </p>
            </div>

            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-muted">Rappels</h4>
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
                {agres.rappels.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
