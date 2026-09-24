"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeMovement, type MovementElementRef } from "@/engine/composition";
import type { ApparatusRegulation } from "@/regulation/types";
import { saveMovementElements, saveSnapshot } from "@/lib/data";
import { getCheck } from "@/regulation/checks";
import { isNamedVariant, isChainVariant, isMousseElement, isSortieElement } from "@/regulation/variants";
import ReferencePanel from "@/components/ReferencePanel";

// Poutre : ces 3 exigences de tronc commun sont explicitement "1 sortie
// (poutre mousse) : Acro Px (min.)" — contrairement aux autres exigences
// ACRO (ex. "3 acros en poutre haute"), elles ne doivent proposer QUE les
// éléments de l'arche Accro poutre mousse, jamais ceux de poutre haute.
const POUTRE_MOUSSE_ONLY_CHECKS = new Set(["P-B1-TC-3", "P-B2-TC-4", "P-B3-TC-4"]);
const CAT_ACRO_MOUSSE = "ACRO_MOUSSE_ONLY";

// Déduit, quand c'est possible, la ou les catégories d'arche associées à une
// exigence/valorisation -> permet de proposer "voir dans la Bibliothèque".
// Plusieurs catégories possibles (ex. FORCE ou PG = FORCE ou SAUT_GYM).
function categoryForCheck(id: string, apparatus: string): string[] | null {
  if (apparatus === "POUTRE" && POUTRE_MOUSSE_ONLY_CHECKS.has(id)) {
    return [CAT_ACRO_MOUSSE];
  }
  const spec = getCheck(id, apparatus);
  switch (spec.type) {
    case "CATEGORY_COUNT":
      return [spec.category];
    case "ELEMENT_AT_PALIER_MIN":
      return spec.category ? [spec.category] : null;
    case "TWO_ACRO_DIFFERENT_DIRECTIONS":
      return ["ACRO"];
    case "FORCE_OR_PG":
      // Un Passage Gymnique = 2 sauts gymniques différents liés (arches
      // "Sauts gymniques — Appel 1 pied" et "Appel 2 pieds", catégorie
      // SAUT_GYM commune aux deux ; aucune distinction d'appel dans la
      // définition officielle du PG).
      return ["FORCE", "SAUT_GYM"];
    default:
      return null;
  }
}

type SkillStatus = "MAITRISE" | "EN_APPRENTISSAGE" | "NON_DISPONIBLE";

