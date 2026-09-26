"use client";

import { useState, useTransition, type ReactNode } from "react";
import { teamColor } from "@/lib/teamColor";
import { renameTeam } from "@/lib/data";

export default function TeamGroup({
  clubId,
  teamName,
  memberCount,
  onRenamed,
  children,
}: {
  clubId: string | null;
  teamName: string;
  memberCount: number;
  onRenamed?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(teamName);
  const [pending, startTransition] = useTransition();
  const isUnassigned = teamName === "Sans équipe";
  const color = teamColor(teamName);

  return (
    <div className={`ml-4 border-l pl-3 ${isUnassigned ? "border-border-subtle" : color.border}`}>
      <div className="mb-2 flex w-full items-center gap-2.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 text-left text-sm font-medium text-muted hover:text-foreground"
        >
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          {!isUnassigned && <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />}
          {!editing && <span className={isUnassigned ? "" : color.text}>{teamName}</span>}
          <span
            className={`rounded-full border px-2 py-0.5 text-xs ${
              isUnassigned ? "border-border-strong text-muted" : `${color.border} ${color.bg} ${color.text}`
            }`}
          >
            {memberCount}
          </span>
        </button>
        {!isUnassigned &&
          (editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await renameTeam(clubId, teamName, value);
                  setEditing(false);
                  onRenamed?.();
                });
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="rounded border border-border-strong bg-surface-alt px-2 py-1 text-xs text-foreground focus:border-accent-solid focus:outline-none"
              />
              <button type="submit" disabled={pending} className="text-xs accent-gradient-text underline disabled:opacity-50">
                {pending ? "…" : "OK"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue(teamName);
                  setEditing(false);
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                Annuler
              </button>
            </form>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] text-muted hover:border-accent-solid/60 hover:text-foreground"
            >
              Renommer
            </button>
          ))}
      </div>
      {open && children}
    </div>
  );
}
