// Partage natif de l'appareil (Web Share API) : les musiques/photos/vidéos
// restent uniquement locales (pas de copie cloud), donc "partager" ne peut
// pas être un lien — c'est l'appareil (téléphone/PC) qui ouvre sa fenêtre de
// partage habituelle (WhatsApp, mail, AirDrop, clé USB...) et le coach choisit
// lui-même la destination.

type NavigatorWithShare = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

export type ShareResult = "shared" | "cancelled" | "unsupported" | "error";

export function canShareFiles(): boolean {
  const nav = navigator as NavigatorWithShare;
  return typeof nav.share === "function" && typeof nav.canShare === "function";
}

export async function shareFiles(files: File[], meta?: { title?: string; text?: string }): Promise<ShareResult> {
  const nav = navigator as NavigatorWithShare;
  if (!nav.share || !nav.canShare) return "unsupported";
  const data: ShareData = { files, title: meta?.title, text: meta?.text };
  if (!nav.canShare(data)) return "unsupported";
  try {
    await nav.share(data);
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "error";
  }
}
