"use client";

import { useState } from "react";

// Bouton générique "Partager" : appelle onCreate() (qui écrit un instantané
// dans Firestore via src/lib/shares.ts et renvoie le chemin public), affiche
// le lien obtenu avec un bouton "Copier". Chaque clic génère un nouveau lien.
export default function ShareLinkButton({
  onCreate,
  label = "Partager",
  className,
}: {
  onCreate: () => Promise<string>;
  label?: string;
  className?: string;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setCopied(false);
    setError(null);
    try {
      const path = await onCreate();
      setLink(`${window.location.origin}${path}`);
    } catch {
      setError("Échec de la création du lien.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError("Impossible de copier automatiquement — sélectionnez le lien manuellement.");
    }
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        className={
          className ??
          "rounded border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent-solid/60 disabled:opacity-50"
        }
      >
        {busy ? "…" : label}
      </button>
      {link && (
        <div className="flex items-center gap-2 rounded border border-border-strong bg-surface-alt px-2 py-1 text-xs">
          <span className="max-w-[220px] truncate text-muted" title={link}>
            {link}
          </span>
          <button type="button" onClick={handleCopy} className="shrink-0 accent-gradient-text font-medium underline">
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
