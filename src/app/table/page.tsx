"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getRegulation, getAvailableApparatuses } from "@/regulation/loader";
import { palierRank, type Palier } from "@/regulation/types";
import { isVariantElement, isMousseElement } from "@/regulation/variants";
import DecompositionNote from "@/components/DecompositionNote";
import { preparerModele, enregistrerVoix, transcrire } from "@/lib/voixLocale";

const APPARATUS_LABELS: Record<string, string> = {
  SAUT: "Saut",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SOL: "Sol",
};

function palierLabel(p: Palier) {
  if (p === "BASE") return "Base";
  if (p === "NOMADE") return "Nomade";
  if (p === "PREREQUIS") return "Prérequis";
  return p;
}

// Prérequis, Base et Nomade regroupés en tête de chaque tableau d'arche,
// avant les paliers gradués P1-P7.
function topGroupRank(p: Palier): number {
  if (p === "PREREQUIS" || p === "PR1" || p === "PR2" || p === "PR3") return 0;
  if (p === "BASE") return 1;
  if (p === "NOMADE") return 2;
  return 3;
}

function palierBadgeClasses(p: Palier) {
  if (p === "PREREQUIS") return "border-border-strong text-muted";
  if (p === "BASE") return "border-sky-400/40 bg-sky-400/10 text-sky-300";
  if (p === "NOMADE") return "border-yellow-400/40 bg-yellow-400/10 text-yellow-300";
  return "border-accent-solid/50 bg-accent-from/10 text-white";
}

