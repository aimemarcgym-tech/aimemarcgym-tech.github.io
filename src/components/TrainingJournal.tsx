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
import { formatSize } from "@/lib/format";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

// Le document du lien de partage est stocké dans Firestore, limité à 1 Mo.
// L'encodage base64 gonfle la taille d'environ 37%, donc on plafonne le
// fichier d'origine bien en dessous pour laisser de la marge (métadonnées,
// séances du journal...).
const MAX_ATTACHMENT_BYTES = 500 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Formulaire de séance (date + texte libre), partagé entre l'ajout et
// l'édition — seuls le bouton de validation et la présence d'un "Annuler"
// diffèrent entre les deux usages.
function SessionForm({
  date,
  content,
  onDateChange,
  onContentChange,
  onSubmit,
  variant,
  busy,
  onCancel,
}: {
  date: string;
  content: string;
  onDateChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  variant: "add" | "edit";
  busy?: boolean;
  onCancel?: () => void;
}) {
  const dateInput = (
    <input
      type="date"
      value={date}
      onChange={(e) => onDateChange(e.target.value)}
      className="rounded border border-border-strong bg-surface-alt px-2 py-1.5 text-sm text-foreground focus:border-accent-solid focus:outline-none"
    />
  );
  const textarea = (
    <textarea
      value={content}
      onChange={(e) => onContentChange(e.target.value)}
      rows={3}
      placeholder={variant === "add" ? "Exercices, objectifs, remarques pour cette séance…" : undefined}
      className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-solid focus:outline-none"
    />
  );

  if (variant === "add") {
    return (
      <form onSubmit={onSubmit} className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {dateInput}
          <button
            type="submit"
            disabled={busy || !content.trim()}
            className="rounded bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : "Ajouter la séance"}
          </button>
        </div>
        {textarea}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {dateInput}
      {textarea}
      <div className="flex gap-2">
        <button type="submit" className="text-xs accent-gradient-text font-medium underline">
          Enregistrer
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-foreground">
          Annuler
        </button>
      </div>
    </form>
  );
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

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

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(
        `« ${file.name} » fait ${formatSize(file.size)}, c'est trop volumineux pour être joint au lien (max ${formatSize(MAX_ATTACHMENT_BYTES)}).`
      );
      return;
    }
    setAttachmentError(null);
    setAttachment(file);
  }

  async function handleShare() {
    const attachmentPayload = attachment
      ? {
          fileName: attachment.name,
          mimeType: attachment.type || "application/octet-stream",
          dataBase64: await fileToBase64(attachment),
        }
      : undefined;
    const payload = {
      targetLabel,
      programType: type,
      sessions: (sessions ?? []).map((s) => ({ date: s.date, content: s.content })),
      ...(attachmentPayload ? { attachment: attachmentPayload } : {}),
    };
    // Le plafond sur la pièce jointe seule (MAX_ATTACHMENT_BYTES) ne suffit
    // pas : le document Firestore embarque aussi le texte de toutes les
    // séances, qui peut être volumineux sur un long historique. On vérifie
    // ici la taille réelle du document avant l'envoi, avec une marge sous la
    // limite Firestore de 1 Mo par document.
    const estimatedSize = new Blob([JSON.stringify(payload)]).size;
    if (estimatedSize > 900 * 1024) {
      throw new Error(
        `Le lien serait trop volumineux (${formatSize(estimatedSize)}, max ~900 Ko) — retirez la pièce jointe ou raccourcissez l'historique des séances.`
      );
    }
    const shareId = await createShare("trainingJournal", payload);
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
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 rounded border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent-solid/60">
          📎 {attachment ? attachment.name : "Joindre un document (PDF…)"}
          <input type="file" accept="application/pdf,image/*,.doc,.docx" onChange={handleAttachmentChange} className="hidden" />
        </label>
        {attachment && (
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-xs text-muted hover:text-foreground"
          >
            Retirer
          </button>
        )}
        <ShareLinkButton onCreate={handleShare} />
      </div>
      {attachmentError && <p className="mb-3 text-right text-xs text-danger">{attachmentError}</p>}
      <SessionForm
        variant="add"
        date={date}
        content={content}
        onDateChange={setDate}
        onContentChange={setContent}
        onSubmit={handleAdd}
        busy={saving}
      />

      {!sessions ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted">Aucune séance enregistrée pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-lg border border-border-subtle bg-surface p-3">
              {editingId === s.id ? (
                <SessionForm
                  variant="edit"
                  date={editDate}
                  content={editContent}
                  onDateChange={setEditDate}
                  onContentChange={setEditContent}
                  onSubmit={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                />
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
