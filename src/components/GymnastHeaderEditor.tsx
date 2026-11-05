"use client";

import { useEffect, useState, useTransition } from "react";
import { getClubNames, updateGymnast } from "@/lib/data";
import { btnContour, btnDegrade, champ, etiquette } from "@/lib/styles";

export default function GymnastHeaderEditor({
  gymnastId,
  firstName,
  lastName,
  clubName,
  birthYear,
  revealed,
  onToggleReveal,
}: {
  gymnastId: string;
  firstName: string;
  lastName: string;
  clubName: string;
  birthYear: number | null;
  revealed: boolean;
  onToggleReveal: () => void;
}) {
  const [editing, setEditing] = useState(false);
  // Reflète l'état sauvegardé localement (pas de re-rendu serveur pour
  // rafraîchir les props après un enregistrement, cf. lib/data.ts).
  const [saved, setSaved] = useState({ firstName, lastName, clubName });
  const [form, setForm] = useState({
    firstName,
    lastName,
    clubName,
    birthYear: birthYear ? String(birthYear) : "",
  });
  const [pending, startTransition] = useTransition();
  const [clubNames, setClubNames] = useState<string[]>([]);

  useEffect(() => {
    if (editing) getClubNames().then(setClubNames);
  }, [editing]);

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            if (!revealed) onToggleReveal();
          }}
          className="text-left"
        >
          <h1 className="text-xl font-bold text-foreground">
            {saved.firstName} {saved.lastName}
          </h1>
          <p className="text-sm text-muted">{saved.clubName || "Aucun club"}</p>
        </button>
        {revealed && (
          <button
            onClick={() => setEditing(true)}
            className="rounded border border-border-strong px-2 py-1 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
          >
            Modifier
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateGymnast(gymnastId, form);
          setSaved({ firstName: form.firstName, lastName: form.lastName, clubName: form.clubName });
          setEditing(false);
        });
      }}
      className="mt-4 space-y-3 rounded-lg border border-border-subtle bg-surface p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-foreground">Modifier le profil</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={etiquette}>Prénom</label>
          <input
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
            className={champ}
          />
        </div>
        <div>
          <label className={etiquette}>Nom</label>
          <input
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
            className={champ}
          />
        </div>
        <div>
          <label className={etiquette}>Club</label>
          <input
            value={form.clubName}
            onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value }))}
            placeholder="Aucun club"
            list="clubs-profil"
            className={champ}
          />
          <datalist id="clubs-profil">
            {clubNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={etiquette}>Année de naissance</label>
          <input
            type="number"
            value={form.birthYear}
            onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value }))}
            placeholder={String(new Date().getFullYear() - 12)}
            className={champ}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnDegrade}>
          {pending ? "…" : "Enregistrer"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={btnContour}>
          Annuler
        </button>
      </div>
    </form>
  );
}