// Sans majuscules ni accents, pour qu'« ecart » retrouve « écarté ».
function normaliser(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Tous les mots tapés doivent se retrouver dans le code, le nom, la branche ou le palier de l'élément.
function correspond(el: { code: string; name: string; branch?: string | null; palier: Palier }, mots: string[]) {
  if (mots.length === 0) return true;
  const texte = normaliser(`${el.code} ${el.name} ${el.branch ?? ""} ${palierLabel(el.palier)}`);
  return mots.every((m) => texte.includes(m));
}

// Reconnaissance vocale du navigateur (Chrome, Edge, Safari ; absente de Firefox). Types minimaux, non fournis par TypeScript.
type Reconnaissance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type FabriqueReconnaissance = new () => Reconnaissance;

// « Sissonne à la poutre » → { agres: "POUTRE", texte: "sissonne" }. Sans agrès cité, l'agrès affiché ne change pas.
function analyserDictee(dite: string): { agres: string | null; texte: string } {
  const n = normaliser(dite).replace(/[.,!?;:]/g, " ").replace(/\s+/g, " ").trim();
  const agresDe = (mot: string) => (mot.startsWith("barre") ? "BARRES_ASYM" : mot === "saut" ? "SAUT" : mot === "poutre" ? "POUTRE" : "SOL");
  const motif = "(saut|barres?(?: asymetriques?)?|poutre|sol)";
  const avecPrep = new RegExp(`\\b(?:a la|a|au|aux|en|sur la|sur le|sur|de la|du|de)\\s+${motif}\\b`);
  const seul = new RegExp(`\\b${motif}\\s*$`);
  const m = n.match(avecPrep) ?? n.match(seul);
  if (!m) return { agres: null, texte: n };
  return { agres: agresDe(m[m.length - 1] ?? m[1]), texte: n.replace(m[0], " ").replace(/\s+/g, " ").trim() };
}

// Petits mots qu'on dit sans qu'ils fassent partie du nom d'un élément (« une sissonne », « montre-moi la roue »).
const MOTS_VIDES = new Set(["le", "la", "les", "un", "une", "des", "du", "de", "d", "l", "et", "a", "au", "aux", "en", "avec", "pour", "sur", "moi", "je", "veux", "voir", "montre", "affiche", "cherche", "recherche", "trouve", "element", "elements"]);

function distance(a: string, b: string) {
  let prec = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cour = [i];
    for (let j = 1; j <= b.length; j++) cour[j] = Math.min(prec[j] + 1, cour[j - 1] + 1, prec[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prec = cour;
  }
  return prec[b.length];
}

// Mots du vocabulaire des éléments, pour rattraper un mot mal entendu (« cissonne » → « sissonne »).
function vocabulaire(agres: string[]): string[] {
  const s = new Set<string>();
  for (const a of agres) for (const e of getRegulation(a as never).elements) for (const t of normaliser(e.name).split(/[^a-z0-9]+/)) if (t.length >= 3) s.add(t);
  return [...s];
}

function corrigerMots(mots: string[], vocab: string[]) {
  return mots.map((m) => {
    if (m.length < 4 || /\d/.test(m) || vocab.some((t) => t.includes(m))) return m;
    const tolerance = m.length >= 8 ? 2 : 1;
    let meilleur = m;
    let d = tolerance + 1;
    for (const t of vocab) {
      const x = distance(m, t);
      if (x < d) {
        d = x;
        meilleur = t;
      }
    }
    return d <= tolerance ? meilleur : m;
  });
}

// Zone qu'on fait glisser au doigt (ou à la souris) vers la gauche ou la droite pour voir les colonnes cachées.
// Le défilement vertical de la page reste natif (touch-action: pan-y) ; seul le glissement horizontal est géré ici.
function ZoneGlissante({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const depart = useRef<{ x: number; gauche: number } | null>(null);
  const [glisse, setGlisse] = useState(false);

  function fin() {
    depart.current = null;
    setGlisse(false);
  }

  return (
    <div>
      <p className="px-3 pt-2 text-[11px] text-muted sm:hidden">↔ Fais glisser le tableau pour voir les autres colonnes</p>
      <div
        ref={ref}
        className={`touch-pan-y overflow-x-auto overscroll-x-contain ${glisse ? "cursor-grabbing select-none" : "cursor-grab"}`}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          depart.current = { x: e.clientX, gauche: ref.current?.scrollLeft ?? 0 };
          if (e.pointerType === "mouse") e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = depart.current;
          if (!d || !ref.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 3) setGlisse(true);
          ref.current.scrollLeft = d.gauche - dx;
        }}
        onPointerUp={fin}
        onPointerCancel={fin}
        onPointerLeave={(e) => e.pointerType !== "mouse" && fin()}
      >
        {children}
      </div>
    </div>
  );
}

export default function TablePage() {
  const apparatuses = getAvailableApparatuses();
  const [apparatus, setApparatus] = useState(apparatuses[0]);
  const [vue, setVue] = useState<"elements" | "decomposition">("elements");
  const [recherche, setRecherche] = useState("");
  const [ecoute, setEcoute] = useState(false);
  const [messageVoix, setMessageVoix] = useState<string | null>(null);
  const recoRef = useRef<Reconnaissance | null>(null);
  const arretLocal = useRef<AbortController | null>(null);

  // Comprend une phrase (dictée ou tapée puis validée par Entrée) : « sissonne à la poutre » ouvre la Poutre et filtre « sissonne ».
  function appliquerDictee(dite: string) {
    const { agres: cite, texte } = analyserDictee(dite);
    const citeValide = cite && apparatuses.includes(cite as (typeof apparatuses)[number]) ? cite : null;
    const cibles: string[] = citeValide ? [citeValide] : [...apparatuses];
    // Sans petits mots, au singulier, avec les mots mal entendus rapprochés du vocabulaire des éléments.
    const brut = texte
      .split(" ")
      .filter((m) => m && !MOTS_VIDES.has(m))
      .map((m) => (m.length > 4 && /[sx]$/.test(m) ? m.slice(0, -1) : m));
    const corriges = corrigerMots(brut, vocabulaire(cibles));
    const total = (mots: string[]) => cibles.reduce((n, a) => n + getRegulation(a as never).elements.filter((el) => correspond(el, mots)).length, 0);
    // Si rien ne correspond à tous les mots, on retire un mot à la fois (le premier qui donne des résultats).
    let mots = corriges;
    if (total(mots) === 0 && corriges.length > 1) {
      const essais = corriges.map((_, i) => corriges.filter((__, j) => j !== i));
      mots = essais.find((x) => total(x) > 0) ?? corriges;
    }
    // Sans agrès cité : on reste sur l'agrès affiché s'il a des résultats, sinon on va sur celui qui en a le plus.
    let agresFinal = apparatus as string;
    if (citeValide) agresFinal = citeValide;
    else if (mots.length > 0) {
      const nb = (a: string) => getRegulation(a as never).elements.filter((el) => correspond(el, mots)).length;
      if (nb(agresFinal) === 0) agresFinal = [...apparatuses].sort((x, y) => nb(y) - nb(x))[0] as string;
    }
    setApparatus(agresFinal as (typeof apparatuses)[number]);
    setVue("elements");
    setRecherche(mots.join(" "));
    const cherche = mots.join(" ");
    // Les résultats s'affichent plus bas que la barre : on y amène l'écran pour qu'on les voie tout de suite.
    setTimeout(() => document.getElementById("resultats-table")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    setMessageVoix(
      total(mots) === 0
        ? `J’ai compris : « ${dite} ». Aucun élément trouvé, essaie de redire seulement le nom de l’élément.`
        : `J’ai compris : « ${dite} ». Recherche : « ${cherche} ».`,
    );
  }

  // Dicte un élément avec le micro du navigateur.
  // Reconnaissance sur l'appareil (Whisper) : marche partout, y compris Vivaldi, Brave et Firefox, qui n'ont pas le service vocal de Google.
  // Au premier usage, un modèle d'environ 80 Mo est téléchargé une seule fois, puis gardé par le navigateur.
  async function dicterLocal() {
    const ctrl = new AbortController();
    arretLocal.current = ctrl;
    setEcoute(true);
    try {
      setMessageVoix("Préparation de la reconnaissance vocale… (au premier usage : téléchargement d’environ 80 Mo, une seule fois)");
      await preparerModele((p) => setMessageVoix(`Téléchargement du modèle vocal : ${p} % (une seule fois, puis il est gardé)`));
      if (ctrl.signal.aborted) return;
      setMessageVoix("🎙 Parle maintenant (la phrase se termine au silence). Rappuie sur le bouton pour arrêter.");
      const audio = await enregistrerVoix(ctrl.signal);
      if (!audio) {
        setMessageVoix("Je n’ai rien entendu, réessaie en parlant juste après avoir appuyé.");
        return;
      }
      setMessageVoix("Je transcris…");
      const texte = await transcrire(audio);
      if (!texte) setMessageVoix("Je n’ai rien compris, réessaie.");
      else appliquerDictee(texte);
    } catch (e) {
      const nom = e instanceof Error ? e.name : "";
      setMessageVoix(
        nom === "NotAllowedError" || nom === "SecurityError"
          ? "Le micro est refusé : clique sur le cadenas à gauche de l’adresse et autorise le micro pour ce site."
          : nom === "NotFoundError"
            ? "Aucun micro détecté sur cet appareil."
            : "Impossible de charger la reconnaissance vocale : vérifie ta connexion internet (nécessaire une première fois) et réessaie.",
      );
    } finally {
      arretLocal.current = null;
      setEcoute(false);
    }
  }

  function surBoutonVoix() {
    // Pendant l'enregistrement local, un nouvel appui l'arrête et lance la transcription.
    if (arretLocal.current) {
      arretLocal.current.abort();
      return;
    }
    dicter();
  }

  function dicter() {
    const w = window as unknown as { SpeechRecognition?: FabriqueReconnaissance; webkitSpeechRecognition?: FabriqueReconnaissance };
    const Fabrique = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    // Sans service vocal du navigateur (ou s'il a déjà échoué ici), on utilise directement la reconnaissance sur l'appareil.
    let dejaLocal = false;
    try {
      dejaLocal = localStorage.getItem("voixLocale") === "1";
    } catch {}
    if (!Fabrique || dejaLocal) {
      void dicterLocal();
      return;
    }
    setMessageVoix(null);
    const r = new Fabrique();
    r.lang = "fr-FR";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => appliquerDictee(e.results[0]?.[0]?.transcript ?? "");
    let recu = false;
    let erreur = false;
    let bascule = false;
    const surResultat = r.onresult;
    r.onresult = (e) => {
      recu = true;
      surResultat?.(e);
    };
    r.onerror = (e) => {
      if (e.error === "aborted") return;
      erreur = true;
      if (e.error === "network" || e.error === "service-not-allowed" || e.error === "language-not-supported") {
        // Le service vocal du navigateur n'existe pas ici (Vivaldi, Brave…) : on passe à la reconnaissance sur l'appareil, et on s'en souvient.
        try {
          localStorage.setItem("voixLocale", "1");
        } catch {}
        bascule = true;
        void dicterLocal();
        return;
      }
      setMessageVoix(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Le micro est refusé : clique sur le cadenas à gauche de l’adresse et autorise le micro pour ce site."
          : e.error === "audio-capture"
            ? "Aucun micro détecté sur cet appareil."
            : e.error === "network"
              ? "Ce navigateur n’a pas de service de reconnaissance vocale (c’est le cas de Vivaldi, Brave, Firefox) ou internet est coupé. Sur PC, clique dans la barre de recherche et dicte avec Windows : touches Windows + H."
              : e.error === "no-speech"
                ? "Je n’ai rien entendu, réessaie en parlant juste après avoir appuyé."
                : `La recherche vocale a échoué (${e.error}), réessaie.`,
      );
    };
    r.onend = () => {
      recoRef.current = null;
      if (bascule) return;
      setEcoute(false);
      if (!recu && !erreur) setMessageVoix("Je n’ai rien entendu, réessaie en parlant juste après avoir appuyé.");
    };
    // Garder une référence : sinon Chrome peut arrêter la reconnaissance aussitôt (objet recyclé).
    recoRef.current = r;
    setEcoute(true);
    try {
      r.start();
    } catch {
      setEcoute(false);
      setMessageVoix("Impossible de démarrer le micro, réessaie.");
    }
  }

  const regulation = useMemo(() => getRegulation(apparatus), [apparatus]);
  const mots = useMemo(() => normaliser(recherche).split(/\s+/).filter(Boolean), [recherche]);

  // Nombre de résultats par agrès, affiché sur les boutons d'agrès pour savoir où chercher.
  const resultatsParAgres = useMemo(() => {
    const r: Record<string, number> = {};
    if (mots.length === 0) return r;
    for (const a of apparatuses) r[a] = getRegulation(a).elements.filter((e) => correspond(e, mots)).length;
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mots]);

  const archesWithElements = useMemo(() => {
    return regulation.arches.map((arche) => {
      const elements = regulation.elements
        .filter((e) => e.archeId === arche.id && correspond(e, mots))
        .slice()
        .sort((a, b) => {
          const topGroupCmp = topGroupRank(a.palier) - topGroupRank(b.palier);
          if (topGroupCmp !== 0) return topGroupCmp;
          const branchCmp = (a.branch ?? "").localeCompare(b.branch ?? "");
          if (branchCmp !== 0) return branchCmp;
          const rankCmp = palierRank(a.palier) - palierRank(b.palier);
          if (rankCmp !== 0) return rankCmp;
          return a.code.localeCompare(b.code);
        });
      return { arche, elements };
    });
  }, [regulation, mots]);

  // Pendant une recherche, les arches sans résultat sont masquées.
  const archesAffichees = mots.length > 0 ? archesWithElements.filter((x) => x.elements.length > 0) : archesWithElements;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Table des éléments</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tous les éléments de chaque arche, par agrès, avec leur code et leur palier (P1 à P7).
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-sky-400/50 bg-sky-400/15" />
              Variante d&apos;un élément (nommée « variante »)
            </span>
            {apparatus === "POUTRE" && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border border-red-400/50 bg-red-400/15" />
                Poutre mousse (valeur différente de la poutre haute)
              </span>
            )}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10 space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-3" role="tablist">
          {(
            [
              ["elements", "Éléments par arche"],
              ["decomposition", "Décomposition de la note"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={vue === id}
              onClick={() => setVue(id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                vue === id ? "accent-gradient text-white" : "border border-border-strong text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {vue === "elements" && (
          <div className="space-y-1">
            <div className="flex max-w-xl items-center gap-2">
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                onKeyDown={(e) => {
                  // Entrée : même analyse qu'à la voix (utile avec la dictée Windows, Win + H) — « sissonne à la poutre » ouvre la Poutre.
                  if (e.key === "Enter" && recherche.trim()) {
                    e.preventDefault();
                    appliquerDictee(recherche);
                  }
                }}
                placeholder="Rechercher un élément (nom, code, palier)…"
                aria-label="Rechercher un élément"
                enterKeyHint="search"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-border-strong bg-surface-alt px-3 py-2 text-base text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none sm:text-sm"
              />
              <button
                type="button"
                onClick={surBoutonVoix}
                aria-label="Rechercher à la voix"
                title="Rechercher à la voix (ex. « sissonne à la poutre »)"
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-white ${ecoute ? "animate-pulse bg-danger" : "accent-gradient"}`}
              >
                {ecoute ? "🎙 En cours…" : "🎙 Voix"}
              </button>
            </div>
            {messageVoix && (
              <p className="text-xs text-muted" role="status">
                {messageVoix}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {apparatuses.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setApparatus(a)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                apparatus === a
                  ? "border-border-strong bg-surface-alt text-white"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {APPARATUS_LABELS[a] ?? a}
              {vue === "elements" && mots.length > 0 && (
                <span className={`ml-1.5 text-xs ${resultatsParAgres[a] ? "text-foreground" : "text-muted"}`}>({resultatsParAgres[a] ?? 0})</span>
              )}
            </button>
          ))}
        </div>

        {vue === "decomposition" && <DecompositionNote apparatus={apparatus} />}

        <div id="resultats-table" className={`scroll-mt-4 space-y-8 ${vue === "decomposition" ? "hidden" : ""}`}>
          {mots.length > 0 && archesAffichees.length === 0 && (
            <p className="text-sm text-muted">
              Aucun élément trouvé pour « {recherche.trim()} » en {APPARATUS_LABELS[apparatus] ?? apparatus}. Regarde les nombres sur les autres agrès.
            </p>
          )}
          {archesAffichees.map(({ arche, elements }) => (
            <section key={arche.id} className="mx-auto w-fit max-w-full overflow-hidden rounded-xl border border-border-subtle">
              <div className="border-b border-border-subtle bg-surface-alt/50 px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {arche.name}
                  {arche.subtitle && <span className="ml-1.5 font-normal text-muted">— {arche.subtitle}</span>}
                </h2>
                <p className="text-xs text-muted">
                  {arche.category} · page {arche.sourcePage}
                  {arche.dataQuality === "a_verifier" && (
                    <span className="ml-1.5 text-warning">⚠ à confirmer</span>
                  )}
                </p>
              </div>
              {elements.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted">Aucun élément recensé pour cette arche.</p>
              ) : (
                <ZoneGlissante>
                  <table className="min-w-[600px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-surface-alt text-left text-xs uppercase tracking-wide text-muted">
                        <th className="w-20 px-3 py-2 font-semibold">Code</th>
                        <th className="min-w-[420px] px-3 py-2 font-semibold">Nom</th>
                        <th className="w-28 px-3 py-2 font-semibold">Branche</th>
                        <th className="w-24 px-3 py-2 font-semibold">Palier</th>
                        {apparatus === "SAUT" && <th className="w-32 px-3 py-2 font-semibold">Valeur de départ</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {elements.map((el) => (
                        <tr key={el.code} className="border-t border-border-subtle">
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">{el.code}</td>
                          <td className="px-3 py-2 text-foreground">
                            {el.name}
                            {!el.verified && <span className="ml-1.5 text-xs text-warning">⚠ à confirmer</span>}
                            {isMousseElement(el.archeId) && (
                              <span
                                className="ml-1.5 rounded-full border border-red-400/40 bg-red-400/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300"
                                title="Poutre mousse : valeur différente de la poutre haute"
                              >
                                Mousse
                              </span>
                            )}
                            {isVariantElement(el.code, el.name) && (
                              <span
                                className="ml-1.5 rounded-full border border-sky-400/40 bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-300"
                                title="Variante d'un élément"
                              >
                                Variante
                              </span>
                            )}
                            {el.extraCategories?.map((c) => (
                              <span
                                key={c}
                                className="ml-1.5 rounded-full border border-accent-solid/40 bg-accent-from/10 px-1.5 py-0.5 text-[10px] font-medium text-white"
                                title={`Compte aussi dans la catégorie ${c}`}
                              >
                                + {c}
                              </span>
                            ))}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted">{el.branch ?? "—"}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${palierBadgeClasses(el.palier)}`}
                            >
                              {palierLabel(el.palier)}
                            </span>
                          </td>
                          {apparatus === "SAUT" && (
                            <td className="px-3 py-2 text-sm font-semibold text-foreground">
                              {el.value !== undefined ? el.value.toFixed(1).replace(/\.0$/, "") : "—"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ZoneGlissante>
              )}
            </section>
          ))}
        </div>
      </main>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 hidden rounded-full sm:block border border-border-strong bg-surface-alt px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:border-accent-solid/60 hover:bg-accent-from/10"
      >
        ↑ Retour en haut
      </button>
    </div>
  );
}
