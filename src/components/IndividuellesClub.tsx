"use client";

import { useState } from "react";
import Link from "next/link";

interface Membre {
  id: string; // id de la gymnaste
  firstName: string;
  lastName: string;
  birthYear: number | null;
  movements: unknown[];
}

interface Individuelle {
  id: string;
  gymnastId: string;
  evolution: string;
}

const champPetit =
  "rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm text-foreground focus:border-accent-solid focus:outline-none";

// Individuelles d'un club : chaque gymnaste y a son propre niveau, indépendant de celui de son équipe.
export default function IndividuellesClub({
  individuelles,
  gymnastesClub,
  evolutions,
  onAjouter,
  onModifier,
  onRetirer,
}: {
  individuelles: Individuelle[];
  // Gymnastes du club ; celles qui n'ont pas encore d'individuelle peuvent y être ajoutées.
  gymnastesClub: Membre[];
  evolutions: string[];
  onAjouter: (gymnastId: string) => void;
  onModifier: (id: string, evolution: string) => void;
  onRetirer: (id: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [aRetirer, setARetirer] = useState<string | null>(null);
  const deja = new Set(individuelles.map((i) => i.gymnastId));
  const disponibles = gymnastesClub.filter((g) => !deja.has(g.id));
  const annee = new Date().getFullYear();

  return (
    <div className="border-l border-border-strong pl-2 sm:ml-4 sm:pl-3">
      <div className="mb-2 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <button
          onClick={() => setOuvert(!ouvert)}
          aria-expanded={ouvert}
          className="flex items-center gap-2.5 text-left text-base font-medium text-muted hover:text-foreground"
        >
          <span className={`transition-transform ${ouvert ? "rotate-90" : ""}`}>▶</span>
          Individuelles
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-sm text-muted">
            {individuelles.length}
          </span>
        </button>
      </div>

      {ouvert && (
        <div className="mb-4 space-y-3">
          {individuelles.length === 0 && <p className="text-sm text-muted">Aucune individuelle ici.</p>}
          <ul className="space-y-3">
            {individuelles.map((i) => {
              const g = gymnastesClub.find((x) => x.id === i.gymnastId);
              if (!g) return null;
              return (
                <li key={i.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 pl-12">
                    <select
                      value={i.evolution}
                      onChange={(e) => onModifier(i.id, e.target.value)}
                      className={champPetit}
                      aria-label="Niveau"
                    >
                      {evolutions.map((e) => (
                        <option key={e} value={e}>
                          Évolution {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-10 shrink-0" />
                    <div className="flex flex-1 items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-sm transition hover:border-accent-solid/60">
                      <Link href={`/gymnaste/?id=${g.id}`} className="flex-1">
                        <div className="font-medium text-foreground">
                          {g.firstName} {g.lastName}
                        </div>
                        <div className="text-xs text-muted">
                          {g.birthYear ? `${annee - g.birthYear} ans · ` : ""}
                          {g.movements.length} mouvement(s)
                        </div>
                      </Link>
                      {aRetirer === i.id ? (
                        <span className="flex flex-wrap items-center gap-1 text-xs">
                          <span className="text-danger">
                            Retirer l&apos;individuelle de {g.firstName} {g.lastName} ? Son profil et son équipe sont conservés.
                          </span>
                          <button
                            onClick={() => {
                              setARetirer(null);
                              onRetirer(i.id);
                            }}
                            className="rounded bg-danger px-2 py-1 text-white hover:opacity-90"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => setARetirer(null)}
                            className="rounded border border-border-strong px-2 py-1 text-muted hover:text-foreground"
                          >
                            Annuler
                          </button>
                        </span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Link href={`/gymnaste/?id=${g.id}`} className="text-sm accent-gradient-text font-medium">
                            Ouvrir →
                          </Link>
                          <button
                            onClick={() => setARetirer(i.id)}
                            className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {disponibles.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && onAjouter(e.target.value)}
              className={`${champPetit} w-full sm:w-72`}
              aria-label="Ajouter une individuelle"
            >
              <option value="">Ajouter une individuelle…</option>
              {disponibles.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.firstName} {g.lastName}
                  {g.birthYear ? ` (${annee - g.birthYear} ans)` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
