"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, writeBatch, collection } from "firebase/firestore";
import { auth, db, setCurrentUid } from "@/lib/firebase";
import { getDb } from "@/lib/idb";

// Les 6 stores IndexedDB synchronisés vers Firestore — mêmes noms que
// src/lib/backup.ts (STORES), qui délimitait déjà les données "légères"
// (hors musiques/photos/vidéos, qui restent purement locales).
const SYNCED_STORES = [
  "clubs",
  "gymnasts",
  "gymnastSkills",
  "movements",
  "movementElements",
  "movementSnapshots",
] as const;

// Migration one-shot des données locales déjà présentes sur l'appareil vers
// le compte cloud qui vient de se connecter — seulement si ce compte n'a
// encore aucune donnée (voir doc users/{uid}/meta/migration). Ne s'exécute
// donc qu'une fois, sur le tout premier appareil qui se connecte à ce
// compte ; voir le plan pour la limite connue si un 2e appareil avait déjà
// des données locales différentes.
async function migrateLocalDataIfNeeded(uid: string) {
  const migrationRef = doc(db, "users", uid, "meta", "migration");
  const migrationSnap = await getDoc(migrationRef);
  if (migrationSnap.exists()) return;

  const localDb = await getDb();
  const counts: Record<string, number> = {};

  for (const storeName of SYNCED_STORES) {
    const rows = await localDb.getAll(storeName as never);
    counts[storeName] = rows.length;
    // writeBatch limite à 500 opérations : on découpe par lots de 450.
    for (let i = 0; i < rows.length; i += 450) {
      const batch = writeBatch(db);
      for (const row of rows.slice(i, i + 450)) {
        const rowId = (row as { id: string }).id;
        batch.set(doc(collection(db, "users", uid, storeName), rowId), row as Record<string, unknown>);
      }
      await batch.commit();
    }
  }

  await setDoc(migrationRef, { migratedAt: new Date().toISOString(), counts });
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUid(firebaseUser?.uid ?? null);
      if (firebaseUser) {
        await migrateLocalDataIfNeeded(firebaseUser.uid);
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  return ctx;
}
