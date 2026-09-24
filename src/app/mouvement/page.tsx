"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getMovement } from "@/lib/data";
import { getRegulation } from "@/regulation/loader";
import Link from "next/link";
import MovementBuilder from "@/components/MovementBuilder";
import SautBuilder from "@/components/SautBuilder";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

type Movement = Awaited<ReturnType<typeof getMovement>>;

function MovementPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [movement, setMovement] = useState<Movement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    getMovement(id).then((m) => {
      setMovement(m);
      setLoaded(true);
    });
  }, [id]);

  if (!loaded) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-sm text-muted">Chargement…</p>
        </main>
      </div>
    );
  }

  if (!movement || !movement.gymnast) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-sm text-muted">Mouvement introuvable.</p>
          <Link href="/" className="text-sm accent-gradient-text font-medium">← Accueil</Link>
        </main>
      </div>
    );
  }

  const regulation = getRegulation(movement.apparatus);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href={`/gymnaste?id=${movement.gymnastId}`} className="text-sm accent-gradient-text font-medium">
            ← {movement.gymnast.firstName} {movement.gymnast.lastName}
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">{movement.label}</h1>
          <p className="text-sm text-muted">
            {APPARATUS_LABELS[movement.apparatus] ?? movement.apparatus} · Évolution {movement.evolution}
          </p>
        </div>
      </header>

      {movement.apparatus === "SAUT" ? (
        <SautBuilder
          movementId={movement.id}
          evolutionId={movement.evolution}
          regulation={regulation}
          initialElements={movement.elements.map((e) => ({ code: e.elementCode, role: e.role as "ENTREE" | "ELEMENT" | "SORTIE" }))}
          gymnastSkills={movement.gymnast.skills}
        />
      ) : (
        <MovementBuilder
          movementId={movement.id}
          apparatus={movement.apparatus}
          evolutionId={movement.evolution}
          regulation={regulation}
          initialElements={movement.elements.map((e) => ({ code: e.elementCode, role: e.role as "ENTREE" | "ELEMENT" | "SORTIE" }))}
          gymnastSkills={movement.gymnast.skills}
        />
      )}
    </div>
  );
}

export default function MovementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <MovementPageInner />
    </Suspense>
  );
}
