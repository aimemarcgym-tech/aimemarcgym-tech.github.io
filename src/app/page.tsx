"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { getGymnasts, createGymnast } from "@/lib/data";
import { getRegulation } from "@/regulation/loader";
import GymnastRow from "@/components/GymnastRow";
import ClubGroup from "@/components/ClubGroup";
import TeamGroup from "@/components/TeamGroup";
import HorizontalScroll from "@/components/HorizontalScroll";

type Gymnasts = Awaited<ReturnType<typeof getGymnasts>>;
type GymnastList = NonNullable<Gymnasts>;

export default function Home() {
  const [gymnasts, setGymnasts] = useState<Gymnasts | null>(null);
  const [pending, startTransition] = useTransition();
  const sol = getRegulation("SOL");
  const evolutions = [...sol.evolutions].sort((a, b) => a.ordre - b.ordre);

  function refresh() {
    getGymnasts().then(setGymnasts);
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      await createGymnast(formData);
      form.reset();
      refresh();
    });
  }

  if (!gymnasts) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-muted">Chargement…</p>
        </main>
      </div>
    );
  }

  const byClub = new Map<string, GymnastList>();
  for (const g of gymnasts) {
    const clubName = g.club?.name ?? "Sans club";
    const list = byClub.get(clubName) ?? [];
    list.push(g);
    byClub.set(clubName, list);
  }
  const clubGroups = Array.from(byClub.entries()).sort(([a], [b]) => {
    if (a === "Sans club") return 1;
    if (b === "Sans club") return -1;
    return a.localeCompare(b);
  });

  function groupByTeam(members: GymnastList) {
    const byTeam = new Map<string, GymnastList>();
    for (const g of members) {
      const teamName = g.team ?? "Sans équipe";
      const list = byTeam.get(teamName) ?? [];
      list.push(g);
      byTeam.set(teamName, list);
    }
    return Array.from(byTeam.entries()).sort(([a], [b]) => {
      if (a === "Sans équipe") return 1;
      if (b === "Sans équipe") return -1;
      return a.localeCompare(b);
    });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            Gestion <span className="accent-gradient-text">Compétitions &amp; Entraînements</span>
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Les niveaux (évolutions)</h2>
          <p className="mb-4 text-sm text-muted">
            Le programme est organisé en <strong className="text-foreground">8 évolutions</strong>, du plus facile
            (A1) au plus difficile (C3). Chaque lettre est un grand bloc de progression (A = fondamentaux, B =
            consolidation, C = complexification), et le chiffre indique un sous-niveau à l&apos;intérieur de ce
            bloc. Plus le niveau est élevé, plus les paliers d&apos;éléments autorisés (P1→P7) et le nombre
            d&apos;exigences du tronc commun augmentent.
          </p>
          <HorizontalScroll className="overflow-x-auto rounded-lg border border-border-subtle bg-surface p-4">
            <div className="flex min-w-max items-stretch gap-2.5">
              {evolutions.map((e, i) => (
                <div key={e.id} className="flex items-stretch">
                  <div className="flex w-44 flex-col justify-between rounded-lg border border-border-subtle bg-surface-alt p-3.5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xl font-bold accent-gradient-text">{e.id}</span>
                      <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] text-muted">
                        GAF
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {e.troncCommun.arches} arches · {e.troncCommun.elementsMin}–{e.troncCommun.elementsMax} éléments
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      Paliers {e.paliersAutorises[0]}→{e.paliersAutorises[e.paliersAutorises.length - 1]}
                    </div>
                  </div>
                  {i < evolutions.length - 1 && (
                    <div className="flex items-center px-1 text-muted">→</div>
                  )}
                </div>
              ))}
            </div>
          </HorizontalScroll>
          <p className="mt-2 text-xs text-muted">
            Repère rapide : <strong className="text-foreground">A1/A2</strong> = débutantes (fondamentaux),{" "}
            <strong className="text-foreground">B1/B2/B3</strong> = consolidation,{" "}
            <strong className="text-foreground">C1/C2/C3</strong> = complexification (le plus exigeant). A2 et C1
            n&apos;existent qu&apos;en GAF.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <section className="md:col-span-2">
            <h2 className="mb-4 text-lg font-semibold accent-gradient-text-white">Mes gymnastes — classement par club</h2>
            {gymnasts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-strong bg-surface/60 p-6 text-sm text-muted">
                Aucune gymnaste enregistrée pour le moment. Ajoutez-en une pour commencer à construire un mouvement.
              </p>
            ) : (
              <div className="space-y-6">
                {clubGroups.map(([clubName, members]) => {
                  const hasTeams = members.some((g) => g.team);
                  return (
                    <ClubGroup key={clubName} clubName={clubName} memberCount={members.length}>
                      {hasTeams ? (
                        <div className="space-y-3">
                          {groupByTeam(members).map(([teamName, teamMembers]) => (
                            <TeamGroup key={teamName} teamName={teamName} memberCount={teamMembers.length}>
                              <ul className="space-y-2">
                                {teamMembers.map((g) => (
                                  <GymnastRow
                                    key={g.id}
                                    gymnastId={g.id}
                                    firstName={g.firstName}
                                    lastName={g.lastName}
                                    movementCount={g.movements.length}
                                    onDeleted={refresh}
                                  />
                                ))}
                              </ul>
                            </TeamGroup>
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {members.map((g) => (
                            <GymnastRow
                              key={g.id}
                              gymnastId={g.id}
                              firstName={g.firstName}
                              lastName={g.lastName}
                              movementCount={g.movements.length}
                              onDeleted={refresh}
                            />
                          ))}
                        </ul>
                      )}
                    </ClubGroup>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold accent-gradient-text-white">Ajouter une gymnaste</h2>
            <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Prénom</label>
                <input
                  name="firstName"
                  required
                  className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Nom</label>
                <input
                  name="lastName"
                  required
                  className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Club</label>
                <input
                  name="clubName"
                  className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Équipe (optionnel)</label>
                <input
                  name="team"
                  placeholder="Ex: Poussines, Équipe A…"
                  className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Année de naissance</label>
                <input
                  name="birthYear"
                  type="number"
                  className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="accent-gradient w-full rounded px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "…" : "Créer"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
