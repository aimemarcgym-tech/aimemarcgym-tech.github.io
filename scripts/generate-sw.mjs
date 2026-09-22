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
  // Sans ça, un nouveau service worker téléchargé reste "en attente" tant
  // qu'un onglet de l'ancienne version reste ouvert quelque part -> les
  // mises à jour ne s'appliquaient jamais malgré un rechargement complet.
  // Ici on force l'activation immédiate de chaque nouvelle version.
  skipWaiting: true,
  clientsClaim: true,
  // SPA en export statique : toute navigation non trouvée dans le cache
  // retombe sur la page d'accueil précachée (fonctionne hors-ligne).
  navigateFallback: "/index.html",
});

if (warnings.length > 0) {
  console.warn("[generate-sw] avertissements :", warnings);
}
console.log(`[generate-sw] ${count} fichiers précachés (${(size / 1024).toFixed(0)} Ko) -> out/sw.js`);
