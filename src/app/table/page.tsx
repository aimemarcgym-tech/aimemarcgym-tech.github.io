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
  // Aussi sans tirets ni espaces, pour que « flicflac » retrouve « flic-flac ».
  const compact = texte.replace(/[^a-z0-9]/g, "");
  return mots.every((m) => texte.includes(m) || compact.includes(m));
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
  const n = normaliser(dite).replace(/[.,!?;:'’]/g, " ").replace(/\s+/g, " ").trim();
  const mots = n ? n.split(" ") : [];
  // Le nom de l'agrès tel qu'il est souvent mal entendu : « poudre », « pôtre » → poutre ; « bar », « bars » → barres.
  const agresDe = (brut: string): string | null => {
    const t = brut.length > 3 ? brut.replace(/s$/, "") : brut;
    if (t.length >= 5 && distance(t, "poutre") <= 1) return "POUTRE";
    if (/^bar{1,2}e?s?$/.test(brut)) return "BARRES_ASYM";
    if (/^(saut|sault|sots?)$/.test(brut)) return "SAUT";
    if (/^(sol|sols|soul|saul)$/.test(brut)) return "SOL";
    return null;
  };
  // « au », « aux », « à la »… (« ou » : « au » mal entendu) ; on retient le dernier agrès cité avec sa préposition, ou en fin de phrase.
  const PREP = new Set(["a", "au", "aux", "ou", "o", "en", "sur", "de", "du"]);
  for (let i = mots.length - 1; i >= 0; i--) {
    const agres = agresDe(mots[i]);
    if (!agres) continue;
    // « barres asymétriques » : on retire aussi le mot qui suit.
    const fin = agres === "BARRES_ASYM" && mots[i + 1]?.startsWith("asym") ? i + 2 : i + 1;
    let debut = i;
    if (debut > 0 && (mots[debut - 1] === "la" || mots[debut - 1] === "le")) debut--;
    const avecPrep = debut > 0 && PREP.has(mots[debut - 1]);
    if (avecPrep) debut--;
    else if (debut < i) debut = i; // « la poutre » sans préposition : on ne garde que l'agrès
    if (!avecPrep && fin < mots.length) continue; // sans préposition, l'agrès doit finir la phrase
    return { agres, texte: [...mots.slice(0, debut), ...mots.slice(fin)].join(" ").trim() };
  }
  return { agres: null, texte: n };
}

// Mémoire de ce qu'on a corrigé à la main : phrase mal entendue (sans accents ni ponctuation) → nom choisi. Gardée dans le navigateur de l'appareil.
const CLE_APPRIS = "voixAppris";
const clePhrase = (dite: string) => normaliser(dite).replace(/[.,!?;:'’]/g, " ").replace(/\s+/g, " ").trim();
function lireAppris(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CLE_APPRIS) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
function enregistrerAppris(cle: string, valeur: string) {
  try {
    localStorage.setItem(CLE_APPRIS, JSON.stringify({ ...lireAppris(), [cle]: valeur }));
  } catch {
    // Stockage indisponible : tant pis, l'appli ne retiendra pas la correction.
  }
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

// Clé phonétique approximative du français : « sissonne », « cissonne » et « sisone » donnent la même clé.
// Sert à rapprocher ce que la reconnaissance vocale a entendu du vrai nom de l'élément.
function phonetique(mot: string): string {
  let s = mot.replace(/[^a-z]/g, "");
  s = s
    .replace(/ph/g, "f")
    .replace(/qu/g, "k")
    .replace(/ck/g, "k")
    .replace(/gu(?=[eiy])/g, "g")
    .replace(/gn/g, "N")
    .replace(/sch|ch|sh/g, "S")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/[cq]/g, "k")
    .replace(/g(?=[eiy])/g, "j")
    .replace(/eau|au/g, "o")
    .replace(/ou/g, "U")
    .replace(/oi/g, "W")
    .replace(/ai|ei/g, "e")
    .replace(/(ain|ein|in|im|un)(?![aeiouynm])/g, "I")
    .replace(/(an|am|en|em)(?![aeiouynm])/g, "A")
    .replace(/(on|om)(?![aeiouynm])/g, "O")
    .replace(/h/g, "")
    .replace(/y/g, "i")
    .replace(/z/g, "s")
    .replace(/x/g, "ks")
    .replace(/(.)\1+/g, "$1");
  if (s.length > 3) s = s.replace(/[estdx]+$/, "");
  else if (s.length > 2) s = s.replace(/e$/, "");
  return s;
}

// Chiffres que la reconnaissance écrit à la place du mot (« 6 zones » pour « sissonne » : on y lit « six zones », qui sonne comme le nom).
const CHIFFRES: Record<string, string> = { "0": "zero", "1": "un", "2": "deux", "3": "trois", "4": "quatre", "5": "cinq", "6": "six", "7": "sept", "8": "huit", "9": "neuf", "10": "dix" };
// Mots que la reconnaissance a réellement entendus à la place d'un nom d'élément (relevés lors des essais).
const CONFUSIONS: Record<string, string> = { rume: "roue", rum: "roue", roux: "roue", route: "roue", rou: "roue", rue: "roue", ronda: "rondade", rondat: "rondade", chandel: "chandelle", flicflac: "flic" };
const sansS = (x: string) => (x.length > 3 ? x.replace(/s$/, "") : x);

function toleranceCle(cle: string) {
  return cle.length >= 7 ? 2 : cle.length >= 4 ? 1 : 0;
}

// Mots du vocabulaire proches (par le son) d'un mot entendu, du plus proche au plus éloigné.
function motsProches(mot: string, vocab: { mot: string; cle: string }[], tolerance?: number) {
  const cle = phonetique(mot);
  const tol = tolerance ?? toleranceCle(cle);
  return vocab
    .map((v) => {
      const brut = distance(sansS(mot), sansS(v.mot));
      // Mot court : seule une clé identique compte (« rou » ↔ « roue »).
      const d = cle.length >= 4 ? Math.min(distance(cle, v.cle), brut) : mot.length >= 3 && cle === v.cle ? 0 : brut;
      return { mot: v.mot, d };
    })
    .filter((x) => x.d <= tol)
    .sort((x, y) => x.d - y.d || Math.abs(x.mot.length - mot.length) - Math.abs(y.mot.length - mot.length));
}

function corrigerMots(motsBruts: string[], vocabulaireMots: string[]) {
  const vocab = vocabulaireMots.map((m) => ({ mot: m, cle: phonetique(m) }));
  const dansVocab = new Set(vocabulaireMots);
  const sortie: string[] = [];
  const mots = motsBruts;
  for (let i = 0; i < mots.length; i++) {
    const m = mots[i];
    // Un chiffre seul n'est lu comme un mot (« 6 zones » = « six zones ») que dans le recollage ci-dessous.
    if (CONFUSIONS[m] && dansVocab.has(CONFUSIONS[m])) {
      sortie.push(CONFUSIONS[m]);
      continue;
    }
    const chiffre = CHIFFRES[m] !== undefined;
    if ((!chiffre && (m.length < 3 || /\d/.test(m))) || dansVocab.has(m)) {
      sortie.push(m);
      continue;
    }
    // Petit mot collé au nom (« demain » pour « de mains ») : on le retire si le reste est un nom connu.
    const collage = m.match(/^(de|du|des|le|la|les|un|une)(.{3,})$/);
    if (collage) {
      const reste = motsProches(collage[2], vocab)[0];
      if (reste && reste.d === 0) {
        sortie.push(reste.mot);
        continue;
      }
    }
    // Un nom coupé en deux par la reconnaissance (« six onne » pour « sissonne ») : on essaie de recoller 2 ou 3 mots.
    let recolle = false;
    for (const n of [3, 2]) {
      if (i + n > mots.length) continue;
      const ensemble = mots.slice(i, i + n).map((x) => CHIFFRES[x] ?? x).join("");
      if (ensemble.length < 5) continue;
      const proche = motsProches(ensemble, vocab.filter((v) => v.mot.length >= 5))[0];
      if (proche) {
        sortie.push(proche.mot);
        i += n - 1;
        recolle = true;
        break;
      }
    }
    if (recolle) continue;
    const proche = motsProches(m, vocab)[0];
    if (proche) sortie.push(proche.mot);
    else sortie.push(m);
  }
  return sortie;
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const recoRef = useRef<Reconnaissance | null>(null);
  const arretLocal = useRef<AbortController | null>(null);
  const derniereEntendue = useRef("");

  // Toucher une suggestion applique ce nom ET retient « ce qui a été entendu → ce nom » pour les prochaines fois.
  function choisirSuggestion(sug: string) {
    const entendue = derniereEntendue.current;
    appliquerDictee(sug, false);
    if (entendue && clePhrase(entendue) !== clePhrase(sug)) {
      enregistrerAppris(clePhrase(entendue), sug);
      setMessageVoix(`Retenu : la prochaine fois, « ${entendue} » ouvrira « ${sug} ».`);
    }
  }

  // Comprend une phrase (dictée ou tapée puis validée par Entrée) : « sissonne à la poutre » ouvre la Poutre et filtre « sissonne ».
  function appliquerDictee(diteEntendue: string, apprendre = true) {
    let dite = diteEntendue;
    // Phrase déjà corrigée à la main une fois (en touchant une suggestion) : on applique ce qui avait été choisi.
    const retenu = apprendre ? lireAppris()[clePhrase(dite)] : undefined;
    if (retenu) dite = retenu;
    if (apprendre) derniereEntendue.current = diteEntendue;
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
    if (total(mots) === 0) {
      // Rien de trouvé : on propose les noms d'éléments qui ressemblent, par le son, aux mots entendus.
      const vocab = vocabulaire(cibles).map((m) => ({ mot: m, cle: phonetique(m) }));
      const vus = new Set<string>();
      for (const m of brut.filter((x) => x.length >= 3)) {
        // Plus large qu'avant : un mot court mal entendu (« rume » pour « roue ») reste à 2 lettres près.
        for (const p of motsProches(m, vocab.filter((v) => v.mot.length >= 3), m.length >= 4 ? Math.max(2, Math.floor(m.length / 3)) : 1).slice(0, 4)) vus.add(p.mot);
      }
      const motAgres = citeValide ? ({ SAUT: "saut", BARRES_ASYM: "barres", POUTRE: "poutre", SOL: "sol" } as Record<string, string>)[citeValide] : null;
      setSuggestions([...vus].slice(0, 6).map((x) => (motAgres ? `${x} en ${motAgres}` : x)));
    } else setSuggestions([]);
    setMessageVoix(
      total(mots) === 0
        ? `J’ai compris : « ${diteEntendue} ». Aucun élément trouvé${" — touche le bon nom (l’appli s’en souviendra), ou redis seulement le nom de l’élément."}`
        : `J’ai compris : « ${diteEntendue} ».${retenu ? ` (appris : « ${retenu} »)` : ""} Recherche : « ${cherche} ».`,
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
                className={`hidden shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-white [@media(pointer:coarse)]:block ${ecoute ? "animate-pulse bg-danger" : "accent-gradient"}`}
              >
                {ecoute ? "🎙 En cours…" : "🎙 Voix"}
              </button>
            </div>
            {messageVoix && (
              <p className="text-xs text-muted" role="status">
                {messageVoix}
              </p>
            )}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => choisirSuggestion(sug)}
                    className="rounded-full border border-accent-solid/50 bg-accent-from/10 px-3 py-1 text-xs font-medium text-foreground hover:bg-accent-from/20"
                  >
                    {sug}
                  </button>
                ))}
              </div>
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

        <div id="resultats-table" className={`scroll-mt-4 space-y-8 pb-24 [@media(pointer:fine)]:pb-0 ${vue === "decomposition" ? "hidden" : ""}`}>
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
        className="fixed bottom-6 right-6 hidden rounded-full [@media(pointer:fine)]:block border border-border-strong bg-surface-alt px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:border-accent-solid/60 hover:bg-accent-from/10"
      >
        ↑ Retour en haut
      </button>
    </div>
  );
}
