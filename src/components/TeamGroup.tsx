"use client";

import { useState, type ReactNode } from "react";
import { teamColor } from "@/lib/teamColor";

export default function TeamGroup({
  teamName,
  memberCount,
  children,
}: {
  teamName: string;
  memberCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const isUnassigned = teamName === "Sans équipe";
  const color = teamColor(teamName);

  return (
    <div className={`ml-4 border-l pl-3 ${isUnassigned ? "border-border-subtle" : color.border}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex w-full items-center gap-2.5 text-left text-sm font-medium text-muted hover:text-foreground"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        {!isUnassigned && <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />}
        <span className={isUnassigned ? "" : color.text}>{teamName}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${
            isUnassigned ? "border-border-strong text-muted" : `${color.border} ${color.bg} ${color.text}`
          }`}
        >
          {memberCount}
        </span>
      </button>
      {open && children}
    </div>
  );
}
