"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeSaut } from "@/engine/saut";
import type { MovementElementRef } from "@/engine/composition";
import type { ApparatusRegulation } from "@/regulation/types";
import { saveMovementElements } from "@/lib/data";
import SnapshotHistory, { useSnapshotHistory } from "@/components/SnapshotHistory";
import ReferencePanel from "@/components/ReferencePanel";
import ShareLinkButton from "@/components/ShareLinkButton";
import DragHandle from "@/components/DragHandle";
import { useDragReorder } from "@/hooks/useDragReorder";
import { createShare } from "@/lib/shares";
import { buildMovementShare } from "@/lib/movementShare";
import { getSautTips } from "@/lib/tips";

const PALIER_LABEL: Record<string, string> = {
  PREREQUIS: "Prérequis",
  PR1: "PR1",
  PR2: "PR2",
  PR3: "PR3",
  BASE: "Base",
  NOMADE: "Nomade",
};

function palierBadge(p: string) {
  return PALIER_LABEL[p] ?? p;
}

const BRANCH_LABEL: Record<string, string> = {
  avant: "Renversement avant",
  lateral: "Renversement latéral",
  rondade: "Rondade",
  mains: "Saut de mains",
};

type SkillStatus = "MAITRISE" | "EN_APPRENTISSAGE" | "NON_DISPONIBLE";

