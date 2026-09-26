"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getGymnast, createMovement } from "@/lib/data";
import { getRegulation, getAvailableApparatuses } from "@/regulation/loader";
import Link from "next/link";
import DeleteGymnastButton from "@/components/DeleteGymnastButton";
import MovementChip from "@/components/MovementChip";
import TeamEditor from "@/components/TeamEditor";
import GymnastHeaderEditor from "@/components/GymnastHeaderEditor";
import NewMovementForm from "@/components/NewMovementForm";
import ApparatusSkillsTabs from "@/components/ApparatusSkillsTabs";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

type Gymnast = Awaited<ReturnType<typeof getGymnast>>;

function GymnastPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") ?? "";
  const [gymnast, setGymnast] = useState<Gymnast | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [headerActionsRevealed, setHeaderActionsRevealed] = useState(false);

  function refresh() {
    if (!id) return;
    getGymnast(id).then((g) => {
      setGymnast(g);
      setLoaded(true);
    });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const apparatuses = getAvailableApparatuses();
  const regulations = Object.fromEntries(apparatuses.map((a) => [a, getRegulation(a)]));

  async function handleCreateMovement(formData: FormData) {
    if (!gymnast) return;
    const apparatus = String(formData.get("apparatus"));
    const evolution = String(formData.get("evolution"));
    const label = String(formData.get("label") || `${APPARATUS_LABELS[apparatus] ?? apparatus} — ${evolution}`);
    const movement = await createMovement(gymnast.id, apparatus, evolution, label);
    router.push(`/mouvement?id=${movement.id}`);
  }

  if (!loaded) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-muted">Chargement…</p>
        </main>
      </div>
    );
  }

  if (!gymnast) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-muted">Gymnaste introuvable.</p>
          <Link href="/" className="text-sm accent-gradient-text font-medium">← Toutes les gymnastes</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <Link href="/" className="text-sm accent-gradient-text font-medium">← Toutes les gymnastes</Link>
              <div className="mt-1">
                <GymnastHeaderEditor
                  gymnastId={gymnast.id}
                  firstName={gymnast.firstName}
                  lastName={gymnast.lastName}
                  clubName={gymnast.club?.name ?? ""}
                  birthYear={gymnast.birthYear}
                  revealed={headerActionsRevealed}
                  onToggleReveal={() => setHeaderActionsRevealed((v) => !v)}
                />
              </div>
              <div className="mt-1">
                <TeamEditor gymnastId={gymnast.id} initialTeam={gymnast.team} />
              </div>
            </div>
            {headerActionsRevealed && (
              <DeleteGymnastButton
                gymnastId={gymnast.id}
                gymnastName={`${gymnast.firstName} ${gymnast.lastName}`}
                redirectHome
              />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Mouvements</h2>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {gymnast.movements.map((m) => (
              <MovementChip
                key={m.id}
                movementId={m.id}
                label={m.label}
                apparatus={m.apparatus}
                evolution={m.evolution}
                onDeleted={refresh}
              />
            ))}
          </div>
          <NewMovementForm
            action={handleCreateMovement}
            apparatuses={apparatuses}
            apparatusLabels={APPARATUS_LABELS}
            evolutionsByApparatus={Object.fromEntries(
              apparatuses.map((a) => [a, regulations[a].evolutions.map((e) => ({ id: e.id, genre: e.genre }))])
            )}
          />
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold text-foreground">Profil technique</h2>
          <p className="mb-4 text-sm text-muted">
            Indiquez ce que {gymnast.firstName} maîtrise déjà, par agrès. L&apos;assistant privilégiera ces éléments
            dans ses suggestions.
          </p>
          <ApparatusSkillsTabs
            gymnastId={gymnast.id}
            apparatuses={apparatuses}
            apparatusLabels={APPARATUS_LABELS}
            regulations={regulations}
            existingSkills={gymnast.skills}
          />
        </section>
      </main>
    </div>
  );
}

export default function GymnastPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <GymnastPageInner />
    </Suspense>
  );
}
