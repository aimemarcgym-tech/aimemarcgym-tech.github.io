import { getGymnasts } from "@/lib/data";
import { createShare, type TeamAllShareData } from "@/lib/shares";
import { buildGymnastMovementShares } from "@/lib/movementShare";
import categoriesData from "@/regulation/data/categories-age.json";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

// "2019/2017" -> {min: 2017, max: 2019} ; "2015 et avant" -> {min: -Infinity, max: 2015}
export function parseAnnees(annees: string): { min: number; max: number } {
  if (annees.includes("et avant")) return { min: -Infinity, max: parseInt(annees, 10) };
  const parts = annees.split("/").map((s) => parseInt(s.trim(), 10));
  return { min: Math.min(...parts), max: Math.max(...parts) };
}

// Crée le lien public d'une équipe : ordres de passage (4 agrès), catégories d'âge possibles par
// évolution, et mouvements de chaque gymnaste — un instantané, comme tous les partages.
export async function createTeamShare(clubId: string | null, teamName: string): Promise<string> {
  const all = await getGymnasts();
  const members = all.filter((g) => (g.clubId ?? null) === clubId && g.team === teamName);
  if (members.length === 0) throw new Error("Aucune gymnaste dans cette équipe.");
  const club = members[0].club?.name ?? "Sans club";

  const orderFor = (apparatus: string) =>
    [...members].sort((a, b) => (a.passageOrder?.[apparatus] ?? Infinity) - (b.passageOrder?.[apparatus] ?? Infinity));

  const birthYears = members.filter((g) => g.birthYear != null).map((g) => g.birthYear as number);
  const evolutions = Array.from(new Set(members.flatMap((g) => g.movements.map((m) => m.evolution)))).sort();

  const data: TeamAllShareData = {
    club,
    team: teamName,
    passageOrder: {
      club,
      team: teamName,
      apparatuses: Object.entries(APPARATUS_LABELS).map(([apparatus, apparatusLabel]) => ({
        apparatus,
        apparatusLabel,
        gymnasts: orderFor(apparatus).map((g) => ({ firstName: g.firstName, lastName: g.lastName })),
      })),
    },
    category: {
      club,
      team: teamName,
      members: members.map((g) => ({ firstName: g.firstName, lastName: g.lastName, birthYear: g.birthYear ?? null })),
      evolutions:
        birthYears.length === 0
          ? []
          : evolutions.flatMap((evolution) => {
              const niveau = categoriesData.niveaux.find((n) => n.evolution === evolution);
              if (!niveau) return [];
              const categories = niveau.categories
                .filter((cat) => {
                  const { min, max } = parseAnnees(cat.annees);
                  return birthYears.every((y) => y >= min && y <= max);
                })
                .map((cat) => ({ ans: cat.ans, annees: cat.annees, filiere: cat.filiere }));
              return [{ evolution, categories }];
            }),
    },
    gymnasts: [],
  };

  for (const g of members) {
    data.gymnasts.push({
      gymnastFirstName: g.firstName,
      gymnastLastName: g.lastName,
      movements: await buildGymnastMovementShares(g),
    });
  }

  const id = await createShare("teamAll", data);
  return `/partage/equipe/?id=${id}`;
}
