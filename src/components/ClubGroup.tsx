"use client";

import { useState, useTransition, type ReactNode } from "react";
import { renameClub } from "@/lib/data";

export default function ClubGroup({
  clubId,
  clubName,
  memberCount,
  onRenamed,
  children,
}: {
  clubId: string | null;
  clubName: string;
  memberCount: number;
  onRenamed?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(clubName);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-2 flex w-full items-center gap-2.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 text-left text-base font-semibold text-muted hover:text-foreground"
        >
          <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          {editing ? null : clubName}
          <span className="rounded-full border border-border-strong px-2.5 py-1 text-xs text-muted">
            {memberCount} gymnaste{memberCount > 1 ? "s" : ""}
          </span>
        </button>
        {clubId &&
          (editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await renameClub(clubId, value);
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
                className="rounded border border-border-strong bg-surface-alt px-2 py-1 text-sm text-foreground focus:border-accent-solid focus:outline-none"
              />
              <button type="submit" disabled={pending} className="text-xs accent-gradient-text underline disabled:opacity-50">
                {pending ? "…" : "OK"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue(clubName);
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
              className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
            >
              Renommer
            </button>
          ))}
      </div>
      {open && children}
    </div>
  );
}
