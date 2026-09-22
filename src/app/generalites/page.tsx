import { getGeneralites } from "@/regulation/loader";
import GeneralitesView from "@/components/GeneralitesView";

export default function GeneralitesPage() {
  const data = getGeneralites();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Généralités</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Règles de jugement transversales, lexique et matériel/jugement par agrès — {data.source}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <GeneralitesView data={data} />
      </main>
    </div>
  );
}
