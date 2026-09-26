import Link from "next/link";
import TeamMusicManager from "@/components/TeamMusicManager";

export default function MusiquesPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-2 py-5 sm:px-6">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <div className="mt-1">
            <h1 className="text-xl font-bold text-foreground">
              <span className="accent-gradient-text">Musiques</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Importez, écoutez et exportez les musiques de compétition de chaque gymnaste, par équipe.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-2 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-center">
          <TeamMusicManager />
        </div>
      </main>
    </div>
  );
}
