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
        "Liaison mixte (LM) : un élément gymnique (pivot ou saut uniquement) + un acro, et les deux doivent être dans les paliers valorisables. Ex. en B3, saut de chat (P2) + roue ne valide pas la LM.",
        "Un élément de l'arche ATR ne valide pas « acro en poutre haute » : il faut un élément des arches Acros 1 ou 2. Le saut droit (Acros 1) peut valider un acro, mais pas un acro et un saut en même temps.",
        "Un élément « + » est un élément à part entière, enchaîné directement à un autre élément (rondade « + » = rondade suivie d'un élément). Une LAE est par défaut une LA.",
        "Les éléments d'une série (gymnique, mixte ou acro) peuvent valider deux valorisations : celle de la série et une autre. Ex. en B3, le grand jeté cosaque (saut enjambé + saut de cosaque) valide la série gymnique « 1 LG ou LM », et son saut enjambé valide aussi « 1 saut avec écart antéro » (information de l'entraîneur, à confirmer officiellement).",
        "« Sortie avec liaison acro » : les éléments de la liaison (ex. roue + salto) ne peuvent pas servir aussi à une autre valorisation (acro P4, LA sur poutre…). On choisit l'une ou l'autre.",
      ];
    case "SOL":
      return [
        "« 2 acros de sens différents » est la seule valorisation qui peut réutiliser des éléments déjà comptés dans une autre valorisation — pour toutes les autres, il faut des éléments distincts.",
        "Rondade, flip et saut de mains sont répétables dans les LAE mais comptés une seule fois dans le nombre d'éléments. L'élément « + » et l'élément normal sont deux éléments différents.",
        "Les éléments d'une série (gymnique, mixte ou acro) peuvent valider deux valorisations : celle de la série (LAE, LA, LG…) et une autre (information de l'entraîneur, à confirmer officiellement).",
        "Le sens d'une liaison est celui de l'élément de liaison, pas celui de la rondade : rondade-flip et rondade-salto sont deux liaisons arrière.",
        "Un élément dont le palier n'est pas valorisable ne valorise jamais (il ne peut pas être « déclassé »), mais il compte pour le tronc commun si son palier est autorisé. Une LAE de 3 éléments reste valide avec 4.",
      ];
    case "BARRES_ASYM":
      return [
        "Un même élément réalisé plusieurs fois (ex. un balancé) ne compte qu'une seule fois dans le nombre d'éléments et pour les valorisations.",
        "Un même élément ne peut valider qu'une seule valorisation à la fois : s'il remplit plusieurs critères (ex. rotation P4 et élément P4), il ne compte que pour l'une des deux, pas les deux en même temps.",
        "Changement de barre : les mains changent de barre entre 2 éléments des paliers autorisés, sans chute, même si ces éléments servent à une autre valorisation. Une pose de pied suivie d'un balancé valide à la fois l'arche des élans et le changement de barre.",
        "Un balancé arrière arrêté par un repoussé n'est pas reconnu : il doit être enchaîné à un élément codifié. La sortie filée 1/2 tour compte comme rotation (arche Rotations).",
        "Un même élément peut valider plusieurs exigences du tronc commun, mais jamais plusieurs valorisations.",
      ];
    default:
      return [];
  }
}
