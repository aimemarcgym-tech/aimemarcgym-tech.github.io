// Palette de couleurs pour différencier visuellement les équipes, dans le
// même esprit que le thème (teintes vives sur fond sombre), tout en restant
// distincte de l'accent principal violet/rose (réservé aux actions/liens) et
// des couleurs sémantiques (succès/avertissement/danger).
// Classes Tailwind écrites en toutes lettres (nécessaire pour que le JIT les
// détecte au build — un nom composé dynamiquement ne serait pas généré).
const TEAM_COLORS = [
  { text: "text-sky-300", border: "border-sky-500/40", bg: "bg-sky-500/10", dot: "bg-sky-400" },
  { text: "text-emerald-300", border: "border-emerald-500/40", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  { text: "text-orange-300", border: "border-orange-500/40", bg: "bg-orange-500/10", dot: "bg-orange-400" },
  { text: "text-indigo-300", border: "border-indigo-500/40", bg: "bg-indigo-500/10", dot: "bg-indigo-400" },
  { text: "text-fuchsia-300", border: "border-fuchsia-500/40", bg: "bg-fuchsia-500/10", dot: "bg-fuchsia-400" },
  { text: "text-teal-300", border: "border-teal-500/40", bg: "bg-teal-500/10", dot: "bg-teal-400" },
  { text: "text-amber-300", border: "border-amber-500/40", bg: "bg-amber-500/10", dot: "bg-amber-400" },
  { text: "text-rose-300", border: "border-rose-500/40", bg: "bg-rose-500/10", dot: "bg-rose-400" },
] as const;

// Une couleur par niveau (évolution) : tous les B3 sont verts, etc. Pour deux équipes du même niveau,
// la couleur est « déclinée » : 1re équipe teinte claire, 2e plus soutenue, 3e plus profonde, puis on recommence.
const NIVEAU_COLORS: Record<string, readonly { text: string; border: string; bg: string; dot: string }[]> = {
  A1: [
    { text: "text-sky-200", border: "border-sky-400/40", bg: "bg-sky-400/10", dot: "bg-sky-300" },
    { text: "text-sky-400", border: "border-sky-500/40", bg: "bg-sky-500/10", dot: "bg-sky-500" },
    { text: "text-sky-500", border: "border-sky-600/50", bg: "bg-sky-600/10", dot: "bg-sky-600" },
  ],
  A2: [
    { text: "text-indigo-200", border: "border-indigo-400/40", bg: "bg-indigo-400/10", dot: "bg-indigo-300" },
    { text: "text-indigo-400", border: "border-indigo-500/40", bg: "bg-indigo-500/10", dot: "bg-indigo-500" },
    { text: "text-indigo-500", border: "border-indigo-600/50", bg: "bg-indigo-600/10", dot: "bg-indigo-600" },
  ],
  B1: [
    { text: "text-amber-200", border: "border-amber-400/40", bg: "bg-amber-400/10", dot: "bg-amber-300" },
    { text: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10", dot: "bg-amber-500" },
    { text: "text-amber-500", border: "border-amber-600/50", bg: "bg-amber-600/10", dot: "bg-amber-600" },
  ],
  B2: [
    { text: "text-orange-200", border: "border-orange-400/40", bg: "bg-orange-400/10", dot: "bg-orange-300" },
    { text: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500/10", dot: "bg-orange-500" },
    { text: "text-orange-500", border: "border-orange-600/50", bg: "bg-orange-600/10", dot: "bg-orange-600" },
  ],
  B3: [
    { text: "text-emerald-200", border: "border-emerald-400/40", bg: "bg-emerald-400/10", dot: "bg-emerald-300" },
    { text: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
    { text: "text-emerald-500", border: "border-emerald-600/50", bg: "bg-emerald-600/10", dot: "bg-emerald-600" },
  ],
  C1: [
    { text: "text-rose-200", border: "border-rose-400/40", bg: "bg-rose-400/10", dot: "bg-rose-300" },
    { text: "text-rose-400", border: "border-rose-500/40", bg: "bg-rose-500/10", dot: "bg-rose-500" },
    { text: "text-rose-500", border: "border-rose-600/50", bg: "bg-rose-600/10", dot: "bg-rose-600" },
  ],
  C2: [
    { text: "text-fuchsia-200", border: "border-fuchsia-400/40", bg: "bg-fuchsia-400/10", dot: "bg-fuchsia-300" },
    { text: "text-fuchsia-400", border: "border-fuchsia-500/40", bg: "bg-fuchsia-500/10", dot: "bg-fuchsia-500" },
    { text: "text-fuchsia-500", border: "border-fuchsia-600/50", bg: "bg-fuchsia-600/10", dot: "bg-fuchsia-600" },
  ],
  C3: [
    { text: "text-red-200", border: "border-red-400/40", bg: "bg-red-400/10", dot: "bg-red-300" },
    { text: "text-red-400", border: "border-red-500/40", bg: "bg-red-500/10", dot: "bg-red-500" },
    { text: "text-red-500", border: "border-red-600/50", bg: "bg-red-600/10", dot: "bg-red-600" },
  ],
};

// Avec un niveau connu, la couleur est celle du niveau (rang = n-ième équipe de ce niveau dans le club, à partir de 0) ;
// sans niveau, elle dépend du nom de l'équipe.
export function teamColor(teamName: string, niveau?: string | null, rang = 0) {
  const parNiveau = niveau ? NIVEAU_COLORS[niveau] : undefined;
  if (parNiveau) return parNiveau[rang % parNiveau.length];
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash * 31 + teamName.charCodeAt(i)) >>> 0;
  }
  return TEAM_COLORS[hash % TEAM_COLORS.length];
}
