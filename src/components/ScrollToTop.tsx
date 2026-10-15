"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Chaque changement de page s'ouvre en haut : sans ça, depuis le bas d'une page longue (accueil), la page
// suivante pouvait s'ouvrir plus bas, avec la barre d'onglets hors de vue.
export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
