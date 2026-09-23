import Link from "next/link";
import TeamMusicManager from "@/components/TeamMusicManager";
import TeamPassageOrderManager from "@/components/TeamPassageOrderManager";

export default function MusiquesPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <div className="mt-1 flex flex-wrap justify-between gap-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                <span className="accent-gradient-text">Musiques</span>
              </h1>
              <p className="mt-1 text-sm text-muted">
                Importez, écoutez et exportez les musiques de compétition de chaque gymnaste, par équipe.
              </p>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold text-foreground">
                <span className="accent-gradient-text">Ordres de passage</span>
              </h1>
              <p className="mt-1 text-sm text-muted">
                Réglez l&apos;ordre de passage de chaque gymnaste à chaque agrès, par équipe.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="flex flex-wrap items-start justify-center gap-20">
          <TeamMusicManager />
          <TeamPassageOrderManager />
        </div>
      </main>
    </div>
  );
}
