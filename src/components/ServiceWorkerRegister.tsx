"use client";

import { useEffect, useRef, useState } from "react";

// Enregistre le service worker généré après le build (scripts/generate-sw.mjs)
// pour permettre le fonctionnement 100% hors-ligne une fois l'appli visitée
// une première fois en ligne. Sans effet en dev (le fichier sw.js n'existe
// que dans le dossier exporté par `npm run build`).
//
// Vérifie aussi régulièrement (retour en ligne, retour sur l'onglet, toutes
// les 30 min) si une nouvelle version a été publiée sur GitHub Pages, et
// affiche un bandeau pour la charger d'un clic — sans ça, un appareil garde
// sa version en cache indéfiniment tant qu'on ne vide pas le cache à la main.
//
// Le nouveau SW n'est PAS activé automatiquement (voir generate-sw.mjs) :
// tant que le coach n'a pas cliqué sur "Actualiser", l'onglet ouvert continue
// de tourner avec l'ancienne version et son cache intact. On ne déclenche le
// passage à la nouvelle version (message SKIP_WAITING) qu'au clic, juste
// avant un rechargement complet de la page.
export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const waitingRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const handleWaiting = (worker: ServiceWorker | null) => {
      if (worker) {
        waitingRef.current = worker;
        setUpdateReady(true);
      }
    };

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
        handleWaiting(r.waiting);
        r.addEventListener("updatefound", () => {
          const installing = r.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              handleWaiting(r.waiting ?? installing);
            }
          });
        });
        check();
      })
      .catch(() => {
        // Pas de sw.js en dev (uniquement généré au build) -> échec silencieux attendu.
      });

    // Une fois qu'on a nous-même déclenché SKIP_WAITING (clic "Actualiser"),
    // le nouveau SW prend le contrôle -> on recharge la page pour repartir
    // avec un JS et un cache cohérents entre eux.
    const onControllerChange = () => window.location.reload();
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
        onClick={() => waitingRef.current?.postMessage({ type: "SKIP_WAITING" })}
        className="rounded-md bg-accent-solid px-3 py-1 font-semibold text-white transition-opacity hover:opacity-90"
      >
        Actualiser
      </button>
    </div>
  );
}
