"use client";

import { useState, type ReactNode } from "react";

export default function ClubGroup({
  clubName,
  memberCount,
  children,
}: {
  clubName: string;
  memberCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex w-full items-center gap-2.5 text-left text-base font-semibold text-muted hover:text-foreground"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        {clubName}
        <span className="rounded-full border border-border-strong px-2.5 py-1 text-xs text-muted">
          {memberCount} gymnaste{memberCount > 1 ? "s" : ""}
        </span>
      </button>
      {open && children}
    </div>
  );
}
