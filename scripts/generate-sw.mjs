// Génère le service worker APRÈS `next build` (export statique dans out/),
// pour pouvoir précacher les fichiers réellement exportés (noms hashés
// inclus). @serwist/next et next-pwa génèrent leur manifeste de précache
// PENDANT le build, avant que l'export statique existe -> incompatibles
// avec output: "export". D'où cet appel direct à workbox-build, lancé après.
import { generateSW } from "workbox-build";

const { count, size, warnings } = await generateSW({
  globDirectory: "out",
  globPatterns: ["**/*.{html,js,css,json,webmanifest,svg,png,ico,woff,woff2}"],
  swDest: "out/sw.js",
  cleanupOutdatedCaches: true,
  // IMPORTANT : ne pas activer automatiquement (skipWaiting/clientsClaim).
  // Le nouveau SW reste "en attente" tant qu'un onglet de l'ancienne version
  // tourne encore. Sinon, le nouveau SW prend le contrôle en arrière-plan et
  // purge du cache les fichiers (JS hashés) dont l'onglet resté ouvert a
  // encore besoin -> certains clics (ex. ouvrir le mouvement d'une gym)
  // échouent tant que la page n'est pas rechargée. À la place,
  // ServiceWorkerRegister.tsx déclenche l'activation (message SKIP_WAITING)
  // seulement quand le coach clique sur "Actualiser", juste avant un reload
  // complet.
  // SPA en export statique : toute navigation non trouvée dans le cache
  // retombe sur la page d'accueil précachée (fonctionne hors-ligne).
  navigateFallback: "/index.html",
});

if (warnings.length > 0) {
  console.warn("[generate-sw] avertissements :", warnings);
}
console.log(`[generate-sw] ${count} fichiers précachés (${(size / 1024).toFixed(0)} Ko) -> out/sw.js`);
