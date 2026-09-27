"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";
import TopTabs from "@/components/TopTabs";

// Protège l'ensemble de l'appli derrière la connexion : tant que l'état
// d'authentification n'est pas connu, écran de chargement ; si aucun
// utilisateur connecté, on affiche le formulaire de connexion à la place du
// contenu demandé (aucune page, y compris Généralités/Table, n'est publique).
//
// Exception : /partage/* sont des pages de consultation publique (lien de
// partage sans compte, voir src/lib/shares.ts) — ni connexion requise, ni
// barre de navigation habituelle.
export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (pathname.startsWith("/partage/")) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Chargement…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <>
      <TopTabs />
      {children}
    </>
  );
}
