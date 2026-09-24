// Un code contenant "+" désigne toujours une variante d'un élément de même
// nom (rejouée à un palier différent). Deux cas distincts dans les PDF
// sources :
//  - la variante est explicitement nommée "(variante)" -> même mouvement,
//    exigence technique différente (ex : "Rondade" / "Rondade (variante)").
//  - la variante n'a pas cette mention -> le même nom apparaît une 2e fois
//    dans une arche différente, généralement parce que l'élément y est
//    exécuté en enchaînement/liaison avec un autre élément plutôt qu'isolé
//    (ex : "ATR passagé" isolé vs "ATR passagé" en liaison sur Acro 2).
export function isNamedVariant(name: string) {
  return name.toLowerCase().includes("variante");
}

export function isChainVariant(code: string, name: string) {
  return code.includes("+") && !isNamedVariant(name);
}
