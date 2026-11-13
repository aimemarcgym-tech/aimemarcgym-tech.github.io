"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getRegulation, getAvailableApparatuses } from "@/regulation/loader";
import { palierRank, type Palier } from "@/regulation/types";
import { isVariantElement, isMousseElement } from "@/regulation/variants";
import DecompositionNote from "@/components/DecompositionNote";

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

  // Dicte un élément (et éventuellement l'agrès) : « sissonne à la poutre » ouvre la Poutre et filtre « sissonne ».
  function dicter() {
    const w = window as unknown as { SpeechRecognition?: FabriqueReconnaissance; webkitSpeechRecognition?: FabriqueReconnaissance };
    const Fabrique = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Fabrique) {
      setMessageVoix("La recherche vocale n’est pas disponible sur ce navigateur (essaie Chrome, Edge ou Safari).");
      return;
    }
    setMessageVoix(null);
    const r = new Fabrique();
    r.lang = "fr-FR";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const dite = e.results[0]?.[0]?.transcript ?? "";
      const { agres, texte } = analyserDictee(dite);
      if (agres && apparatuses.includes(agres as (typeof apparatuses)[number])) setApparatus(agres as (typeof apparatuses)[number]);
      setVue("elements");
      setRecherche(texte);
      setMessageVoix(`J’ai compris : « ${dite} »`);
    };
    r.onerror = (e) => {
      setMessageVoix(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Le micro est refusé : autorise-le dans les réglages du navigateur."
          : e.error === "no-speech"
            ? "Je n’ai rien entendu, réessaie."
            : "La recherche vocale a échoué, réessaie.",
      );
    };
    r.onend = () => setEcoute(false);
    setEcoute(true);
    r.start();
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
                placeholder="Rechercher un élément (nom, code, palier)…"
                aria-label="Rechercher un élément"
                enterKeyHint="search"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-border-strong bg-surface-alt px-3 py-2 text-base text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none sm:text-sm"
              />
              <button
                type="button"
                onClick={dicter}
                disabled={ecoute}
                aria-label="Rechercher à la voix"
                title="Rechercher à la voix (ex. « sissonne à la poutre »)"
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-white ${ecoute ? "animate-pulse bg-danger" : "accent-gradient"}`}
              >
                {ecoute ? "🎙 J’écoute…" : "🎙 Voix"}
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

        <div className={`space-y-8 ${vue === "decomposition" ? "hidden" : ""}`}>
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
        className="fixed bottom-6 right-6 rounded-full border border-border-strong bg-surface-alt px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:border-accent-solid/60 hover:bg-accent-from/10"
      >
        ↑ Retour en haut
      </button>
    </div>
  );
}
