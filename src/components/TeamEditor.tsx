"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateGymnastTeam } from "@/lib/data";
import { teamColor } from "@/lib/teamColor";

export default function TeamEditor({
  gymnastId,
  initialTeam,
  clubName,
  onSaved,
}: {
  gymnastId: string;
  clubName?: string;
  initialTeam: string | null;
  onSaved?: (team: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  // Reflète l'état sauvegardé localement (pas de re-rendu serveur pour
  // rafraîchir la prop après un enregistrement, cf. lib/data.ts).
  const [savedTeam, setSavedTeam] = useState(initialTeam);
  const [value, setValue] = useState(initialTeam ?? "");
  const [pending, startTransition] = useTransition();

  if (!editing) {
    const color = savedTeam ? teamColor(savedTeam) : null;
    return (
      <span className="inline-flex flex-wrap items-center gap-3">
        <button onClick={() => setEditing(true)} className="text-sm text-muted hover:text-foreground">
          {savedTeam && color ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${color.border} ${color.bg}`}>
              <span className={`h-2 w-2 rounded-full ${color.dot}`} />
              <span className={color.text}>{savedTeam}</span>
            </span>
          ) : (
            <span className="underline decoration-dotted">+ Ajouter une équipe</span>
          )}
        </button>
        {savedTeam && (
          <Link
            href={`/?club=${encodeURIComponent(clubName || "Sans club")}&team=${encodeURIComponent(savedTeam)}`}
            className="text-sm accent-gradient-text font-medium"
          >
            Voir l&apos;équipe →
          </Link>
        )}
      </span>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateGymnastTeam(gymnastId, value);
          const trimmed = value.trim() || null;
          setSavedTeam(trimmed);
          setEditing(false);
          onSaved?.(trimmed);
        });
      }}
      className="flex items-center gap-2"
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ex: Poussines, Équipe A…"
        className="rounded border border-border-strong bg-surface-alt px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
      />
      <button type="submit" disabled={pending} className="text-xs accent-gradient-text underline disabled:opacity-50">
        {pending ? "…" : "OK"}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-foreground">
        Annuler
      </button>
    </form>
  );
}
