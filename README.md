# Assistant UFOLEP GAF — Construction de mouvements

Application locale (Next.js + TypeScript + SQLite/Prisma) qui aide un entraîneur à
construire un mouvement de compétition à partir des capacités réelles de sa
gymnaste, conformément au Nouveau Programme Technique UFOLEP.

## Lancer l'application

```bash
npm install
npm run dev
```
Puis ouvrir http://localhost:3000

Base de données SQLite locale : `prisma/dev.db` (créée automatiquement).

## Architecture

- **Réglementation** (`src/regulation/data/**`) : fichiers JSON versionnés,
  séparés du code. Contiennent les arches, éléments, paliers, tronc commun et
  valorisations tels que numérisés depuis les PDF officiels UFOLEP. Chaque
  élément porte un `sourcePage` pour vérification rapide contre le PDF.
- **Moteur** (`src/engine/composition.ts`) : analyse un mouvement (liste
  ordonnée d'éléments) et produit un diagnostic complet (tronc commun,
  paliers, valorisations, note de départ, suggestions).
- **Base applicative** (`prisma/schema.prisma`) : clubs, gymnastes, profil de
  maîtrise par élément, mouvements, historique (snapshots).
- **UI** (`src/components/MovementBuilder.tsx`) : écran 3 zones (mouvement /
  analyse / assistant) qui recalcule le diagnostic à chaque modification.

## État d'avancement (V1)

✅ Agrès **Sol** entièrement modélisé : 8 arches, 8 évolutions (A1→C3,
GAF/GAM), décomposition de note complète (tronc commun, paliers
autorisés/valorisables, valorisations pondérées).

✅ Moteur de diagnostic fonctionnel : détection automatique des exigences
vérifiables à partir des données (comptage d'arches, paliers, catégories,
liaisons acrobatiques par séquence, "2 acros de sens différents"...).

⚠️ **Certaines règles ne sont volontairement PAS auto-détectées** (LAE avec
envol, "liés directement ou indirectement", combinaisons nominatives comme
"Sursaut + fente + roue") car les données numérisées ne portent pas encore
l'information nécessaire (ex: flag "envol" par élément). Ces exigences sont
affichées "⚠ à confirmer" et l'entraîneur les valide manuellement d'un clic —
**aucune règle n'est inventée ou devinée silencieusement**. Voir
`src/regulation/checks.ts` pour la liste précise.

⚠️ La bibliothèque d'éléments de l'arche **Acros 2** (page 66 du PDF Sol) est
marquée `verified:false` : la numérisation visuelle n'a pas permis de
distinguer clairement les branches avant/arrière comme pour Acros 1. À
recontrôler contre le PDF avant usage en compétition.

## Prochaines étapes

1. Vérifier/corriger `src/regulation/data/sol/elements.json` (surtout Acros 2)
   contre le PDF officiel.
2. Numériser les 3 agrès restants (Poutre, Barres asymétriques, Saut) sur le
   même modèle (`arches.json` / `elements.json` / `decomposition.json`).
3. Enrichir `checks.ts` au fur et à mesure (ex: tagger `envol: true/false` et
   `appel: "1pied"|"2pieds"` sur les éléments pour lever certains MANUAL).
4. Fonction "Optimiser mon mouvement" (section 13 du cahier des charges) —
   pas encore implémentée.
5. Comparaison de plusieurs compositions (section 14) — pas encore implémentée.
6. Historique de progression dans le temps (section 20) — les snapshots sont
   enregistrés en base mais pas encore affichés dans l'UI.
