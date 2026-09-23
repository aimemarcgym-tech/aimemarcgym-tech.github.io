"use client";

import { useEffect, useState } from "react";

// Enregistre le service worker généré après le build (scripts/generate-sw.mjs)
// pour permettre le fonctionnement 100% hors-ligne une fois l'appli visitée
// une première fois en ligne. Sans effet en dev (le fichier sw.js n'existe
// que dans le dossier exporté par `npm run build`).
//
// Vérifie aussi régulièrement (retour en ligne, retour sur l'onglet, toutes
// les 30 min) si une nouvelle version a été publiée sur GitHub Pages, et
// affiche un bandeau pour la charger d'un clic — sans ça, un appareil garde
// sa version en cache indéfiniment tant qu'on ne vide pas le cache à la main.
export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const hadControllerAtLoad = !!navigator.serviceWorker.controller;
    let registration: ServiceWorkerRegistration | null = null;

    const check = () => registration?.update().catch(() => {});
    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);
    const interval = setInterval(check, 30 * 60 * 1000);

    navigator.serviceWorker
      .register("/sw.js")
      .then((r) => {
        registration = r;
        check();
      })
      .catch(() => {
        // Pas de sw.js en dev (uniquement généré au build) -> échec silencieux attendu.
      });

    // Une nouvelle version a pris le contrôle (skipWaiting + clientsClaim) :
    // on le signale plutôt que de recharger tout seul, pour ne pas couper
    // l'entraîneur en pleine saisie.
    const onControllerChange = () => {
      if (hadControllerAtLoad) setUpdateReady(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", check);
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 border-b border-border-strong bg-surface-alt px-4 py-2 text-sm text-foreground">
      <span>Nouvelle version de l&apos;application disponible.</span>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-accent-solid px-3 py-1 font-semibold text-white transition-opacity hover:opacity-90"
      >
        Actualiser
      </button>
    </div>
  );
}
