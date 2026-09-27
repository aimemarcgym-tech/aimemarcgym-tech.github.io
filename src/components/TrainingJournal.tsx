"use client";

import { useEffect, useState } from "react";
import {
  getTrainingSessions,
  addTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  type TrainingTarget,
} from "@/lib/data";
import type { TrainingSessionRow } from "@/lib/idb";
import { createShare } from "@/lib/shares";
import ShareLinkButton from "@/components/ShareLinkButton";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function TrainingJournal({
  target,
  targetLabel,
  type,
}: {
  target: TrainingTarget;
  targetLabel: string;
  type: "TECHNIQUE" | "PHYSIQUE";
}) {
  const [sessions, setSessions] = useState<TrainingSessionRow[] | null>(null);
  const [date, setDate] = useState(todayIso());
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");

  function refresh() {
    getTrainingSessions(target, type).then(setSessions);
  }

  useEffect(() => {
    setSessions(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.kind === "gymnast" ? target.id : target.key, type]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addTrainingSession(target, type, date, content.trim());
      setContent("");
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const shareId = await createShare("trainingJournal", {
      targetLabel,
      programType: type,
      sessions: (sessions ?? []).map((s) => ({ date: s.date, content: s.content })),
    });
    return `/partage/programme/?id=${shareId}`;
  }

  function startEdit(s: TrainingSessionRow) {
    setEditingId(s.id);
    setEditDate(s.date);
    setEditContent(s.content);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editContent.trim()) return;
    await updateTrainingSession(editingId, editDate, editContent.trim());
    setEditingId(null);
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteTrainingSession(id);
    refresh();
  }

  return (
    <div className="mt-4 rounded-lg border border-border-subtle bg-surface-alt/30 p-4">
      <div className="mb-3 flex items-center justify-end">
        <ShareLinkButton onCreate={handleShare} />
      </div>
      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm text-foreground focus:border-accent-solid focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="rounded bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "…" : "Ajouter la séance"}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Exercices, objectifs, remarques pour cette séance…"
          className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
        />
      </form>

      {!sessions ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted">Aucune séance enregistrée pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-lg border border-border-subtle bg-surface p-3">
              {editingId === s.id ? (
                <form onSubmit={handleSaveEdit} className="space-y-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm text-foreground focus:border-accent-solid focus:outline-none"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="text-xs accent-gradient-text font-medium underline">
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {formatDate(s.date)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="text-xs text-muted hover:text-foreground"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="text-xs text-danger hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{s.content}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
