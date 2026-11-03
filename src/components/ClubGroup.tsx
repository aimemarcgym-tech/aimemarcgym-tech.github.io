"use client";

import { useState, useTransition, type ReactNode } from "react";
import { renameClub, deleteClub, deleteGymnast, assignGymnastsToClub } from "@/lib/data";

export default function ClubGroup({
  clubId,
  clubName,
  memberCount,
  memberIds = [],
  onRenamed,
  children,
}: {
  clubId: string | null;
  clubName: string;
  memberCount: number;
  // Pour « Sans club » (pas de club à supprimer) : les gymnastes à supprimer d'un coup.
  memberIds?: string[];
  onRenamed?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [value, setValue] = useState(clubName);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-2 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1.5">
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
        {!clubId && memberIds.length > 0 &&
          (editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!value.trim()) return;
                startTransition(async () => {
                  await assignGymnastsToClub(memberIds, value);
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
                placeholder="Nom du club"
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
          ) : deleting ? (
            <span className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-danger">
                Supprimer les {memberIds.length} gymnaste{memberIds.length > 1 ? "s" : ""} sans club, avec leurs mouvements ?
                Cette action est définitive.
              </span>
              <button
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    for (const id of memberIds) await deleteGymnast(id);
                    setDeleting(false);
                    onRenamed?.();
                  });
                }}
                className="rounded bg-danger px-2 py-0.5 text-xs text-white hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "…" : "Confirmer"}
              </button>
              <button
                onClick={() => setDeleting(false)}
                className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
              >
                Annuler
              </button>
            </span>
          ) : (
            <>
              <button
                onClick={() => {
                  setValue("");
                  setEditing(true);
                }}
                className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
              >
                Renommer
              </button>
              <button
                onClick={() => setDeleting(true)}
                className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
              >
                Supprimer
              </button>
            </>
          ))}
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
          ) : deleting ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-muted">Supprimer {clubName} ?</span>
              <button
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await deleteClub(clubId);
                    onRenamed?.();
                  });
                }}
                className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground disabled:opacity-50"
              >
                {pending ? "…" : "Confirmer"}
              </button>
              <button onClick={() => setDeleting(false)} className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground">
                Annuler
              </button>
            </span>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
              >
                Renommer
              </button>
              <button
                onClick={() => setDeleting(true)}
                className="rounded border border-border-strong px-2 py-0.5 text-xs text-muted hover:border-accent-solid/60 hover:text-foreground"
              >
                Supprimer
              </button>
            </>
          ))}
      </div>
      {open && children}
    </div>
  );
}
