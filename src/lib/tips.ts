// Rappels courts affichés sous la note de départ, pour les points de règle
// qui reviennent le plus souvent en question — volontairement limité à
// quelques points par agrès (pas une liste exhaustive de la FAQ) pour
// rester lisible et éviter un second corpus à maintenir en parallèle des
// données réglementaires.
export function getSautTips(sautsRequired: number, evolutionId?: string): string[] {
  const tips = [
    sautsRequired === 1
      ? "Un seul type de saut est demandé à ce niveau : il peut être exécuté deux fois en compétition (meilleure note gardée), inutile de l'ajouter deux fois ici."
      : "2 sauts de familles de 1er envol différentes sont demandés à ce niveau : chacun compte pour sa meilleure note parmi ses essais en compétition.",
    "Un saut nomade n'est jamais valorisable, même s'il obtient la meilleure note.",
  ];
  // FAQ #166 : en A1 et A2, les sauts PR se font sur une pile de tapis de 80 cm, donc jamais « Saut à 1 m ».
  if (evolutionId === "A1" || evolutionId === "A2") {
    tips.push("Les sauts PR se font sur une pile de tapis de 80 cm : ils ne valident jamais la valorisation « Saut à 1 m ».");
  }
  return tips;
}

export function getApparatusTips(apparatus: string): string[] {
  switch (apparatus) {
    case "POUTRE":
      return [
        "Les sorties comptent pour le tronc commun (« X acros en poutre haute ») mais jamais pour une valorisation « acro sur la poutre » : il faut un élément avec réception sur la poutre, pas une sortie en bout de poutre.",
        "Les éléments de l'arche des Entrées ne valident jamais une exigence ou valorisation acro, même ceux qui y ressemblent (roue, flip, salto).",
      ];
    case "SOL":
      return [
        "« 2 acros de sens différents » est la seule valorisation qui peut réutiliser des éléments déjà comptés dans une autre valorisation — pour toutes les autres, il faut des éléments distincts.",
      ];
    case "BARRES_ASYM":
      return [
        "Un même élément réalisé plusieurs fois (ex. un balancé) ne compte qu'une seule fois dans le nombre d'éléments et pour les valorisations.",
        "Un même élément ne peut valider qu'une seule valorisation à la fois : s'il remplit plusieurs critères (ex. rotation P4 et élément P4), il ne compte que pour l'une des deux, pas les deux en même temps.",
      ];
    default:
      return [];
  }
}
