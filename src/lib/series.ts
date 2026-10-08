// Pastilles de série (Sol et Poutre) : repère visuel posé sur un élément pour noter à quelle série il appartient.
// Mixte = bleue, gymnique = verte, acro = jaune. Simple annotation, sans effet sur le calcul de la note.
export type SerieType = "MIXTE" | "GYMNIQUE" | "ACRO";

export const SERIES: { id: SerieType; label: string; plein: string; lueur: string }[] = [
  { id: "MIXTE", label: "Série mixte", plein: "bg-[#00b7ff]", lueur: "#00b7ff" },
  { id: "GYMNIQUE", label: "Série gymnique", plein: "bg-[#2bff00]", lueur: "#2bff00" },
  { id: "ACRO", label: "Série acro", plein: "bg-[#fff200]", lueur: "#fff200" },
];

export const APPAREILS_AVEC_SERIES = ["SOL", "POUTRE"];

export function serieDe(id: string | null | undefined) {
  return SERIES.find((s) => s.id === id);
}
