"use client";

import { useMemo, useState, useTransition } from "react";
import { setSkillStatus } from "@/lib/data";
import type { ApparatusRegulation } from "@/regulation/types";

type SkillStatus = "MAITRISE" | "EN_APPRENTISSAGE" | "NON_DISPONIBLE";

const STATUS_LABEL: Record<SkillStatus, string> = {
  MAITRISE: "✓ Maîtrisé",
  EN_APPRENTISSAGE: "○ En apprentissage",
  NON_DISPONIBLE: "✕ Non disponible",
};

const STATUS_STYLE: Record<SkillStatus, string> = {
  MAITRISE: "bg-success/10 text-success border-success/40",
  EN_APPRENTISSAGE: "bg-warning/10 text-warning border-warning/40",
  NON_DISPONIBLE: "bg-surface-alt text-muted border-border-strong",
};

export default function SkillsEditor({
  gymnastId,
  regulation,
  existingSkills,
}: {
  gymnastId: string;
  regulation: ApparatusRegulation;
  existingSkills: { elementCode: string; status: string }[];
}) {
  const [statuses, setStatuses] = useState<Record<string, SkillStatus>>(() => {
    const map: Record<string, SkillStatus> = {};
    for (const s of existingSkills) map[s.elementCode] = s.status as SkillStatus;
    return map;
  });
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [pending, startTransition] = useTransition();

  const archeById = useMemo(() => {
    const m = new Map(regulation.arches.map((a) => [a.id, a]));
    return m;
  }, [regulation]);

  function categoryKeyOf(archeId: string, branch: string | null): string {
    if (
      branch === "avant" ||
      branch === "arriere" ||
      branch === "maintien" ||
      branch === "souplesse" ||
      branch === "atr" ||
      branch === "lateral" ||
      branch === "rondade" ||
      branch === "mains"
    ) {
      return `${archeId}:${branch}`;
    }
    return archeId;
  }
  function categoryLabelOf(key: string): string {
    const [archeId, branch] = key.split(":");
    const arche = archeById.get(archeId);
    const base = arche ? `${arche.name}${arche.subtitle ? " — " + arche.subtitle : ""}` : archeId;
    if (branch === "avant") return `${base} — avant`;
    if (branch === "arriere") return `${base} — arrière`;
    if (branch === "maintien") return "Maintien";
    if (branch === "souplesse") return "Souplesse";
    if (branch === "atr") return "ATR";
    if (branch === "lateral") return `${base} — latéral`;
    if (branch === "rondade") return "Rondade";
    if (branch === "mains") return "Saut de mains";
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
  }, [regulation, archeById]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof regulation.elements>();
    for (const el of regulation.elements) {
      if (el.palier === "PREREQUIS") continue;
      if (category !== "ALL" && categoryKeyOf(el.archeId, el.branch) !== category) continue;
      if (filter && !el.name.toLowerCase().includes(filter.toLowerCase()) && !el.code.includes(filter)) continue;
      const list = groups.get(el.archeId) ?? [];
      list.push(el);
      groups.set(el.archeId, list);
    }
    return groups;
  }, [regulation, filter, category]);

  function cycleStatus(code: string) {
    const order: SkillStatus[] = ["NON_DISPONIBLE", "EN_APPRENTISSAGE", "MAITRISE"];
    const current = statuses[code] ?? "NON_DISPONIBLE";
    const next = order[(order.indexOf(current) + 1) % order.length];
    setStatuses((s) => ({ ...s, [code]: next }));
    startTransition(() => {
      setSkillStatus(gymnastId, code, next);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          <option value="ALL">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher un élément (nom ou code)…"
          className="w-full max-w-md rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
        />
      </div>
      <p className="mb-3 text-xs text-muted">
        Cliquez sur un élément pour faire tourner son statut : ✕ non disponible → ○ en apprentissage → ✓ maîtrisé.
        {pending && <span className="ml-2 accent-gradient-text">Enregistrement…</span>}
      </p>
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([archeId, elements]) => {
          const arche = archeById.get(archeId);
          return (
            <div key={archeId}>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {arche?.name}
                {arche?.subtitle ? ` — ${arche.subtitle}` : ""}
              </h3>
              <div className="flex flex-wrap gap-2">
                {elements.map((el) => {
                  const status = statuses[el.code] ?? "NON_DISPONIBLE";
                  return (
                    <button
                      key={el.code}
                      onClick={() => cycleStatus(el.code)}
                      title={el.name}
                      className={`rounded-full border px-3 py-1 text-xs transition ${STATUS_STYLE[status]}`}
                    >
                      {el.palier !== "BASE" && el.palier !== "NOMADE" ? `[${el.palier}] ` : ""}
                      {el.name.length > 40 ? el.name.slice(0, 40) + "…" : el.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {grouped.size === 0 && <p className="text-sm text-muted">Aucun élément ne correspond à ce filtre.</p>}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted">
        <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLE.MAITRISE}`}>{STATUS_LABEL.MAITRISE}</span>
        <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLE.EN_APPRENTISSAGE}`}>{STATUS_LABEL.EN_APPRENTISSAGE}</span>
        <span className={`rounded-full border px-2 py-0.5 ${STATUS_STYLE.NON_DISPONIBLE}`}>{STATUS_LABEL.NON_DISPONIBLE}</span>
      </div>
    </div>
  );
}
