"use client";

import { useState } from "react";
import Link from "next/link";
import TeamMusicManager from "@/components/TeamMusicManager";
import TeamPassageOrderManager from "@/components/TeamPassageOrderManager";

export default function MusiquesPage() {
  const [showPassageOrder, setShowPassageOrder] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Musiques</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Importez, écoutez et exportez les musiques de compétition de chaque gymnaste, par équipe.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="flex flex-wrap items-start gap-6">
          <TeamMusicManager />

          {showPassageOrder ? (
            <TeamPassageOrderManager />
          ) : (
            <button
              type="button"
              onClick={() => setShowPassageOrder(true)}
              className="rounded-xl border border-border-strong bg-surface-alt px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent-solid hover:text-white"
            >
              Ordres de passage
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
