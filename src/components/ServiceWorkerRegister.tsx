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
// Le nouveau SW n'est PAS activé automatiquement PENDANT une session en cours
// (voir generate-sw.mjs) : si la mise à jour arrive alors que l'onglet est
// déjà ouvert (potentiellement en pleine saisie), on affiche un bandeau et on
// laisse le coach choisir le moment (clic "Actualiser") avant de recharger.
//
// En revanche, si une mise à jour est DÉJÀ en attente dès l'ouverture de la
// page (téléchargée en arrière-plan lors d'une session précédente, avant même
// que ce composant s'exécute), on l'applique automatiquement et on recharge
// une fois, sans rien demander : il n'y a rien en cours à ce moment-là, donc
// aucun risque, et ça évite au coach de devoir savoir qu'il faut fermer/
// rouvrir l'appli pour obtenir la dernière version.
export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const waitingRef = useRef<ServiceWorker | null>(null);
  const autoAppliedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const handleWaiting = (worker: ServiceWorker | null, auto: boolean) => {
      if (!worker) return;
      if (auto && !autoAppliedRef.current) {
        autoAppliedRef.current = true;
        worker.postMessage({ type: "SKIP_WAITING" });
        return;
      }
      waitingRef.current = worker;
      setUpdateReady(true);
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
        // Déjà en attente avant même d'avoir rien fait cette session ->
        // laissée par une vérification précédente, rien à protéger.
        handleWaiting(r.waiting, true);
        r.addEventListener("updatefound", () => {
          const installing = r.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // Mise à jour détectée PENDANT cette session -> on demande.
              handleWaiting(r.waiting ?? installing, false);
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
