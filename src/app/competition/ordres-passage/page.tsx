import Link from "next/link";
import TeamPassageOrderManager from "@/components/TeamPassageOrderManager";

export default function OrdresPassagePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-2 py-5 sm:px-6">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <div className="mt-1">
            <h1 className="text-xl font-bold text-foreground">
              <span className="accent-gradient-text">Ordres de passage</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Réglez l&apos;ordre de passage de chaque gymnaste à chaque agrès, par équipe.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-2 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-center">
          <TeamPassageOrderManager />
        </div>
      </main>
    </div>
  );
}
