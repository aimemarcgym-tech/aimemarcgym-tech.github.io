import Link from "next/link";
import ResultsManager from "@/components/ResultsManager";

export default function ResultatsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Résultats</span>
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10">
        <ResultsManager />
      </main>
    </div>
  );
}
