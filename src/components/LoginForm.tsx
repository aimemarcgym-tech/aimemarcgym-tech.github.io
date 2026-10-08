"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      // Toujours atterrir sur l'accueil après connexion, quelle que soit la
      // page/URL sur laquelle on se trouvait avant d'être déconnecté.
      router.push("/");
    } catch (err) {
      const code = err instanceof Error && "code" in err ? String((err as { code: unknown }).code) : "";
      setError(firebaseErrorMessage(code));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex w-full shrink-0 items-center justify-center gap-1.5 border-b border-border-subtle bg-surface-alt/60 px-6 py-3">
        <div className="accent-gradient -translate-x-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold tracking-tight text-white shadow-lg shadow-accent-from/20">
          GAF
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold uppercase tracking-wide text-foreground">Ufolep</div>
          <div className="text-sm font-medium text-muted">Gymnastique Artistique Féminine</div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-12 pb-10">
        <h1 className="mb-5 text-xl font-bold text-foreground">
          <span className="accent-gradient-text">Gestion Compétitions &amp; Entraînements</span>
        </h1>

        <div role="tablist" aria-label="Connexion ou création de compte" className="mb-4 flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1">
          {(
            [
              ["connexion", "Se connecter"],
              ["inscription", "Créer un compte"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setError(null);
                setMode(m);
              }}
              className={`flex-1 rounded px-3 py-2 text-sm font-semibold transition-colors ${
                mode === m ? "accent-gradient text-white shadow" : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className={`space-y-3 rounded-lg border p-4 shadow-sm ${
            mode === "connexion" ? "border-border-subtle bg-surface" : "border-accent-solid/70 bg-surface-alt"
          }`}
        >
          <div>
            <h2 className="text-base font-semibold text-foreground">{mode === "connexion" ? "Connexion" : "Nouveau compte"}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {mode === "connexion"
                ? "Vous avez déjà un compte : connectez-vous pour accéder à vos données."
                : "Première visite : créez votre compte pour synchroniser vos données entre vos appareils."}
            </p>
          </div>
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
            <label className="mb-1 block text-xs font-medium text-muted">
              {mode === "connexion" ? "Mot de passe" : "Choisissez un mot de passe (6 caractères minimum)"}
            </label>
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
      </main>
    </div>
  );
}
