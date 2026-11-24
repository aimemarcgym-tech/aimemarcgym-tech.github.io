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

✅ Panneau d'analyse du constructeur : le bloc « Paliers » affiche les paliers
autorisés du niveau et de l'agrès choisis, avec les paliers valorisables
marqués d'une étoile (★).

✅ Valorisations : un élément ne valide qu'une seule valorisation, y compris
les éléments d'une série (LAE, LA, LG, LM), conformément à la FAQ (#214, #45,
#47). La règle « une série vaut deux valorisations » est suspendue en attendant
une réponse officielle, sauf à la Poutre : une série acro terminée par une sortie
y vaut deux valorisations (validée par l'entraîneur, encore à confirmer ; pas au Sol). L'avertissement de doublons tient compte des séries
confirmées (via les pastilles de série).

✅ Import d'une sauvegarde : une animation (sablier tournant) s'affiche pendant la
lecture du fichier puis pendant l'import, avec le message « Ne fermez pas cette page ».

✅ « Faire ces musiques » : la liste « Ajouter à la musique de… » est groupée par club puis par niveau/équipe, triée par nom.

✅ Sol, arches « Sauts gymniques » (PDF « GAM-GAF Arches SOL », décidé avec l'utilisateur le 24/11) : ajout, appel 2 pieds, de 38 (groupé 1/2 tour, P3), 58 (groupé 1 tour, P4) et 122 (extension 1/2 tour, P3) ; appel 1 pied, de 35 (cosaque appel d'1 pied, P2) et 73 new (ciseau demi, P4) ; le 33 « Saut ciseaux en avant » passe de pré-requis à nomade, comme dans le PDF. Les autres éléments concordaient.

✅ Sol, arche « Acros 1 » (PDF « GAM-GAF Arches SOL », décidé avec l'utilisateur le 24/11) : ajout de l'élément 104 « Roulade arrière jambes tendues et serrées », branche arrière, P3 (il manquait ; les 34 autres éléments concordent avec le PDF).

✅ Sol, arche « Acros 2 » (PDF « GAM-GAF Arches SOL », décidé avec l'utilisateur le 24/11) : le sens avant/arrière est corrigé d'après le PDF (151, 153, 154, 154+, 158, 158+ et 182 passent d'« arrière » à « avant » ; seuls 149, 155, 155+ et 175 sont en arrière), ce qui joue sur la règle « 2 acros de sens différents » ; le code `195+` devient `155+` (exemples Sol et constructeur mis à jour) ; ajout des pré-requis 84 et 68 new et des nomades 47, 135 et 159, absents jusque-là. Les 24 exemples restent à la note maximale. Autres écarts Sol (Acros 1, Cercles, Sauts gymniques) à traiter ensuite.

✅ Poutre, arche « Acros 2 » (PDF « GAF Arches POUTRE », décidé avec l'utilisateur le 24/11) : ajout de l'élément 166+ 26 « Flic-flac. Renversement arrière avec envol départ libre arrivée 2 pieds serrés (variante) », branche arrière, P6 (code `166+-26`). Les 164 autres éléments concordaient.

✅ Barres, arches (PDF « GAF Arches BARRES ASYMETRIQUES », décidé avec l'utilisateur le 24/11) : l'élément 56-26 « Bascule fixe » (Venir à l'appui) passe de P4 à P5 (d'après la position sur l'arc) ; l'élément 140 « Salto arrière entre les barres arrivée suspension BI (salto Pak) avec passage par l'appui » est ajouté aux balancés avant, en P6 (il manquait depuis la brochure de septembre).

✅ Programme technique UFOLEP du 20 octobre 2026, pages Généralités (relues en image, p. 7 à 23) : balancés « en A2 » (et non A1) ; reprise de 30 s valable pour tous les agrès ; chute sur les salti et les sorties ; poutre mousse en début ou fin de mouvement hors temps imparti ; élément « + » précisé (Sol : avec envol ; Poutre : acro ou gymnique) ; saut de chat, angles mis à jour (aucune pénalité au-delà de 15° au-dessus de l'horizontale, NR à partir de 31° sous) ; enchaînement en 2 ou 3 parties (B1 seulement avec balancé de bascule) ; lexique complété (Paliers autorisés et valorisés, Élément, Acro, Enchaînement en 2 parties minimum, compléments sur Tronc commun, Nomades, Valorisation, Lâcher). Catégories d'âge vérifiées, conformes. Non repris : tableau des montants de fautes, fautes détaillées du Saut, amplitudes des prises d'élan et balancés, réception avec rotation longitudinale.

✅ Programme technique UFOLEP du 20 octobre 2026, Barres / Poutre / Sol (relu en image) : Barres C2, paliers valorisables P4 à P7 (P7 manquait) ; Barres C3, la sortie « P5 (min.) » n'a plus à être amenée d'un élément P5 (exemple C3 mis à jour) ; Sol B2 à C3, « 2 acros de sens différents avec envol incorporées ou non dans les LAE » ; « (min.) » ajouté au nombre d'arches (page Décomposition), aux bascules Barres B2/B3 et aux « 1 élément Pn (min.) » du tronc commun Poutre B2 à C2 ; fautes de frappe corrigées. Aucun changement de calcul : les 24 exemples restent à la note maximale.

✅ Saut, programme technique UFOLEP du 20 octobre 2026 : les sauts « prérequis » sont maintenant PR1 à PR4 (PR1 saut droit 9, PR2 lune plat dos 10, PR3 rondade arrivée plat ventre 10, PR4 rondade arrivée debout sur tapis de 80 cm ou rondade sur tremplin et saut extension 11). Paliers autorisés / valorisables par niveau : A1 PR1-PR4 + P1 / PR2 + P1 ; A2 PR1-PR4 + P1 / PR3 + P1 ; B1 PR3-PR4 + P1 à P3 / PR3-PR4 + P1-P2 ; B2 PR3-PR4 + P1 à P4 / PR4 + P1 à P3 ; B3 à C3 inchangés. Le moteur (`engine/saut.ts`) traite chaque PR séparément (avant, tous les PR comptaient comme un seul « prérequis »). Nouvel élément « Rondade arrivée debout sur tapis de 80 cm » (code `PR4-rondade-debout`, sans numéro dans la brochure). Barème « Valeur des sauts » corrigé d'après le programme : P5 vaut 13 (et non 14) pour les 5 sauts concernés (25-26, 26-26, 46-26, 55-26, 50-26), donc P3 à P5 = 13 et P6-P7 = 14 ; les exemples du Saut sont recalculés ; C1 et C2 refaits pour atteindre le maximum de 16 (Yurchenko tendu P6 + Tsukahara groupé P3 ; en C1 la valorisation « rotation » est validée par le Tsukahara, seul saut dans les paliers valorisables, FAQ #265). Page « Décomposition de la note » : grille PR1-PR4, détail des PR tiré des données, règles de généralités du Saut ajoutées.

✅ Panneau « Couper une musique » : parmi les 4 boutons d'action (Retirer la sélection A–B, Garder uniquement la sélection, Annuler le dernier retrait, Tout réafficher), un seul est allumé (dégradé violet-rose) à la fois : le dernier sur lequel on a cliqué. Les autres sont éteints, il n'y a pas d'effet au survol, et un bouton désactivé reste éteint et grisé (classe `bouton-allume` dans `globals.css`, attribut `data-allume`). Le bouton « Créer le montage » garde son dégradé permanent.

✅ Page Table : les tableaux d'éléments se font glisser au doigt (ou à la souris) vers la gauche et la droite pour voir toutes les colonnes ; le défilement vertical de la page et le zoom à deux doigts restent normaux.

✅ Page Table : le bouton « ↑ Retour en haut » n'apparaît que sur ordinateur (masqué sur tout appareil tactile, en portrait comme en paysage, pour ne pas cacher les infos). Sur appareil tactile, une marge est laissée sous les résultats pour pouvoir lire la dernière ligne, et la croix d'effacement de la barre de recherche est plus grosse et bleue (classe `croix-large` dans `globals.css`).

✅ Panneau « Référence » (onglet Temps) : à la Poutre, la pénalité de 1 point en cas de dépassement du temps max est affichée à la suite du temps.

✅ Page Table : barre de recherche (nom, code, branche, palier ; sans accents ni majuscules, tous les mots doivent correspondre) avec le nombre de résultats sur chaque agrès.

✅ Page Table : recherche à la voix (bouton « 🎙 Voix », affiché seulement sur mobile et tablette : masqué sur ordinateur, où la reconnaissance vocale n'était pas assez fiable ; la touche Entrée applique toujours l'analyse au texte tapé). On dit par exemple « sissonne à la poutre » : l'agrès cité est ouvert et l'élément filtré. Sans agrès cité, l'appli reste sur l'agrès affiché s'il a des résultats, sinon va sur celui qui en a le plus. Elle ignore les petits mots (« une », « les »…), les pluriels et rapproche un mot mal entendu du vocabulaire des éléments (« cissonne » → « sissonne »). Sur Chrome, Edge et Safari, elle utilise la reconnaissance vocale du navigateur. Sur les navigateurs qui n'en ont pas (Vivaldi, Brave, Firefox), elle bascule automatiquement sur une reconnaissance faite sur l'appareil (modèle Whisper, voir `src/lib/voixLocale.ts`) : au premier usage, un modèle d'environ 80 Mo (Whisper « base » ; « small » a été essayé : un peu plus juste mais ~13 s par phrase, jugé trop lent) est téléchargé une seule fois (internet nécessaire) puis gardé par le navigateur ; on parle, la phrase se termine au silence (ou en rappuyant sur le bouton), puis elle est transcrite. Les mots mal entendus sont rapprochés des noms d'éléments par le son (« cisonne », « sissone » → « sissonne » ; un nom coupé en deux est recollé ; « 6 zones » est lu « six zones » → sissonne ; « demain » → « mains »). Les confusions déjà relevées en essai sont corrigées d'office (« rume », « roux », « route » → roue ; « ronda » → rondade…). Apprentissage : quand rien ne correspond, on touche la bonne suggestion et l'appli retient « phrase mal entendue → ce nom » (dans le navigateur de l'appareil, clé `voixAppris`) ; la prochaine fois la même phrase ouvre directement le bon élément. Le nom de l'agrès aussi est rattrapé (« poudre », « pôtre » → poutre ; « au bar » → barres ; « ou sol » → au sol), et si rien ne correspond l'appli propose des noms qui ressemblent, à toucher. La touche Entrée applique aussi cette analyse au texte tapé dans la barre (ex. dictée Windows, Win + H).

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
