"use client";

import { useState } from "react";
import SkillsEditor from "@/components/SkillsEditor";
import type { ApparatusRegulation } from "@/regulation/types";

export default function ApparatusSkillsTabs({
  gymnastId,
  apparatuses,
  apparatusLabels,
  regulations,
  existingSkills,
}: {
  gymnastId: string;
  apparatuses: string[];
  apparatusLabels: Record<string, string>;
  regulations: Record<string, ApparatusRegulation>;
  existingSkills: { elementCode: string; status: string }[];
}) {
  const [active, setActive] = useState(apparatuses[0]);

  return (
    <div>
      {apparatuses.length > 1 && (
        <div className="mb-4 flex gap-1 rounded-lg border border-border-subtle bg-surface-alt p-1 max-w-md">
          {apparatuses.map((a) => (
            <button
              key={a}
              onClick={() => setActive(a)}
              className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                active === a ? "accent-gradient text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {apparatusLabels[a] ?? a}
            </button>
          ))}
        </div>
      )}
      <SkillsEditor gymnastId={gymnastId} regulation={regulations[active]} existingSkills={existingSkills} />
    </div>
  );
}
