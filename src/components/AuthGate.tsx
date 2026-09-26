"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";

// Protège l'ensemble de l'appli derrière la connexion : tant que l'état
// d'authentification n'est pas connu, écran de chargement ; si aucun
// utilisateur connecté, on affiche le formulaire de connexion à la place du
// contenu demandé (aucune page, y compris Généralités/Table, n'est publique).
export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
}
