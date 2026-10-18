# Architecture de référence — appli UFOLEP GAF

Ce document résume l'architecture d'une PWA de gestion de compétitions/entraînements de gymnastique (fédération UFOLEP, section GAF), pour servir de point de départ à un **nouveau projet séparé** pour une autre fédération (FFG). Colle ce fichier dans le nouveau projet (par ex. comme `CLAUDE.md` ou en le donnant en premier message à Claude) pour qu'il parte avec le contexte complet au lieu de repartir de zéro.

**Rien ici n'est copié automatiquement** — c'est une référence à lire, pas du code à réutiliser tel quel. Les règles/données réglementaires elles-mêmes (fichiers JSON, barèmes) sont 100% spécifiques à l'UFOLEP GAF et ne s'appliquent pas à la FFG : seule l'**architecture logicielle** est transposable.

## Principe fondateur (à réappliquer, quelle que soit la fédération)

**Ne jamais inventer de donnée réglementaire.** Tout ce qui n'est pas fiablement vérifiable dans les documents officiels de la fédération doit être marqué "⚠ à confirmer" plutôt que deviné. C'est la règle la plus importante du projet — elle a évité de nombreux bugs de confiance (données de notation fausses = un coach note mal une gymnaste en vrai).

## Stack technique

- **Next.js 16 (App Router)**, TypeScript, React 19, Tailwind CSS v4.
- **Export statique** (`output: "export"` dans `next.config.ts`, `trailingSlash: true`) : appli 100% cliente, aucun serveur Next en prod. Hébergée sur **GitHub Pages** via un dossier `docs/` synchronisé à chaque build (`scripts/sync-docs.mjs`).
- **PWA** : service worker généré après le build (`scripts/generate-sw.mjs`, précache tous les assets) pour fonctionnement 100% hors-ligne une fois visité en ligne. `src/components/ServiceWorkerRegister.tsx` gère la détection de nouvelle version (bannière "Actualiser", pas de rechargement forcé en pleine saisie).
- **Firebase Auth + Firestore** pour les données "légères" (texte/structure), synchronisées entre appareils d'un même compte coach.
- **IndexedDB** (librairie `idb`) pour les données binaires lourdes (musiques, photos, vidéos) — **volontairement non synchronisées** dans le cloud (choix pris avec l'utilisateur pour éviter les coûts Firebase Storage à l'échelle ; l'export/import JSON manuel sert de mécanisme de sauvegarde/transfert entre appareils).
- Build : `next build && node scripts/generate-sw.mjs && node scripts/sync-docs.mjs`.

```
package.json (dépendances clés)
  firebase, idb, next, react, react-dom
  @tailwindcss/postcss, tailwindcss, typescript, workbox-build (build du SW)
```

## Arborescence

```
src/
  app/                      routes Next.js App Router (une page = un dossier)
    page.tsx                accueil (liste gymnastes par club/équipe)
    connexion/               page de login (email/mdp Firebase Auth)
    mouvement/               constructeur de mouvement (agrès + évolution)
    gymnaste/                fiche gymnaste (mouvements, profil technique)
    entrainement/            journal d'entraînement (technique/physique)
    competition/
      calendrier/            calendrier des compétitions (données externes, cf. plus bas)
      musiques/               gestion musiques d'équipe
      ordres-passage/         ordre de passage par agrès
      categories-age/         barème âges/catégories
      resultats/              (selon fédération)
    media/{photos,videos}/    albums photo/vidéo
    partage/                  pages PUBLIQUES (pas d'auth) pour les liens de partage
      mouvement/, ordre-passage/, ordres-passage/, programme/
    sauvegarde/                export/import JSON complet
    table/                    vue tableau de bord
    generalites/               règlement général (âges, tenue, matériel...)
    layout.tsx                 layout racine (AuthProvider + AuthGate)
    globals.css                 thème CSS (variables couleur, dark/light)

  components/                composants React (un fichier = un composant, PAS de sous-dossiers)
  contexts/AuthContext.tsx    contexte Firebase Auth (user, loading, signIn/signUp/signOut)
  hooks/                       hooks réutilisables (ex. useDragReorder.ts)

  lib/                        couche "métier" hors UI
    firebase.ts               init Firebase (auth, db avec persistance offline)
    data.ts                    TOUTES les fonctions CRUD (Firestore + IndexedDB), signatures stables
    backup.ts                  export/import JSON complet (multi-device + File System Access API)
    shares.ts                  partage par lien public (snapshot Firestore, collection séparée)
    share.ts                   partage NATIF (Web Share API) pour fichiers locaux (photos/vidéos/musique)
    idb.ts                     schéma IndexedDB (types de lignes + ouverture DB)
    format.ts                   helpers de formatage partagés (tailles fichiers, etc.)
    teamColor.ts                 helper cosmétique

  regulation/                 ⭐ LE COEUR RÉUTILISABLE : moteur de règlement data-driven
    types.ts                   types du modèle réglementaire (Palier, Arche, RegElement, Evolution, CheckSpec)
    loader.ts                   charge les JSON par agrès, expose getRegulation/getElement/getArche/getEvolution
    checks.ts                   associe un id d'exigence/valorisation à un CheckSpec (règle vérifiable)
    variants.ts                  petits helpers de classification (ex/variantes, cross-listing)
    data/
      <agres>/arches.json        liste des "arches" (familles d'éléments) par agrès
      <agres>/elements.json      liste des éléments codifiés (code, nom, palier, arche...)
      <agres>/decomposition.json barème par évolution (tronc commun + valorisations)
      <agres>/reference.json     référence/lexique affiché dans l'appli
      generalites.json           règles générales (âges, tenue, matériel, pénalités...)
      categories-age.json        barème âges → catégories
      calendrier.json            calendrier compétitions (scrappé depuis Google Sheets, voir plus bas)

  engine/                     calcul de la note à partir d'une séquence d'éléments + du règlement
    composition.ts             agrès "classiques" (Sol/Barres/Poutre) : tronc commun + valorisations génériques
    saut.ts                     agrès Saut : modèle différent (barème de valeur fixe par palier, pas de tronc commun cumulatif)
```

## Le moteur de règlement data-driven (`regulation/` + `engine/`) — partie la plus réutilisable

C'est le design le plus important à reproduire pour la FFG, **même si les données changent entièrement**.

1. **Les règles ne sont jamais codées en dur dans les composants.** Chaque exigence de tronc commun ou option de valorisation a un `id` (ex. `"P-B1-TC-3"`) défini dans `decomposition.json`, et cet id est mappé vers un `CheckSpec` typé dans `checks.ts` :
   ```ts
   type CheckSpec =
     | { type: "CATEGORY_COUNT"; category: string; min: number; branch?: string }
     | { type: "ELEMENT_AT_PALIER_MIN"; palierMin: Palier; category?: string; min?: number }
     | { type: "SALTO_AT_PALIER_MIN"; palierMin: Palier }
     | { type: "TWO_ACRO_DIFFERENT_DIRECTIONS" }
     | { type: "LIAISON_ACRO"; runMinLength: number; runsNeeded: number }
     | { type: "FORCE_OR_PG" }
     | { type: "NAME_CONTAINS_ALL"; terms: string[]; min?: number }
     | { type: "MANUAL" }; // pas vérifiable automatiquement -> confirmation manuelle du coach
   ```
   `engine/composition.ts` a une fonction générique `evaluateCheck(apparatus, spec, elements, context)` qui sait évaluer chacun de ces types contre une séquence d'éléments. Ajouter une nouvelle sorte de règle = ajouter un cas au union type + un cas dans le switch, pas toucher aux données existantes.

2. **`context: "TRONC_COMMUN" | "VALORISATION"`** — certains paliers (ex. "Prérequis") comptent pour le tronc commun mais jamais pour une valorisation ; le moteur exclut certains éléments du set "utilisable" selon le contexte d'évaluation, pas au niveau des données.

3. **Les éléments "cross-listés"** (un même élément compte dans 2 catégories, ex. une sortie qui compte aussi comme un acro) sont modélisés via `extraCategories?: string[]` sur l'élément — PAS en dupliquant la ligne JSON avec un `code` différent (piège identifié et corrigé dans ce projet : dupliquer la ligne avec le même `code` casse les clés React et les Map indexées par code — préférer toujours `extraCategories` à la duplication).

4. **Génération de suggestions** ("Assistant") : `computeSuggestions()` simule l'ajout de chaque élément candidat non utilisé et compare avant/après sur chaque exigence manquante — permet de dire "ajouter X complète l'exigence Y" sans logique spécifique par exigence.

5. **Import des données réglementaires** : parties depuis des PDF/tableaux officiels, transcrites à la main en JSON avec `verified: true/false` et `sourcePage` pour tracer la provenance — **ne jamais deviner une valeur manquante**, la laisser vide/absente et flaguer.

## Firebase — structure Firestore

```
users/{uid}/
  clubs/{id}
  gymnasts/{id}            (+ passageOrder, musicOrder, homeOrder pour le drag-and-drop)
  gymnastSkills/{id}        (statut de maîtrise par élément et par gymnaste)
  movements/{id}
  movementElements/{id}
  movementSnapshots/{id}    (historique horodaté d'un mouvement)
  trainingSessions/{id}     (journal d'entraînement, par gymnaste OU par équipe)
  meta/migration            (doc témoin : migration one-shot IndexedDB -> Firestore au premier login)

shares/{shareId}            collection PUBLIQUE séparée (hors users/{uid}) — instantanés figés
                            pour le partage par lien sans compte (jamais de référence live)
```

Règles de sécurité Firestore :
```
match /databases/{database}/documents {
  match /users/{uid}/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  match /shares/{shareId} {
    allow read: if true;
    allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
    allow update, delete: if request.auth != null && resource.data.ownerUid == request.auth.uid;
  }
}
```

`src/lib/data.ts` centralise TOUTES les opérations Firestore derrière des fonctions nommées (`getGymnasts`, `createMovement`, `saveMovementElements`...) — jamais d'accès Firestore direct depuis un composant. Helpers internes `col()`/`docRef()` scopent automatiquement sur `users/{uid}/...`.

## Partage par lien public (pattern à reproduire si utile)

- `src/lib/shares.ts` : `createShare(type, data)` écrit un **instantané figé** (pas une référence live) dans `shares/{id}`, `getShare(id)` le relit publiquement (pas de `getCurrentUid()`).
- `src/components/AuthGate.tsx` laisse passer les routes `/partage/*` sans vérifier la connexion (et n'affiche pas la nav).
- Chaque type de partage a son propre payload typé (`MovementShareData`, `PassageOrderShareData`, `TrainingJournalShareData`...) et sa propre page publique de lecture sous `src/app/partage/`.
- Pièces jointes (PDF...) encodées en base64 directement dans le document Firestore (pas de vrai stockage de fichiers) — plafonné pour rester sous la limite de 1 Mo/document Firestore.

## Sauvegarde manuelle (musiques/photos/vidéos)

`src/lib/backup.ts` exporte TOUT (Firestore + IndexedDB) en un seul JSON téléchargeable (blobs binaires en base64), et sait le réimporter (remplace tout). `downloadBackup()` utilise `showSaveFilePicker` (File System Access API, Chrome/Edge desktop) quand disponible pour laisser choisir l'emplacement, avec repli sur téléchargement classique sinon.

## Glisser-déposer (pattern réutilisable)

`src/hooks/useDragReorder.ts` : réordonnancement par **Pointer Events** (pas l'API HTML5 Drag and Drop native, qui ne marche pas du tout sur mobile tactile). Capture du pointeur dès `pointerdown` (`setPointerCapture`), position des éléments mesurée une seule fois au début du drag (pas à chaque `pointermove`, pour éviter un reflow forcé). `src/components/DragHandle.tsx` = poignée visuelle standard (zone tactile 40×40).

## Conventions de code observées

- Composants : un fichier par composant dans `src/components/`, pas de sous-dossiers, pas de barrel `index.ts`.
- Commentaires : uniquement pour expliquer un POURQUOI non-évident (contrainte cachée, bug contourné) — jamais pour décrire ce que fait le code.
- Pas d'abstraction prématurée : dupliquer 3 lignes est préférable à une abstraction à un seul appelant.
- TypeScript strict, `npx tsc --noEmit` après chaque changement.
- Déploiement : `npm run build` puis `git add`/`commit`/`push` sur `main` (GitHub Pages sert directement `docs/`).

## Ce qui NE se transpose PAS (spécifique UFOLEP GAF, à refaire pour la FFG)

- Tous les fichiers `regulation/data/**/*.json` (arches, éléments, barèmes, évolutions A1→C3, valorisations, âges/catégories) — à reconstruire depuis les documents officiels FFG, avec la même discipline "jamais inventer, flaguer ⚠".
- Le calendrier (`calendrier.json`) est scrappé depuis un Google Sheets spécifique UFOLEP (format CSV via l'endpoint `gviz/tq?tqx=out:csv&gid=...`) — la FFG aura probablement une autre source (à identifier).
- Les `CheckSpec` concrets utilisés dans `checks.ts` encodent des règles UFOLEP précises — le *type* de système (id → CheckSpec → evaluateCheck) est réutilisable, pas les règles elles-mêmes.
- Univers "Saut" à part (`engine/saut.ts`) : à vérifier si la FFG a un système équivalent ou si tous les agrès suivent le même modèle tronc commun + valorisations.

## Pour démarrer le nouveau projet

1. `npx create-next-app` (App Router, TypeScript, Tailwind) en reprenant `next.config.ts` (export statique) si l'appli doit rester 100% cliente/hébergeable sur GitHub Pages.
2. Recréer `src/regulation/types.ts` avec les concepts FFG équivalents (paliers/niveaux, arches/familles, évolutions/catégories — les noms exacts dépendent du règlement FFG).
3. Construire `checks.ts` au fur et à mesure que les exigences FFG sont transcrites, pas tout d'un coup.
4. Copier le pattern Firebase (`firebase.ts`, `AuthContext.tsx`, `AuthGate.tsx`) tel quel, juste avec un nouveau projet Firebase.
5. Redemander explicitement, comme dans ce projet, où sont les documents/PDF officiels FFG avant d'écrire la moindre donnée réglementaire.
