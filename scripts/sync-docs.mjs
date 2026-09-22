// Copie le résultat du build (out/) vers docs/, qui EST suivi par git et
// sert de dossier source pour GitHub Pages en mode "Deploy from a branch"
// (Réglages du dépôt -> Pages -> Branch: main, Folder: /docs). Ce mode
// permet une mise à jour manuelle par glisser-déposer sur github.com,
// sans passer par un pipeline de build côté GitHub.
import { cpSync, rmSync, existsSync } from "node:fs";

if (existsSync("docs")) rmSync("docs", { recursive: true, force: true });
cpSync("out", "docs", { recursive: true });

console.log("[sync-docs] out/ copié vers docs/ (à glisser-déposer sur github.com).");
