import { NOTES_APPARATUS, formatNote, summarizeTeamNotes, type TeamStartNotes } from "@/lib/teamNotes";

const LABELS: Record<(typeof NOTES_APPARATUS)[number], string> = {
  SAUT: "Saut",
  BARRES_ASYM: "Barres",
  POUTRE: "Poutre",
  SOL: "Sol",
};

const cell = "px-2 py-1.5 text-right tabular-nums";

// Tableau des notes de départ d'une équipe (panneau de l'accueil et page de partage).
export default function TeamNotesTable({ data, table }: { data: TeamStartNotes; table: ReturnType<typeof summarizeTeamNotes> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted">
            <th className="px-2 py-1.5 text-left font-semibold">Gymnaste</th>
            {NOTES_APPARATUS.map((a) => (
              <th key={a} className="px-2 py-1.5 text-right font-semibold">
                {LABELS[a]}
              </th>
            ))}
            <th className="px-2 py-1.5 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.gymnasts.map((g) => (
            <tr key={g.id} className="border-t border-border-subtle">
              <td className="px-2 py-1.5 text-foreground">{g.name}</td>
              {NOTES_APPARATUS.map((a, i) => {
                const n = g.notes[i];
                const counts = n !== null && table.kept[i].has(g.id);
                return (
                  <td key={a} className={`${cell} ${counts ? "font-semibold text-foreground" : "text-muted"}`}>
                    {n === null ? "—" : formatNote(n)}
                  </td>
                );
              })}
              <td className={`${cell} font-semibold text-foreground`}>
                {formatNote(g.notes.reduce<number>((t, n) => t + (n ?? 0), 0))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border-strong font-semibold text-foreground">
            <td className="px-2 py-1.5">Total équipe</td>
            {table.teamPerApparatus.map((n, i) => (
              <td key={i} className={cell}>
                {formatNote(n)}
              </td>
            ))}
            <td className={`${cell} accent-gradient-text`}>{formatNote(table.teamTotal)}</td>
          </tr>
          <tr className="text-muted">
            <td className="px-2 py-1.5">Total max</td>
            {table.maxPerApparatus.map((n, i) => (
              <td key={i} className={cell}>
                {formatNote(n)}
              </td>
            ))}
            <td className={cell}>{formatNote(table.maxTotal)}</td>
          </tr>
          <tr className="text-foreground">
            <td className="px-2 py-1.5" colSpan={5}>
              Total / total max
            </td>
            <td className={`${cell} font-semibold`}>
              {formatNote(table.teamTotal)} / {formatNote(table.maxTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 text-xs text-muted">
        Note de départ du meilleur mouvement de chaque gymnaste à chaque agrès, à l&apos;évolution de l&apos;équipe (
        {data.evolution}) ; « — » : aucun mouvement créé. Total équipe : les {data.nbCompte} meilleures notes de chaque
        agrès (en gras), les autres sont en gris. Total max : {data.nbCompte} × la note de départ maximale du niveau à
        chaque agrès.
      </p>
    </div>
  );
}
