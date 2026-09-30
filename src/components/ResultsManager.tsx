"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getGymnasts, getResultDocs, addResultDoc, deleteResultDoc, type TrainingTarget } from "@/lib/data";
import type { ResultDocRow } from "@/lib/idb";
import { shareFiles } from "@/lib/share";
import { formatSize } from "@/lib/format";

type Gymnast = Awaited<ReturnType<typeof getGymnasts>>[number];
type Selection = { target: TrainingTarget; label: string };

function ResultDocItem({ doc, onChange }: { doc: ResultDocRow; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const objectUrl = useMemo(() => URL.createObjectURL(doc.blob), [doc]);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteResultDoc(doc.id);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    const file = new File([doc.blob], doc.fileName, { type: doc.mimeType });
    const result = await shareFiles([file], { title: doc.fileName });
    if (result === "unsupported") {
      alert("Le partage n'est pas disponible sur ce navigateur. Utilisez « Télécharger ».");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground" title={doc.fileName}>
          {doc.fileName}
        </p>
        <p className="text-xs text-muted">{formatSize(doc.size)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={objectUrl}
          download={doc.fileName}
          className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid"
        >
          Télécharger
        </a>
        <button
          type="button"
          onClick={handleShare}
          className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-foreground hover:border-accent-solid"
        >
          Partager
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="rounded-md border border-border-strong px-2.5 py-1 text-xs font-medium text-muted hover:border-red-400 hover:text-red-400 disabled:opacity-50"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

function ResultDocsList({ target, targetLabel }: { target: TrainingTarget; targetLabel: string }) {
  const [docs, setDocs] = useState<ResultDocRow[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    getResultDocs(target).then(setDocs);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.kind === "gymnast" ? target.id : target.key]);

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await addResultDoc(target, file);
      }
      refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-border-subtle bg-surface-alt/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Documents — {targetLabel}</h3>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.odt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Import…" : "+ Ajouter des documents"}
          </button>
        </div>
      </div>

      {!docs ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted">Aucun document pour l&apos;instant (résultats, classements, feuilles de notes…).</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <ResultDocItem key={d.id} doc={d} onChange={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsManager() {
  const [gymnasts, setGymnasts] = useState<Gymnast[] | null>(null);
  const [teamKey, setTeamKey] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);

  useEffect(() => {
    getGymnasts().then(setGymnasts);
  }, []);

  const teams = useMemo(() => {
    if (!gymnasts) return [];
    const map = new Map<string, { club: string; team: string }>();
    for (const g of gymnasts) {
      if (!g.team) continue;
      const club = g.club?.name ?? "Sans club";
      const key = `${club}::${g.team}`;
      if (!map.has(key)) map.set(key, { club, team: g.team });
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [gymnasts]);

  const members = useMemo(() => {
    if (!gymnasts || !teamKey) return [];
    const selected = teams.find((t) => t.key === teamKey);
    if (!selected) return [];
    return gymnasts.filter((g) => (g.club?.name ?? "Sans club") === selected.club && g.team === selected.team);
  }, [gymnasts, teamKey, teams]);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">Résultats par équipe ou individuelle</h2>

      {!gymnasts ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : gymnasts.length === 0 ? (
        <p className="text-sm text-muted">Aucune gymnaste enregistrée pour le moment.</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune équipe trouvée. Renseignez le champ « Équipe » sur une gymnaste depuis l&apos;accueil, ou choisissez
          directement une gymnaste ci-dessous.
        </p>
      ) : (
        <select
          value={teamKey}
          onChange={(e) => {
            setTeamKey(e.target.value);
            setSelection(null);
          }}
          className="w-full max-w-xs rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          <option value="">Sélectionner une équipe…</option>
          {teams.map((t) => (
            <option key={t.key} value={t.key}>
              {t.team} ({t.club})
            </option>
          ))}
        </select>
      )}

      {teamKey && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(() => {
            const selectedTeam = teams.find((t) => t.key === teamKey);
            const teamLabel = selectedTeam ? `Toute l'équipe ${selectedTeam.team} (${selectedTeam.club})` : "Toute l'équipe";
            const isTeamSelected = selection?.target.kind === "team" && selection.target.key === teamKey;
            return (
              <button
                type="button"
                onClick={() =>
                  setSelection((cur) =>
                    cur?.target.kind === "team" && cur.target.key === teamKey
                      ? null
                      : { target: { kind: "team", key: teamKey }, label: teamLabel }
                  )
                }
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  isTeamSelected
                    ? "border-accent-solid bg-accent-from/10 text-white"
                    : "border-accent-solid/60 bg-surface-alt text-foreground hover:bg-accent-from/10"
                }`}
              >
                ★ Toute l&apos;équipe
              </button>
            );
          })()}
          {members.map((g) => {
            const isSelected = selection?.target.kind === "gymnast" && selection.target.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() =>
                  setSelection((cur) =>
                    cur?.target.kind === "gymnast" && cur.target.id === g.id
                      ? null
                      : { target: { kind: "gymnast", id: g.id }, label: `${g.firstName} ${g.lastName} (individuelle)` }
                  )
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-accent-solid bg-accent-from/10 text-white"
                    : "border-border-strong bg-surface-alt text-foreground hover:border-accent-solid hover:text-white"
                }`}
              >
                {g.firstName} {g.lastName}
              </button>
            );
          })}
        </div>
      )}

      {!teamKey && gymnasts && gymnasts.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted">Ou directement une gymnaste (individuelle) :</p>
          <div className="flex flex-wrap gap-2">
            {gymnasts.map((g) => {
              const isSelected = selection?.target.kind === "gymnast" && selection.target.id === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    setSelection((cur) =>
                      cur?.target.kind === "gymnast" && cur.target.id === g.id
                        ? null
                        : { target: { kind: "gymnast", id: g.id }, label: `${g.firstName} ${g.lastName} (individuelle)` }
                    )
                  }
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-accent-solid bg-accent-from/10 text-white"
                      : "border-border-strong bg-surface-alt text-foreground hover:border-accent-solid hover:text-white"
                  }`}
                >
                  {g.firstName} {g.lastName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selection && (
        <ResultDocsList
          key={selection.target.kind === "gymnast" ? selection.target.id : selection.target.key}
          target={selection.target}
          targetLabel={selection.label}
        />
      )}
    </div>
  );
}
