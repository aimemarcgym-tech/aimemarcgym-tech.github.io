"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeSaut } from "@/engine/saut";
import type { MovementElementRef } from "@/engine/composition";
import type { ApparatusRegulation } from "@/regulation/types";
import { saveMovementElements, saveSnapshot } from "@/lib/data";
import ReferencePanel from "@/components/ReferencePanel";

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
}: {
  movementId: string;
  evolutionId: string;
  regulation: ApparatusRegulation;
  initialElements: MovementElementRef[];
  gymnastSkills: { elementCode: string; status: string }[];
}) {
  const [sequence, setSequence] = useState<MovementElementRef[]>(initialElements);
  const [rightTab, setRightTab] = useState<"suggestions" | "bibliotheque">("suggestions");
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

  useEffect(() => {
    localStorage.setItem(`manual-confirm-${movementId}`, JSON.stringify(Array.from(manualConfirmations)));
  }, [manualConfirmations, movementId]);

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

  const elementByCode = useMemo(() => new Map(regulation.elements.map((e) => [e.code, e])), [regulation]);

  const skillMap = useMemo(() => {
    const m = new Map<string, SkillStatus>();
    for (const s of gymnastSkills) m.set(s.elementCode, s.status as SkillStatus);
    return m;
  }, [gymnastSkills]);

  const visibleSuggestions = useMemo(() => {
    return assistantOnlyMastered
      ? diagnostic.suggestions.filter((s) => skillMap.get(s.elementCode) === "MAITRISE")
      : diagnostic.suggestions;
  }, [diagnostic.suggestions, assistantOnlyMastered, skillMap]);

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
      if (s.some((e) => e.code === code)) return s;
      const next = [...s, { code, role: "ELEMENT" as const }];
      // On ne garde jamais plus de sauts que ce qu'exige l'évolution.
      return next.slice(-diagnostic.sautsRequired);
    });
  }

  function removeSaut(code: string) {
    setSequence((s) => s.filter((e) => e.code !== code));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveMovementElements(movementId, sequence);
      await saveSnapshot(
        movementId,
        sequence.map((e) => e.code),
        diagnostic.noteDepart,
        diagnostic
      );
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  const filteredLibrary = useMemo(() => {
    const inSeq = new Set(sequence.map((s) => s.code));
    return regulation.elements
      .filter((e) => !inSeq.has(e.code))
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
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded border border-border-strong px-3 py-1.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground disabled:opacity-50"
        >
          Enregistrer un instantané (historique)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* ZONE 1 — MES SAUTS */}
        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Mon/mes saut(s)</h2>
          {diagnostic.sauts.length === 0 ? (
            <p className="text-sm text-muted">Ajoutez {diagnostic.sautsRequired} saut(s) depuis la Bibliothèque, à droite →</p>
          ) : (
            <ul className="space-y-2">
              {diagnostic.sauts.map((s) => (
                <li key={s.code} className="rounded-lg border border-border-subtle bg-surface-alt p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${s.horsPalierAutorise ? "text-danger" : "text-muted"}`}>
                      [{palierBadge(s.palier)}] {s.branch ? BRANCH_LABEL[s.branch] ?? s.branch : ""}
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
                </li>
              ))}
            </ul>
          )}
        </section>

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
              <span>Note de départ</span>
              <span className="normal-case text-white/60">Meilleur saut retenu</span>
            </div>
            <div className="text-3xl font-bold">{diagnostic.noteDepart.toFixed(1)}</div>
            <button onClick={() => setShowDetail((v) => !v)} className="mt-1 text-xs text-white/90 underline">
              {showDetail ? "Masquer" : "Détail"} du calcul
            </button>
            {showDetail && (
              <div className="mt-2 space-y-1 text-xs text-white/85">
                <div>Barème "Valeur des sauts" (palier du saut retenu).</div>
                <div className="text-white/60">
                  ⚠ Le barème chiffré de la valorisation du Saut n&apos;est pas publié par l&apos;UFOLEP à ce jour — elle
                  n&apos;est donc pas ajoutée au calcul (uniquement affichée pour suivi de conformité).
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
                        className={`rounded border p-2 ${
                          multi
                            ? "border-accent-solid/50 bg-gradient-to-br from-accent-from/10 to-accent-to/10"
                            : "border-border-subtle bg-surface-alt"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{sug.elementName}</span>
                          <button
                            onClick={() => addSaut(sug.elementCode)}
                            className="rounded bg-foreground px-2 py-1 text-xs text-background hover:opacity-80"
                          >
                            + Ajouter
                          </button>
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
