// Classes Tailwind partagées par les composants de "Faire ces musiques"
// (mêmes teintes que le reste de l'appli : border-strong, surface-alt,
// accent-solid...).
export const champ =
  "w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none";
export const panneau = "rounded-lg border border-border-subtle bg-surface p-4";
export const titrePanneau = "mb-3 text-sm font-bold uppercase tracking-wide text-muted";
export const onglets = "flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1";
export const ongletBouton = (actif: boolean, extra = "flex-1 px-2 py-1.5") =>
  `${extra} rounded text-xs font-semibold uppercase tracking-wide ${actif ? "accent-gradient text-white" : "text-muted hover:text-foreground"}`;