export default function MovementBuilder({
  movementId,
  apparatus,
  evolutionId,
  regulation,
  initialElements,
  gymnastSkills,
}: {
  movementId: string;
  apparatus: string;
  evolutionId: string;
  regulation: ApparatusRegulation;
  initialElements: MovementElementRef[];
  gymnastSkills: { elementCode: string; status: string }[];
}) {
  const [sequence, setSequence] = useState<MovementElementRef[]>(initialElements);
  // Lues une seule fois à l'initialisation (et non dans un useEffect séparé) :
  // avec deux effets distincts (lecture puis écriture), le second écrasait la
  // valeur tout juste chargée au montage (surtout visible en StrictMode, qui
  // monte/démonte les composants deux fois en dev) — d'où les confirmations
  // qui semblaient se réinitialiser à chaque retour sur la page.
  const [manualConfirmations, setManualConfirmations] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(`manual-confirm-${movementId}`);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [search, setSearch] = useState("");
  const [onlyMastered, setOnlyMastered] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [rightTab, setRightTab] = useState<"suggestions" | "bibliotheque">("suggestions");
  const [category, setCategory] = useState<string>("ALL");
  const [assistantOnlyMastered, setAssistantOnlyMastered] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [revealedActions, setRevealedActions] = useState<Set<number>>(new Set());

  const skillMap = useMemo(() => {
    const m = new Map<string, SkillStatus>();
    for (const s of gymnastSkills) m.set(s.elementCode, s.status as SkillStatus);
    return m;
  }, [gymnastSkills]);

  useEffect(() => {
    localStorage.setItem(`manual-confirm-${movementId}`, JSON.stringify(Array.from(manualConfirmations)));
  }, [manualConfirmations, movementId]);

  // Sauvegarde automatique : dès que la séquence change (ajout, suppression,
  // réordonnancement), on persiste après une courte pause plutôt que d'exiger
  // un clic explicite — pour ne plus jamais perdre un ordre choisi.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setDirty(true);
    const timeout = setTimeout(() => {
      setSaving(true);
      saveMovementElements(movementId, sequence)
        .then(() => setDirty(false))
        .finally(() => setSaving(false));
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence, movementId]);

  const diagnostic = useMemo(
    () => analyzeMovement(apparatus, evolutionId, sequence, manualConfirmations),
    [apparatus, evolutionId, sequence, manualConfirmations]
  );

  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const visibleSuggestions = useMemo(() => {
    const base = assistantOnlyMastered
      ? diagnostic.suggestions.filter((s) => skillMap.get(s.elementCode) === "MAITRISE")
      : diagnostic.suggestions;
    return base.filter((s) => !dismissedSuggestions.has(s.elementCode)).slice(0, 40);
  }, [diagnostic.suggestions, assistantOnlyMastered, skillMap, dismissedSuggestions]);

  function dismissSuggestion(code: string) {
    setDismissedSuggestions((prev) => new Set(prev).add(code));
  }

  const [revealedSuggestion, setRevealedSuggestion] = useState<string | null>(null);

  const elementByCode = useMemo(() => new Map(regulation.elements.map((e) => [e.code, e])), [regulation]);
  const archeByCode = useMemo(() => new Map(regulation.arches.map((a) => [a.id, a])), [regulation]);

  function categoryKeyOf(archeId: string, branch: string | null): string {
    if (branch === "avant" || branch === "arriere" || branch === "maintien" || branch === "souplesse" || branch === "atr") {
      return `${archeId}:${branch}`;
    }
    return archeId;
  }
  function categoryLabelOf(key: string): string {
    const [archeId, branch] = key.split(":");
    const arche = archeByCode.get(archeId);
    const base = arche ? `${arche.name}${arche.subtitle ? " — " + arche.subtitle : ""}` : archeId;
    if (branch === "avant") return `${base} — avant`;
    if (branch === "arriere") return `${base} — arrière`;
    if (branch === "maintien") return "Maintien";
    if (branch === "souplesse") return "Souplesse";
    if (branch === "atr") return "ATR";
    return base;
  }

  const categories = useMemo(() => {
    const keys = new Set<string>();
    for (const el of regulation.elements) {
      if (el.palier === "PREREQUIS") continue;
      keys.add(categoryKeyOf(el.archeId, el.branch));
    }
    return Array.from(keys)
      .map((key) => ({ key, label: categoryLabelOf(key) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [regulation, archeByCode]);

  const filteredLibrary = useMemo(() => {
    const inSeq = new Set(sequence.map((s) => s.code));
    return regulation.elements
      .filter((e) => e.palier !== "PREREQUIS")
      .filter((e) => !inSeq.has(e.code))
      .filter((e) => {
        if (category === "ALL") return true;
        // "CAT:X,Y" (venant de "voir dans la Bibliothèque" sur une exigence qui
        // couvre plusieurs catégories d'arches, ex. FORCE ou PG) -> toute arche
        // dont la catégorie fait partie de la liste.
        if (category.startsWith("CAT:")) {
          const cats = category.slice(4).split(",");
          if (cats.includes(CAT_ACRO_MOUSSE)) return isMousseElement(e.archeId);
          // Les exigences ACRO génériques (ex. "3 acros en poutre haute") ne
          // doivent jamais proposer les éléments de l'arche Accro poutre
          // mousse : ce sont deux agrès/contextes différents.
          if (isMousseElement(e.archeId)) return false;
          const elCats = [archeByCode.get(e.archeId)?.category, ...(e.extraCategories ?? [])];
          return cats.some((c) => elCats.includes(c));
        }
        // Une catégorie sans ":" (ex. sélectionnée via "voir dans la Bibliothèque"
        // depuis une exigence générique) doit inclure toutes les branches de l'arche.
        if (category.includes(":")) return categoryKeyOf(e.archeId, e.branch) === category;
        return e.archeId === category;
      })
      .filter((e) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(s) ||
          e.code.toLowerCase().includes(s) ||
          (archeByCode.get(e.archeId)?.name.toLowerCase().includes(s) ?? false)
        );
      })
      .filter((e) => {
        if (!onlyMastered) return true;
        return skillMap.get(e.code) === "MAITRISE";
      })
      .slice(0, 80);
  }, [regulation, sequence, search, onlyMastered, skillMap, archeByCode, category]);

  function addElement(code: string) {
    setSequence((s) => [...s, { code, role: "ELEMENT" }]);
    setDirty(true);
  }
  function removeElement(index: number) {
    setSequence((s) => s.filter((_, i) => i !== index));
    setRevealedActions(new Set());
    setDirty(true);
  }
  function moveElement(index: number, dir: -1 | 1) {
    setSequence((s) => {
      const copy = [...s];
      const target = index + dir;
      if (target < 0 || target >= copy.length) return copy;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
    setRevealedActions(new Set());
    setDirty(true);
  }
  function toggleRevealed(index: number) {
    setRevealedActions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }
  function reorderTo(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setSequence((s) => {
      const copy = [...s];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
    setRevealedActions(new Set());
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveMovementElements(movementId, sequence);
      await saveSnapshot(
        movementId,
        sequence.map((s) => s.code),
        diagnostic.noteDepart,
        diagnostic
      );
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  function toggleManual(id: string) {
    setManualConfirmations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exploreCategory(checkId: string) {
    const cats = categoryForCheck(checkId, apparatus);
    if (!cats || cats.length === 0) return;
    setCategory(`CAT:${cats.join(",")}`);
    setRightTab("bibliotheque");
  }

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted">
          {diagnostic.elementCount} élément(s) · {diagnostic.archesCount} arche(s) utilisée(s)
          <span className="ml-3 text-xs">
            {saving ? "· Enregistrement automatique…" : dirty ? "· Modifications non enregistrées" : "· ✓ Enregistré automatiquement"}
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          title="Enregistre un instantané dans l'historique de progression (la séquence, elle, est déjà sauvegardée automatiquement)"
          className="rounded border border-border-strong px-4 py-2 text-sm font-medium text-foreground hover:border-accent-solid/60 disabled:opacity-50"
        >
          Enregistrer un instantané (historique)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr_1fr_0.9fr]">
        {/* ZONE 1 — MON MOUVEMENT */}
        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Mon mouvement</h2>
          {sequence.length === 0 ? (
            <p className="text-sm text-muted">Ajoutez des éléments depuis l&apos;Assistant ou la Bibliothèque, à droite →</p>
          ) : (
            <ol className="space-y-2">
              {sequence.map((s, i) => {
                const el = elementByCode.get(s.code);
                const arche = el ? archeByCode.get(el.archeId) : undefined;
                const isDragging = dragIndex === i;
                const isDragOver = dragOverIndex === i && dragIndex !== null && dragIndex !== i;
                return (
                  <li
                    key={`${s.code}-${i}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(i));
                      setDragIndex(i);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverIndex !== i) setDragOverIndex(i);
                    }}
                    onDragLeave={() => {
                      setDragOverIndex((cur) => (cur === i ? null : cur));
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
                      if (!Number.isNaN(from)) reorderTo(from, i);
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    onClick={() => toggleRevealed(i)}
                    className={`cursor-pointer rounded border p-2 transition ${
                      isDragging
                        ? "border-accent-solid/60 bg-surface-alt opacity-50"
                        : isDragOver
                        ? "border-accent-solid bg-accent-from/10"
                        : "border-border-subtle bg-surface-alt"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-0.5 cursor-grab select-none text-muted active:cursor-grabbing"
                          title="Glisser pour réordonner"
                        >
                          ⠿
                        </span>
                        <div>
                          <div className="text-xs text-muted">
                            {i + 1}. {arche?.name} {el?.palier && el.palier !== "BASE" ? `· ${el.palier}` : ""}
                          </div>
                          <div className="text-sm font-medium text-foreground">{el?.name ?? s.code}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => moveElement(i, -1)} className="rounded border border-border-strong px-1.5 text-xs text-foreground hover:border-accent-solid/60">↑</button>
                          <button onClick={() => moveElement(i, 1)} className="rounded border border-border-strong px-1.5 text-xs text-foreground hover:border-accent-solid/60">↓</button>
                          {revealedActions.has(i) && (
                            <button onClick={() => removeElement(i)} className="rounded border border-danger/40 px-1.5 text-xs text-danger hover:bg-danger/10">✕</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* ZONE 2 — ANALYSE */}
        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Analyse</h2>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Tronc commun</span>
              <span className={diagnostic.troncCommun.complete ? "text-success" : "text-muted"}>
                {diagnostic.troncCommun.complete ? "✓ complet" : "incomplet"}
              </span>
            </div>
            <ul className="space-y-1 text-sm">
              <CheckLine ok={diagnostic.troncCommun.archesOk} label={`${diagnostic.archesCount} arche(s) (${regulation.evolutions.find((e) => e.id === evolutionId)?.troncCommun.arches} requises)`} />
              <CheckLine
                ok={diagnostic.troncCommun.countOk}
                label={`${diagnostic.elementCount} élément(s) dans le mouvement (${regulation.evolutions.find((e) => e.id === evolutionId)?.troncCommun.elementsMin}–${regulation.evolutions.find((e) => e.id === evolutionId)?.troncCommun.elementsMax} requis)`}
              />
              {diagnostic.troncCommun.exigences.map((ex) => (
                <CheckLine
                  key={ex.id}
                  ok={ex.status === "OK"}
                  toConfirm={ex.status === "A_CONFIRMER"}
                  label={ex.label}
                  onConfirm={!ex.auto ? () => toggleManual(ex.id) : undefined}
                  confirmed={ex.confirmedManually}
                  onExplore={
                    ex.status !== "OK" && categoryForCheck(ex.id, apparatus) ? () => exploreCategory(ex.id) : undefined
                  }
                />
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Paliers</span>
            </div>
            {diagnostic.paliers.horsAutorise.length === 0 ? (
              <p className="text-xs text-success">✓ Tous les éléments sont dans les paliers autorisés</p>
            ) : (
              <ul className="space-y-1 text-xs text-danger">
                {diagnostic.paliers.horsAutorise.map((h) => (
                  <li key={h.code}>✕ {elementByCode.get(h.code)?.name} — palier {h.palier} non autorisé à ce niveau</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Valorisations</span>
              <span className="text-xs text-muted">
                retenues : {Math.min(diagnostic.valorisations.validatedCount, diagnostic.valorisations.choisir)}/{diagnostic.valorisations.choisir} (parmi {diagnostic.valorisations.parmi})
              </span>
            </div>
            <ul className="space-y-1 text-sm">
              {diagnostic.valorisations.results.map((v) => (
                <CheckLine
                  key={v.id}
                  ok={v.status === "OK"}
                  toConfirm={v.status === "A_CONFIRMER"}
                  label={`${v.label} ${v.pondere ? "★" : ""} (+${v.points} pts)`}
                  onConfirm={!v.auto ? () => toggleManual(v.id) : undefined}
                  confirmed={v.confirmedManually}
                  onExplore={
                    v.status !== "OK" && categoryForCheck(v.id, apparatus) ? () => exploreCategory(v.id) : undefined
                  }
                />
              ))}
            </ul>
          </div>

          <div className="accent-gradient rounded px-4 py-3 text-white shadow-lg shadow-accent-from/20">
            <div className="flex items-center justify-between text-xs uppercase text-white/70">
              <span>Note de départ</span>
              <span className="normal-case text-white/60">Tronc commun + Valorisations</span>
            </div>
            <div className="text-3xl font-bold">{diagnostic.noteDepart.toFixed(1)}</div>
            <button onClick={() => setShowDetail((v) => !v)} className="mt-1 text-xs text-white/90 underline">
              {showDetail ? "Masquer" : "Détail"} du calcul
            </button>
            {showDetail && (
              <div className="mt-2 space-y-1 text-xs text-white/85">
                <div>Tronc commun : {diagnostic.troncCommun.points} pts</div>
                <div>Valorisations : {diagnostic.valorisations.points} pts</div>
                <div className="text-white/60">
                  ⚠ Les exigences marquées « à confirmer » nécessitent votre validation (liaisons avec envol,
                  combinaisons spécifiques non déductibles automatiquement des données numérisées).
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ZONE 3 — SUGGESTIONS / BIBLIOTHÈQUE */}
        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <div className="mb-3 flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1">
            <button
              onClick={() => setRightTab("suggestions")}
              className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                rightTab === "suggestions" ? "accent-gradient text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Assistant
            </button>
            <button
              onClick={() => setRightTab("bibliotheque")}
              className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                rightTab === "bibliotheque" ? "accent-gradient text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Bibliothèque
            </button>
          </div>

          {rightTab === "suggestions" ? (
            <>
              {sequence.length > 0 && (
                <div className="mb-3 rounded border border-border-subtle bg-surface-alt/40 p-2">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    Éléments sélectionnés
                  </p>
                  <ul className="space-y-1">
                    {sequence.map((s, i) => {
                      const el = elementByCode.get(s.code);
                      return (
                        <li
                          key={`${s.code}-${i}`}
                          className="flex items-center justify-between gap-2 rounded bg-surface px-2 py-1"
                        >
                          <span className="truncate text-xs text-foreground">{el?.name ?? s.code}</span>
                          <button
                            onClick={() => removeElement(i)}
                            className="shrink-0 rounded border border-danger/40 px-1.5 text-xs text-danger hover:bg-danger/10"
                            title="Retirer cet élément"
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <p className="mb-2 text-xs text-muted">
                Sélection calculée automatiquement : uniquement des éléments qui feraient progresser ce mouvement
                précis, avec l&apos;explication de ce que chacun apporterait.
              </p>
              <label className="mb-3 flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={assistantOnlyMastered}
                  onChange={(e) => setAssistantOnlyMastered(e.target.checked)}
                />
                Ne proposer que les éléments maîtrisés (✓ verts dans le profil technique)
              </label>
              {visibleSuggestions.length === 0 ? (
                <p className="text-sm text-success">
                  {diagnostic.suggestions.length > 0 && assistantOnlyMastered
                    ? "Aucun élément maîtrisé ne permettrait de progresser ici. Marquez plus d'éléments « maîtrisés » dans le profil technique, ou décochez le filtre ci-dessus."
                    : diagnostic.troncCommun.complete
                    ? "✓ Mouvement conforme au tronc commun. Vous pouvez encore optimiser vos valorisations."
                    : "Ajoutez des éléments pour voir apparaître des suggestions."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleSuggestions.map((sug) => {
                    const mastery = skillMap.get(sug.elementCode);
                    const multi = sug.reasons.length > 1;
                    return (
                      <li
                        key={sug.elementCode}
                        onClick={() =>
                          setRevealedSuggestion((cur) => (cur === sug.elementCode ? null : sug.elementCode))
                        }
                        className={`cursor-pointer rounded border p-2 ${
                          multi
                            ? "border-accent-solid/50 bg-gradient-to-br from-accent-from/10 to-accent-to/10"
                            : "border-border-subtle bg-surface-alt"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{sug.elementName}</span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addElement(sug.elementCode);
                              }}
                              className="rounded bg-foreground px-2 py-1 text-xs text-background hover:opacity-80"
                            >
                              + Ajouter
                            </button>
                            {revealedSuggestion === sug.elementCode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissSuggestion(sug.elementCode);
                                }}
                                className="rounded border border-danger/40 px-1.5 py-1 text-xs text-danger hover:bg-danger/10"
                                title="Masquer cette suggestion"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                        <ul className="mt-1 space-y-0.5 text-xs text-muted">
                          {sug.reasons.map((r, i) => (
                            <li key={i}>→ {r}</li>
                          ))}
                        </ul>
                        {mastery === "MAITRISE" && <span className="mt-1 inline-block text-xs text-success">✓ déjà maîtrisé</span>}
                        {mastery === "EN_APPRENTISSAGE" && <span className="mt-1 inline-block text-xs text-warning">○ en apprentissage</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted">Tout le référentiel — cherchez et ajoutez librement n&apos;importe quel élément.</p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mb-2 w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
              >
                <option value="ALL">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (nom, code)…"
                className="mb-2 w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
              />
              <label className="mb-2 flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={onlyMastered} onChange={(e) => setOnlyMastered(e.target.checked)} />
                N&apos;afficher que les éléments maîtrisés par la gymnaste
              </label>
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm border border-sky-400/50 bg-sky-400/15" />
                  Variante
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm border border-pink-400/50 bg-pink-400/15" />
                  En enchaînement/liaison
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm border border-yellow-400/50 bg-yellow-400/15" />
                  Poutre mousse
                </span>
              </div>
              <div className="grid max-h-[32rem] grid-cols-2 gap-2 overflow-y-auto">
                {filteredLibrary.map((el) => {
                  const mastery = skillMap.get(el.code);
                  const variantBg = isChainVariant(el.code, el.name)
                    ? "bg-pink-400/10"
                    : isNamedVariant(el.name)
                    ? "bg-sky-400/10"
                    : isMousseElement(el.archeId)
                    ? "bg-yellow-400/10"
                    : "bg-surface-alt";
                  return (
                    <button
                      key={el.code}
                      onClick={() => addElement(el.code)}
                      className={`flex flex-col items-start gap-1 rounded border border-border-subtle p-2 text-left hover:border-accent-solid/60 hover:bg-accent-from/10 ${variantBg}`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span className="rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] text-muted">
                            {el.palier === "BASE" ? "Base" : el.palier === "NOMADE" ? "Nomade" : el.palier}
                          </span>
                          {isSortieElement(el.archeId) && (
                            <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-300">
                              Sortie
                            </span>
                          )}
                        </span>
                        {mastery === "MAITRISE" && <span className="text-xs text-success">✓</span>}
                        {mastery === "EN_APPRENTISSAGE" && <span className="text-xs text-warning">○</span>}
                      </div>
                      <span className="text-xs leading-snug text-foreground">{el.name}</span>
                    </button>
                  );
                })}
                {filteredLibrary.length === 0 && (
                  <p className="col-span-2 text-xs text-muted">Aucun élément ne correspond à ce filtre.</p>
                )}
              </div>
            </>
          )}
        </section>

        {/* ZONE 4 — RÉFÉRENCE */}
        <ReferencePanel apparatus={apparatus} evolutionId={evolutionId} />
      </div>
    </main>
  );
}

function CheckLine({
  ok,
  toConfirm,
  label,
  onConfirm,
  confirmed,
  onExplore,
}: {
  ok: boolean;
  toConfirm?: boolean;
  label: string;
  onConfirm?: () => void;
  confirmed?: boolean;
  onExplore?: () => void;
}) {
  const icon = ok ? "✓" : toConfirm ? "⚠" : "✕";
  const color = ok ? "text-success" : toConfirm ? "text-warning" : "text-danger";
  return (
    <li className={`flex items-center justify-between gap-2 ${color}`}>
      {onExplore ? (
        <button onClick={onExplore} className="text-left underline decoration-dotted hover:opacity-80" title="Voir les éléments correspondants dans la Bibliothèque">
          {icon} {label}
        </button>
      ) : (
        <span>
          {icon} {label}
        </span>
      )}
      {onConfirm && (
        <button onClick={onConfirm} className="shrink-0 text-xs accent-gradient-text underline">
          {confirmed ? "annuler" : "confirmer"}
        </button>
      )}
    </li>
  );
}
