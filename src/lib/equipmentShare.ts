import type { EquipmentSettings } from "@/lib/idb";
import type { EquipmentShareData } from "@/lib/shares";

const rempli = (r?: EquipmentSettings) => !!r && Object.values(r).some((v) => v);

// Contenu du lien « Réglages » : la carte « Toute l'équipe » si elle est remplie (ou si aucune gymnaste
// n'a de réglage propre), puis seulement les gymnastes dont au moins une case est remplie.
export function buildEquipmentShare(
  club: string,
  team: string,
  teamSettings: EquipmentSettings,
  gymnasts: { firstName: string; lastName: string; reglages?: EquipmentSettings }[]
): EquipmentShareData {
  const individuelles = gymnasts.filter((g) => rempli(g.reglages));
  return {
    club,
    team,
    ...(rempli(teamSettings) || individuelles.length === 0 ? { wholeTeam: teamSettings } : {}),
    gymnasts: individuelles.map((g) => ({ name: `${g.firstName} ${g.lastName}`, settings: g.reglages ?? {} })),
  };
}
