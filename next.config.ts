import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Appli 100% cliente (IndexedDB, pas de serveur) : export statique pour
  // pouvoir être hébergée n'importe où et fonctionner hors-ligne via le
  // service worker (voir scripts/generate-sw.mjs).
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
