"use client";

import { useState } from "react";
import type { PassageOrderAllShareData } from "@/lib/shares";

// Ordres de passage d'une équipe, un onglet par agrès (pages de partage en lecture seule).
export default function PassageOrderTabs({ apparatuses }: { apparatuses: PassageOrderAllShareData["apparatuses"] }) {
  const [current, setCurrent] = useState(apparatuses[0]?.apparatus ?? "");
  const active = apparatuses.find((a) => a.apparatus === current) ?? apparatuses[0];
  if (!active) return null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {apparatuses.map((a) => (
          <button
            key={a.apparatus}
            type="button"
            role="tab"
            aria-selected={a.apparatus === active.apparatus}
            onClick={() => setCurrent(a.apparatus)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              a.apparatus === active.apparatus
                ? "border-border-strong bg-surface-alt text-white"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {a.apparatusLabel}
          </button>
        ))}
      </div>
      {active.gymnasts.length === 0 ? (
        <p className="text-sm text-muted">Aucune gymnaste dans cette équipe.</p>
      ) : (
        <ol className="space-y-1.5">
          {active.gymnasts.map((g, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-alt/40 p-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-foreground">
                {g.firstName} {g.lastName}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