export default function SautBuilder({
  movementId,
  evolutionId,
  regulation,
  initialElements,
  gymnastSkills,
  label,
  gymnastFirstName,
  gymnastLastName,
}: {
  movementId: string;
  evolutionId: string;
  regulation: ApparatusRegulation;
  initialElements: MovementElementRef[];
  gymnastSkills: { elementCode: string; status: string }[];
  label: string;
  gymnastFirstName: string;
  gymnastLastName: string;
}) {
  const [sequence, setSequence] = useState<MovementElementRef[]>(initialElements);
  const history = useSnapshotHistory(movementId);
  const [rightTab, setRightTab] = useState<"suggestions" | "bibliotheque">("bibliotheque");
  const [assistantOnlyMastered, setAssistantOnlyMastered] = useState(true);
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
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [materielOptions, setMaterielOptions] = useState<{ trampoTremp: boolean; miniTrampoline: boolean; plus13ans: boolean }>(() => {
    if (typeof window === "undefined") return { trampoTremp: false, miniTrampoline: false, plus13ans: false };
    try {
      const raw = localStorage.getItem(`saut-materiel-${movementId}`);
      return raw ? JSON.parse(raw) : { trampoTremp: false, miniTrampoline: false, plus13ans: false };
    } catch {
      return { trampoTremp: false, miniTrampoline: false, plus13ans: false };
    }
  });

  useEffect(() => {
    localStorage.setItem(`manual-confirm-${movementId}`, JSON.stringify(Array.from(manualConfirmations)));
  }, [manualConfirmations, movementId]);

  useEffect(() => {
    localStorage.setItem(`saut-materiel-${movementId}`, JSON.stringify(materielOptions));
  }, [materielOptions, movementId]);

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
    () => analyzeSaut(evolutionId, sequence, manualConfirmations),
    [evolutionId, sequence, manualConfirmations]
  );

  const penaliteMateriel =
    (materielOptions.trampoTremp && materielOptions.plus13ans ? 1 : 0) + (materielOptions.miniTrampoline ? 1 : 0);
  const noteFinale = Math.max(0, diagnostic.noteDepart - penaliteMateriel);

  // Premier élément trouvé pour un code gagne (même règle que getElement()
  // dans loader.ts, utilisé par le moteur de notation) — voir MovementBuilder.tsx.
  const elementByCode = useMemo(() => {
    const map = new Map<string, (typeof regulation.elements)[number]>();
    for (const e of regulation.elements) {
      if (!map.has(e.code)) map.set(e.code, e);
    }
    return map;
  }, [regulation]);

  const skillMap = useMemo(() => {
    const m = new Map<string, SkillStatus>();
    for (const s of gymnastSkills) m.set(s.elementCode, s.status as SkillStatus);
    return m;
  }, [gymnastSkills]);

  const masteredElements = useMemo(
    () => regulation.elements.filter((e) => skillMap.get(e.code) === "MAITRISE"),
    [regulation, skillMap]
  );

  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [revealedSuggestion, setRevealedSuggestion] = useState<string | null>(null);

  function dismissSuggestion(code: string) {
    setDismissedSuggestions((prev) => new Set(prev).add(code));
  }

  const visibleSuggestions = useMemo(() => {
    const base = assistantOnlyMastered
      ? diagnostic.suggestions.filter((s) => skillMap.get(s.elementCode) === "MAITRISE")
      : diagnostic.suggestions;
    return base.filter((s) => !dismissedSuggestions.has(s.elementCode));
  }, [diagnostic.suggestions, assistantOnlyMastered, skillMap, dismissedSuggestions]);

  function toggleManual(id: string) {
    setManualConfirmations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSaut(code: string) {
    setSequence((s) => {
      // Un même saut peut être choisi 2 fois (ex : 2 fois le même saut de type Lune).
      const next = [...s, { code, role: "ELEMENT" as const }];
      // On ne garde jamais plus de sauts que ce qu'exige l'évolution.
      return next.slice(-diagnostic.sautsRequired);
    });
  }

  function removeSaut(code: string) {
    setSequence((s) => {
      // Ne retire qu'une occurrence : si le saut est doublé, un clic le ramène à 1.
      const idx = s.findIndex((e) => e.code === code);
      if (idx === -1) return s;
      const next = [...s];
      next.splice(idx, 1);
      return next;
    });
  }

  const sautGroups = useMemo(() => {
    const order: string[] = [];
    const bySaut = new Map<string, typeof diagnostic.sauts>();
    for (const s of diagnostic.sauts) {
      if (!bySaut.has(s.code)) {
        order.push(s.code);
        bySaut.set(s.code, []);
      }
      bySaut.get(s.code)!.push(s);
    }
    return order.map((code) => ({ code, count: bySaut.get(code)!.length, saut: bySaut.get(code)![0] }));
  }, [diagnostic.sauts]);

  function reorderSautGroups(from: number, to: number) {
    if (from === to) return;
    const next = [...sautGroups];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSequence(next.flatMap((g) => Array.from({ length: g.count }, () => ({ code: g.code, role: "ELEMENT" as const }))));
  }

  const { dragIndex: sautDragIndex, overIndex: sautOverIndex, setItemRef, handleProps } = useDragReorder(reorderSautGroups);

  async function handleSave() {
    setSaving(true);
    try {
      await saveMovementElements(movementId, sequence);
      await history.create(
        sequence.map((e) => e.code),
        diagnostic.noteDepart,
        diagnostic
      );
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const shareId = await createShare(
      "movement",
      buildMovementShare({
        gymnastFirstName,
        gymnastLastName,
        label,
        apparatus: "SAUT",
        evolutionId,
        codes: sequence.map((s) => s.code),
        diagnostic,
        penaliteMateriel: penaliteMateriel,
        snapshots: history.snapshots,
      })
    );
    return `/partage/mouvement/?id=${shareId}`;
  }

  const filteredLibrary = useMemo(() => {
    // Un saut déjà sélectionné reste affiché : il peut être choisi une 2e fois (doublé).
    return regulation.elements
      .filter((e) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return e.name.toLowerCase().includes(s) || e.code.toLowerCase().includes(s);
      })
      .slice(0, 100);
  }, [regulation, sequence, search]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filteredLibrary>();
    for (const el of filteredLibrary) {
      const key = el.branch ? `${el.archeId}:${el.branch}` : el.archeId;
      const list = groups.get(key) ?? [];
      list.push(el);
      groups.set(key, list);
    }
    const isPrerequis = (p: string) => p === "PREREQUIS" || p === "PR1" || p === "PR2" || p === "PR3";
    for (const list of groups.values()) {
      list.sort((a, b) => Number(isPrerequis(b.palier)) - Number(isPrerequis(a.palier)));
    }
    return groups;
  }, [filteredLibrary]);

  function groupLabel(key: string) {
    const [archeId, branch] = key.split(":");
    if (branch && BRANCH_LABEL[branch]) return BRANCH_LABEL[branch];
    const arche = regulation.arches.find((a) => a.id === archeId);
    return arche ? `${arche.name}${arche.subtitle ? " — " + arche.subtitle : ""}` : archeId;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <span>
          {sequence.length}/{diagnostic.sautsRequired} saut(s) sélectionné(s)
          {dirty ? " · Modifications non enregistrées" : saving ? " · Enregistrement…" : " · ✓ Enregistré automatiquement"}
        </span>
        <div className="flex items-center gap-2">
          <ShareLinkButton onCreate={handleShare} />
          {history.editingId && (
            <button
              onClick={() =>
                void history.update(
                  sequence.map((e) => e.code),
                  diagnostic.noteDepart,
                  diagnostic
                )
              }
              className="accent-gradient rounded px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Enregistrer les modifications de « {history.editingName || "l’instantané"} »
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded border border-border-strong px-3 py-1.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground disabled:opacity-50"
          >
            Enregistrer un instantané (historique)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* ZONE 1 — MES SAUTS (+ historique des instantanés) */}
        <div className="space-y-4">
        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Mon/mes saut(s)</h2>
          {sautGroups.length === 0 ? (
            <p className="text-sm text-muted">Ajoutez {diagnostic.sautsRequired} saut(s) depuis la Bibliothèque, à droite →</p>
          ) : (
            <ul className="space-y-2">
              {sautGroups.map((g, i) => {
                const s = g.saut;
                const isDragging = sautDragIndex === i;
                const isDragOver = sautOverIndex === i && sautDragIndex !== null && sautDragIndex !== i;
                return (
                  <li
                    key={g.code}
                    ref={setItemRef(i)}
                    className={`flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-alt p-3 transition ${
                      isDragging ? "opacity-50" : isDragOver ? "ring-2 ring-accent-solid" : ""
                    }`}
                  >
                    {/* Toujours monté, même à 1 saut : le démonter (ou le masquer par
                        display:none) en cours de glissement — si un autre saut est
                        retiré pendant le drag — couperait pointerup/pointercancel et
                        laisserait la ligne bloquée en style "en cours de glissement". */}
                    <DragHandle {...handleProps(i)} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${s.horsPalierAutorise ? "text-danger" : "text-muted"}`}>
                          [{palierBadge(s.palier)}] {s.branch ? BRANCH_LABEL[s.branch] ?? s.branch : ""}
                          {g.count > 1 && <span className="ml-1 accent-gradient-text">×{g.count}</span>}
                        </span>
                        <button onClick={() => removeSaut(s.code)} className="text-xs text-danger hover:underline">
                          Retirer
                        </button>
                      </div>
                      <div className="text-sm text-foreground">{s.name}</div>
                      <div className="mt-1 text-xs accent-gradient-text font-semibold">Valeur : {s.value.toFixed(1)}</div>
                      {s.horsPalierAutorise && (
                        <div className="mt-1 text-xs text-danger">⚠ Palier non autorisé pour cette évolution</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 space-y-1.5 rounded-lg border border-border-subtle bg-surface-alt p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Matériel / pénalités</p>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={materielOptions.trampoTremp}
                onChange={(e) => setMaterielOptions((o) => ({ ...o, trampoTremp: e.target.checked }))}
              />
              Trampo-tremp utilisé
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={materielOptions.miniTrampoline}
                onChange={(e) => setMaterielOptions((o) => ({ ...o, miniTrampoline: e.target.checked }))}
              />
              Mini trampoline utilisé
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={materielOptions.plus13ans}
                onChange={(e) => setMaterielOptions((o) => ({ ...o, plus13ans: e.target.checked }))}
              />
              Gymnaste de 13 ans ou plus
            </label>
            <p className="pt-1 text-[11px] text-muted">
              À partir de 13 ans, le trampo-tremp entraîne -1 point. Le mini trampoline entraîne -1 point quel que
              soit l&apos;âge (saison 2026-2027).
            </p>
          </div>
        </section>
        <SnapshotHistory
          history={history}
          onRestore={(codes) => {
            setSequence(codes.slice(-diagnostic.sautsRequired).map((code) => ({ code, role: "ELEMENT" as const })));
            setDirty(true);
          }}
          onEdit={(codes) => {
            setSequence(codes.slice(-diagnostic.sautsRequired).map((code) => ({ code, role: "ELEMENT" as const })));
            setDirty(true);
          }}
        />
        </div>

        {/* ZONE 2 — ANALYSE */}
        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Analyse</h2>
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Tronc commun</span>
              <span className={diagnostic.troncCommunOk ? "text-success" : "text-danger"}>
                {diagnostic.troncCommunOk ? "✓ complet" : "incomplet"}
              </span>
            </div>
            <p className={`text-sm ${diagnostic.troncCommunOk ? "text-success" : "text-danger"}`}>
              {diagnostic.troncCommunOk ? "✓" : "✕"} {diagnostic.troncCommunMessage}
            </p>
            {diagnostic.sautsRequired >= 2 && (
              <p className={`mt-1 text-sm ${diagnostic.famillesDifferentes ? "text-success" : "text-muted"}`}>
                {diagnostic.famillesDifferentes ? "✓" : "○"} 2 sauts de familles de 1<sup>er</sup> envol différentes
              </p>
            )}
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Valorisation</span>
              <span className="text-xs text-muted">1 seule possible</span>
            </div>
            <ul className="space-y-1 text-sm">
              {(diagnostic.valorisations.some((v) => v.status === "OK")
                ? diagnostic.valorisations.filter((v) => v.status === "OK")
                : diagnostic.valorisations
              ).map((v) => (
                <li key={v.id} className={`flex items-center justify-between gap-2 ${v.status === "OK" ? "text-success" : v.status === "A_CONFIRMER" ? "text-warning" : "text-danger"}`}>
                  <span>
                    {v.status === "OK" ? "✓" : v.status === "A_CONFIRMER" ? "⚠" : "✕"} {v.label}
                  </span>
                  {!v.auto && (
                    <button onClick={() => toggleManual(v.id)} className="shrink-0 text-xs accent-gradient-text underline">
                      {v.confirmedManually ? "annuler" : "confirmer"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="accent-gradient rounded px-4 py-3 text-white shadow-lg shadow-accent-from/20">
            <div className="flex items-center justify-between text-xs uppercase text-white/70">
              <span>{penaliteMateriel > 0 ? "Note finale" : "Note de départ"}</span>
              <span className="normal-case text-white/60">Meilleur saut retenu</span>
            </div>
            <div className="text-3xl font-bold">
              {noteFinale.toFixed(1)}
              <span className="text-lg font-semibold text-white/70">/{diagnostic.noteDepartMax.toFixed(1)} max</span>
            </div>
            {penaliteMateriel > 0 && (
              <div className="mt-1 text-xs text-white/80">
                Note de départ {diagnostic.noteDepart.toFixed(1)} − {penaliteMateriel.toFixed(1)} (pénalité matériel)
              </div>
            )}
            <button onClick={() => setShowDetail((v) => !v)} className="mt-1 text-xs text-white/90 underline">
              {showDetail ? "Masquer" : "Détail"} du calcul
            </button>
            {showDetail && (
              <div className="mt-2 space-y-1 text-xs text-white/85">
                <div>Barème "Valeur des sauts" (palier du saut retenu).</div>
                <div className="text-white/60">
                  La valorisation des 2 sauts différents est appliquée si les 2 sauts sont reconnus et que l&apos;un
                  des deux se trouve dans les paliers valorisables. Si le meilleur saut est un nomade, alors les
                  nomades n&apos;étant pas valorisables, pas de valorisation.
                </div>
              </div>
            )}
          </div>

          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {getSautTips(diagnostic.sautsRequired, evolutionId).map((tip, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="shrink-0">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
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
              {masteredElements.length > 0 && (
                <div className="mb-3 rounded border border-border-subtle bg-surface-alt/40 p-2">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    Éléments sélectionnés
                  </p>
                  <ul className="max-h-32 space-y-1 overflow-y-auto">
                    {masteredElements.map((el) => (
                      <li key={el.code} className="truncate rounded bg-surface px-2 py-1 text-xs text-foreground">
                        {el.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mb-2 text-xs text-muted">
                Sélection calculée automatiquement : uniquement des sauts autorisés à cette évolution qui feraient
                progresser ce mouvement précis, avec l&apos;explication de ce que chacun apporterait.
              </p>
              <label className="mb-3 flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={assistantOnlyMastered}
                  onChange={(e) => setAssistantOnlyMastered(e.target.checked)}
                />
                Ne proposer que les éléments maîtrisés (✓ verts dans le profil technique)
              </label>
              {sequence.length >= diagnostic.sautsRequired && (
                <p className="mb-3 text-xs text-warning">
                  {diagnostic.sautsRequired} saut(s) déjà sélectionné(s) — en ajouter un nouveau remplacera le plus
                  ancien.
                </p>
              )}
              {visibleSuggestions.length === 0 ? (
                <p className="text-sm text-success">
                  {diagnostic.suggestions.length > 0 && assistantOnlyMastered
                    ? "Aucun saut maîtrisé ne permettrait de progresser ici. Marquez plus d'éléments « maîtrisés » dans le profil technique, ou décochez le filtre ci-dessus."
                    : diagnostic.troncCommunOk
                    ? "✓ Mouvement conforme au tronc commun."
                    : "Ajoutez des sauts pour voir apparaître des suggestions."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleSuggestions.map((sug) => {
                    const mastery = skillMap.get(sug.elementCode);
                    const el = elementByCode.get(sug.elementCode);
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
                                addSaut(sug.elementCode);
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
                            <li key={i}>· {r}</li>
                          ))}
                        </ul>
                        {typeof el?.value === "number" && (
                          <div className="mt-1 text-xs accent-gradient-text font-semibold">
                            Valeur : {el.value.toFixed(1)}
                          </div>
                        )}
                        {mastery === "MAITRISE" && <span className="mt-1 inline-block text-xs text-success">✓ déjà maîtrisé</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <>
              <h2 className="sr-only">Bibliothèque</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (nom, code)…"
                className="mb-3 w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
              />
              {sequence.length >= diagnostic.sautsRequired && (
                <p className="mb-3 text-xs text-warning">
                  {diagnostic.sautsRequired} saut(s) déjà sélectionné(s) — en ajouter un nouveau remplacera le plus
                  ancien.
                </p>
              )}
              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                {Array.from(grouped.entries()).map(([key, els]) => (
                  <div key={key}>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">{groupLabel(key)}</h3>
                    <ul className="space-y-1">
                      {els.map((el) => {
                        const mastery = skillMap.get(el.code);
                        const selectedCount = sequence.filter((s) => s.code === el.code).length;
                        return (
                          <li key={el.code}>
                            <button
                              onClick={() => addSaut(el.code)}
                              className="w-full rounded border border-border-subtle bg-surface-alt px-3 py-2 text-left text-xs text-foreground hover:border-accent-solid/60"
                            >
                              <span className="mr-1 rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] text-muted">
                                {palierBadge(el.palier)}
                              </span>
                              {el.name}
                              {typeof el.value === "number" && (
                                <span className="ml-1 accent-gradient-text font-semibold">· {el.value.toFixed(1)}</span>
                              )}
                              {mastery === "MAITRISE" && <span className="ml-1 text-success">✓</span>}
                              {selectedCount > 0 && (
                                <span className="ml-1 text-success">✓ sélectionné{selectedCount > 1 ? ` ×${selectedCount}` : ""}</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {grouped.size === 0 && <p className="text-sm text-muted">Aucun élément ne correspond à ce filtre.</p>}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="mt-4">
        <ReferencePanel apparatus="SAUT" evolutionId={evolutionId} />
      </div>
    </main>
  );
}
