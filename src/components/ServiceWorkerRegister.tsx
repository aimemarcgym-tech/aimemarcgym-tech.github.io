"use client";

import { useEffect } from "react";

// Enregistre le service worker généré après le build (scripts/generate-sw.mjs)
// pour permettre le fonctionnement 100% hors-ligne une fois l'appli visitée
// une première fois en ligne. Sans effet en dev (le fichier sw.js n'existe
// que dans le dossier exporté par `npm run build`).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Pas de sw.js en dev (uniquement généré au build) -> échec silencieux attendu.
    });
  }, []);

  return null;
}
