import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Identifiants publics du projet Firebase — sans risque à committer, la
// sécurité repose sur les règles Firestore (voir la console Firebase),
// jamais sur le secret de cette config.
const firebaseConfig = {
  apiKey: "AIzaSyDygNIVfp_VSskpZpRwIk-RmdchN6qzJl4",
  authDomain: "ufolep-gaf.firebaseapp.com",
  projectId: "ufolep-gaf",
  storageBucket: "ufolep-gaf.firebasestorage.app",
  messagingSenderId: "994005129937",
  appId: "1:994005129937:web:5d3f4797c2c92c067403f0",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Cache local persistant (IndexedDB) + support multi-onglets : permet à
// l'appli de continuer à fonctionner hors-ligne une fois qu'un premier
// chargement en ligne a eu lieu, exactement comme le principe déjà en place
// avec l'IndexedDB local (voir src/lib/idb.ts).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Mis à jour par AuthContext dès qu'un utilisateur se connecte/déconnecte.
// Évite de faire transiter un uid à travers chaque fonction de src/lib/data.ts
// (des dizaines de call sites) alors que ces fonctions ne sont de toute
// façon appelées que depuis des pages protégées par la connexion.
let currentUid: string | null = null;

export function setCurrentUid(uid: string | null) {
  currentUid = uid;
}

export function getCurrentUid(): string {
  if (!currentUid) {
    throw new Error("Aucun utilisateur connecté — cette fonction ne doit être appelée que depuis une page protégée.");
  }
  return currentUid;
}
