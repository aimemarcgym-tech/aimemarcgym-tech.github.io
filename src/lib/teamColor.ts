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

export function teamColor(teamName: string) {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash * 31 + teamName.charCodeAt(i)) >>> 0;
  }
  return TEAM_COLORS[hash % TEAM_COLORS.length];
}
