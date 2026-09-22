"use client";

import { useState, useTransition } from "react";
import { updateGymnast } from "@/lib/data";

export default function GymnastHeaderEditor({
  gymnastId,
  firstName,
  lastName,
  clubName,
  birthYear,
}: {
  gymnastId: string;
  firstName: string;
  lastName: string;
  clubName: string;
  birthYear: number | null;
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

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {saved.firstName} {saved.lastName}
          </h1>
          <p className="text-sm text-muted">{saved.clubName || "Aucun club"}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="rounded border border-border-strong px-2 py-1 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
        >
          Modifier
        </button>
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
      className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle bg-surface-alt p-3"
    >
      <div>
        <label className="mb-1 block text-[10px] text-muted">Prénom</label>
        <input
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          required
          className="rounded border border-border-strong bg-surface px-2 py-1 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] text-muted">Nom</label>
        <input
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          required
          className="rounded border border-border-strong bg-surface px-2 py-1 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] text-muted">Club</label>
        <input
          value={form.clubName}
          onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value }))}
          placeholder="Aucun club"
          className="rounded border border-border-strong bg-surface px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] text-muted">Année de naissance</label>
        <input
          type="number"
          value={form.birthYear}
          onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value }))}
          className="w-24 rounded border border-border-strong bg-surface px-2 py-1 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="accent-gradient rounded px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "…" : "Enregistrer"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded border border-border-strong px-3 py-1.5 text-xs text-muted hover:text-foreground"
      >
        Annuler
      </button>
    </form>
  );
}
