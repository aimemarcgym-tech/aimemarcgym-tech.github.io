import { getArche, getRegulation } from "@/regulation/loader";
import { getCheck } from "@/regulation/checks";
import { isMousseElement, isSortieElement } from "@/regulation/variants";
import { estPalierValorisable, palierRank, type Palier, type RegElement } from "@/regulation/types";

// Test (Poutre seulement) : pour un élément de la bibliothèque, liste les valorisations de l'évolution
// auxquelles il peut contribuer. Simple aide visuelle : rien n'est coché ni validé, toutes les
// valorisations restent confirmées à la main par l'entraîneur.
export interface BadgeValorisation {
  id: string;
  label: string; // libellé court
  titre: string; // libellé complet de la valorisation
  // true : le moteur sait juger l'élément pour cette valorisation ; false : simple piste à confirmer.
  fiable: boolean;
}

export interface BadgesElement {
  valorisable: boolean;
  badges: BadgeValorisation[];
}

function categories(apparatus: string, el: RegElement): string[] {
  const primary = getArche(apparatus, el.archeId)?.category;
  const cats = primary ? [primary] : [];
  return el.extraCategories ? [...cats, ...el.extraCategories] : cats;
}

// Palier minimum cité dans le libellé (« P4 (min.) », « P5 »).
function palierMinDuLibelle(label: string): number {
  const m = label.match(/\bP(\d)\b/);
  return m ? palierRank(`P${m[1]}` as Palier) : -1;
}

function courtLibelle(label: string): string {
  return label.replace(/^\(\*\)\s*/, "").replace(/^1\s+/, "");
}

export function valorisationsPourElement(apparatus: string, evolutionId: string, el: RegElement): BadgesElement {
  if (apparatus !== "POUTRE") return { valorisable: true, badges: [] };
  const evo = getRegulation(apparatus).evolutions.find((e) => e.id === evolutionId);
  if (!evo) return { valorisable: true, badges: [] };

  const mousse = isMousseElement(el.archeId);
  const valorisable = mousse || estPalierValorisable(el.palier, evo.paliersValorisables);
  if (!valorisable) return { valorisable: false, badges: [] };

  const cats = categories(apparatus, el);
  const sortie = isSortieElement(el.archeId, el.extraCategories);
  const rank = palierRank(el.palier);
  const badges: BadgeValorisation[] = [];

  for (const opt of evo.valorisations.options) {
    const optMousse = /^poutre mousse/i.test(opt.label);
    if (optMousse !== mousse) continue;
    const spec = getCheck(opt.id, apparatus);
    let match = false;
    let fiable = false;

    if (mousse) {
      // Poutre mousse : seule la présence de l'élément dans l'arche mousse est connue.
      match = true;
    } else if (spec.type === "ELEMENT_AT_PALIER_MIN") {
      fiable = true;
      match =
        (!spec.category || cats.includes(spec.category)) &&
        !(spec.excludeSorties && sortie) &&
        rank >= palierRank(spec.palierMin) &&
        palierRank(spec.palierMin) >= 0;
    } else if (spec.type === "CATEGORY_COUNT") {
      fiable = true;
      match = cats.includes(spec.category) && (!spec.branch || el.branch === spec.branch);
    } else if (spec.type === "NAME_CONTAINS_ALL") {
      fiable = true;
      match = spec.terms.every((t) => el.name.toLowerCase().includes(t));
    } else if (spec.type === "MANUAL") {
      const l = opt.label;
      const min = palierMinDuLibelle(l);
      const ouPalier = min < 0 || rank >= min;
      if (/sortie avec liaison acro/i.test(l)) {
        match = sortie || cats.includes("ACRO");
      } else if (/\bLG ou LM\b/.test(l)) {
        match = cats.some((c) => ["PIVOT", "SAUT_GYM", "ACRO"].includes(c));
      } else if (/\bLA\b/.test(l)) {
        match = cats.includes("ACRO") && !sortie;
      } else if (/écart antéro/i.test(l)) {
        match = cats.includes("SAUT_GYM") && /écart/i.test(el.name);
      } else if (/rotation à 180/i.test(l)) {
        match = cats.includes("SAUT_GYM") && (el.rotationDeg ?? 0) >= 180;
      } else if (/demi pivot/i.test(l)) {
        match = cats.includes("PIVOT") && el.rotationDeg === 180;
      } else if (/pivot/i.test(l)) {
        match = cats.includes("PIVOT") && ouPalier;
      } else if (/cabriole/i.test(l)) {
        match = /cabriole/i.test(el.name);
      } else if (/saut appel 2 pieds/i.test(l)) {
        match = el.archeId.includes("SAUTS-2PIEDS");
      } else if (/\bsalto\b/i.test(l)) {
        match = /salto/i.test(el.name) && ouPalier;
      } else if (/\bsaut\b/i.test(l)) {
        match = cats.includes("SAUT_GYM") && ouPalier;
      }
    }

    if (match) badges.push({ id: opt.id, label: courtLibelle(opt.label), titre: opt.label, fiable });
  }
  return { valorisable: true, badges };
}
