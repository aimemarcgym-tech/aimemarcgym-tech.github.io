"use client";

import { useState } from "react";

export default function NewMovementForm({
  action,
  apparatuses,
  apparatusLabels,
  evolutionsByApparatus,
}: {
  action: (formData: FormData) => void;
  apparatuses: string[];
  apparatusLabels: Record<string, string>;
  evolutionsByApparatus: Record<string, { id: string; genre: string }[]>;
}) {
  const [apparatus, setApparatus] = useState(apparatuses[0]);
  const evolutions = evolutionsByApparatus[apparatus] ?? [];

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Nom du mouvement</label>
        <input
          name="label"
          placeholder={`${apparatusLabels[apparatus] ?? apparatus} — compétition 1`}
          className="rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Agrès</label>
        <select
          name="apparatus"
          value={apparatus}
          onChange={(e) => setApparatus(e.target.value)}
          className="rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          {apparatuses.map((a) => (
            <option key={a} value={a}>
              {apparatusLabels[a] ?? a}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Évolution</label>
        <select
          name="evolution"
          className="rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          {evolutions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.id} (GAF)
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="accent-gradient rounded px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        Nouveau mouvement
      </button>
    </form>
  );
}
