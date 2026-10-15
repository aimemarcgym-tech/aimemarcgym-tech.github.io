// Ordre des agrès partout dans l'appli : celui de la rotation olympique.
export const ORDRE_AGRES = ["SAUT", "BARRES_ASYM", "POUTRE", "SOL"] as const;

// Trie une liste dans l'ordre de la rotation olympique (les agrès inconnus passent à la fin).
export function trierAgres<T>(liste: T[], cle: (x: T) => string): T[] {
  const rang = (a: string) => {
    const i = (ORDRE_AGRES as readonly string[]).indexOf(a);
    return i === -1 ? ORDRE_AGRES.length : i;
  };
  return [...liste].sort((x, y) => rang(cle(x)) - rang(cle(y)));
}
