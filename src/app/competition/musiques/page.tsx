import Link from "next/link";
import TeamMusicManager from "@/components/TeamMusicManager";

export default function MusiquesPage() {
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
        <TeamMusicManager />
      </main>
    </div>
  );
}
