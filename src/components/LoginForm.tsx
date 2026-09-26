"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Adresse email invalide.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email ou mot de passe incorrect.";
    case "auth/email-already-in-use":
      return "Un compte existe déjà avec cet email.";
    case "auth/weak-password":
      return "Le mot de passe doit contenir au moins 6 caractères.";
    default:
      return "Une erreur est survenue. Réessayez.";
  }
}

export default function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "connexion") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      const code = err instanceof Error && "code" in err ? String((err as { code: unknown }).code) : "";
      setError(firebaseErrorMessage(code));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="mb-1 text-xl font-bold text-foreground">
        <span className="accent-gradient-text">Gestion Compétitions &amp; Entraînements</span>
      </h1>
      <p className="mb-6 text-sm text-muted">
        {mode === "connexion" ? "Connectez-vous pour accéder à vos données." : "Créez un compte pour synchroniser vos données entre vos appareils."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Mot de passe</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="accent-gradient w-full rounded px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      <button
        onClick={() => {
          setError(null);
          setMode((m) => (m === "connexion" ? "inscription" : "connexion"));
        }}
        className="mt-4 text-center text-sm accent-gradient-text font-medium"
      >
        {mode === "connexion" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>
    </main>
  );
}
