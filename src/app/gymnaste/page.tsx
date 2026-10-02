"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getGymnast, getMovement, createMovement } from "@/lib/data";
import { getRegulation, getAvailableApparatuses } from "@/regulation/loader";
import Link from "next/link";
import DeleteGymnastButton from "@/components/DeleteGymnastButton";
import MovementChip from "@/components/MovementChip";
import TeamEditor from "@/components/TeamEditor";
import GymnastHeaderEditor from "@/components/GymnastHeaderEditor";
import NewMovementForm from "@/components/NewMovementForm";
import ApparatusSkillsTabs from "@/components/ApparatusSkillsTabs";
import ShareLinkButton from "@/components/ShareLinkButton";
import { createShare, type MovementShareData } from "@/lib/shares";
import { buildMovementShare, penaliteMaterielFromStorage } from "@/lib/movementShare";
import { analyzeMovement } from "@/engine/composition";
import { analyzeSaut } from "@/engine/saut";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

// Ordre officiel de rotation en compétition GAF.
const APPARATUS_ORDER = ["SAUT", "BARRES_ASYM", "POUTRE", "SOL"];

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

  async function handleShareProfile(): Promise<string> {
    if (!gymnast) throw new Error("Gymnaste introuvable.");
    const sorted = [...gymnast.movements].sort(
      (a, b) => APPARATUS_ORDER.indexOf(a.apparatus) - APPARATUS_ORDER.indexOf(b.apparatus)
    );
    const movements: MovementShareData[] = [];
    for (const m of sorted) {
      const full = await getMovement(m.id);
      if (!full) continue;
      const refs = full.elements.map((e) => ({ code: e.elementCode, role: e.role as "ENTREE" | "ELEMENT" | "SORTIE" }));
      // Mêmes confirmations manuelles que dans le constructeur (stockées par mouvement).
      let confirmations = new Set<string>();
      try {
        const raw = localStorage.getItem(`manual-confirm-${m.id}`);
        if (raw) confirmations = new Set(JSON.parse(raw));
      } catch {}
      const diagnostic =
        m.apparatus === "SAUT"
          ? analyzeSaut(m.evolution, refs, confirmations)
          : analyzeMovement(m.apparatus, m.evolution, refs, confirmations);
      movements.push(
        buildMovementShare({
          gymnastFirstName: gymnast.firstName,
          gymnastLastName: gymnast.lastName,
          label: m.label,
          apparatus: m.apparatus,
          evolutionId: m.evolution,
          codes: refs.map((r) => r.code),
          diagnostic,
          penaliteMateriel: m.apparatus === "SAUT" ? penaliteMaterielFromStorage(m.id) : undefined,
        })
      );
    }
    const shareId = await createShare("movementsAll", {
      gymnastFirstName: gymnast.firstName,
      gymnastLastName: gymnast.lastName,
      movements,
    });
    return `/partage/mouvements/?id=${shareId}`;
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
                <TeamEditor gymnastId={gymnast.id} initialTeam={gymnast.team} onSaved={refresh} />
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Mouvements</h2>
            <ShareLinkButton
              onCreate={handleShareProfile}
              label="Partager les 4 agrès"
              className="rounded bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            />
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {[...gymnast.movements]
              .sort((a, b) => APPARATUS_ORDER.indexOf(a.apparatus) - APPARATUS_ORDER.indexOf(b.apparatus))
              .map((m) => (
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
            defaultEvolutionId={gymnast.team?.match(/\b([ABC][123])\b/i)?.[1]?.toUpperCase()}
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
