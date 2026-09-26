"use client";

import { useEffect, useState } from "react";

export default function NewMovementForm({
  action,
  apparatuses,
  apparatusLabels,
  evolutionsByApparatus,
  defaultEvolutionId,
}: {
  action: (formData: FormData) => void;
  apparatuses: string[];
  apparatusLabels: Record<string, string>;
  evolutionsByApparatus: Record<string, { id: string; genre: string }[]>;
  defaultEvolutionId?: string | null;
}) {
  const [apparatus, setApparatus] = useState(apparatuses[0]);
  const evolutions = evolutionsByApparatus[apparatus] ?? [];
  const defaultForApparatus =
    (evolutions.some((e) => e.id === defaultEvolutionId) ? defaultEvolutionId : evolutions[0]?.id) ?? "";
  const [evolution, setEvolution] = useState(defaultForApparatus);

  // Si le rang/équipe de la gymnaste change (TeamEditor), on aligne
  // automatiquement l'évolution présélectionnée, tant que le champ Agrès
  // n'a pas changé entre-temps (recalculé par apparatus ci-dessus).
  useEffect(() => {
    setEvolution(defaultForApparatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultEvolutionId]);

  function handleApparatusChange(a: string) {
    setApparatus(a);
    const nextEvolutions = evolutionsByApparatus[a] ?? [];
    setEvolution(
      (nextEvolutions.some((e) => e.id === defaultEvolutionId) ? defaultEvolutionId : nextEvolutions[0]?.id) ?? ""
    );
  }

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
          onChange={(e) => handleApparatusChange(e.target.value)}
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
          value={evolution}
          onChange={(e) => setEvolution(e.target.value)}
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
