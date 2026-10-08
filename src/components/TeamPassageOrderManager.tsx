"use client";

import { useEffect, useMemo, useState } from "react";
import { getGymnasts, setGymnastsPassageOrder } from "@/lib/data";
import { createShare } from "@/lib/shares";
import { computeTeamStartNotes } from "@/lib/teamNotes";
import ShareLinkButton from "@/components/ShareLinkButton";
import TeamStartNotesPanel from "@/components/TeamStartNotesPanel";
import TeamEquipmentSettings from "@/components/TeamEquipmentSettings";
import DragHandle from "@/components/DragHandle";
import { useDragReorder } from "@/hooks/useDragReorder";

type Gymnast = Awaited<ReturnType<typeof getGymnasts>>[number];

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

function ApparatusOrderList({
  apparatus,
  members,
  onReorder,
}: {
  apparatus: string;
  members: Gymnast[];
  onReorder: (apparatus: string, orderedIds: string[]) => void;
}) {
  const ordered = useMemo(() => {
    return [...members].sort((a, b) => {
      const ao = a.passageOrder?.[apparatus] ?? Infinity;
      const bo = b.passageOrder?.[apparatus] ?? Infinity;
      return ao - bo;
    });
  }, [members, apparatus]);

  function reorderTo(from: number, to: number) {
    if (from === to) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(
      apparatus,
      next.map((g) => g.id)
    );
  }

  const { dragIndex, overIndex, setItemRef, handleProps } = useDragReorder(reorderTo);

  return (
    <div>
      <ol className="space-y-1.5">
        {ordered.map((g, i) => {
          const isDragging = dragIndex === i;
          const isDragOver = overIndex === i && dragIndex !== null && dragIndex !== i;
          return (
            <li
              key={g.id}
              ref={setItemRef(i)}
              className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition ${
                isDragging
                  ? "border-accent-solid/60 bg-surface-alt opacity-50"
                  : isDragOver
                  ? "border-accent-solid bg-accent-from/10"
                  : "border-border-subtle bg-surface-alt/40"
              }`}
            >
              <DragHandle {...handleProps(i)} />
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-foreground">
                {g.firstName} {g.lastName}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function TeamPassageOrderManager() {
  const [gymnasts, setGymnasts] = useState<Gymnast[] | null>(null);
  const [teamKey, setTeamKey] = useState("");
  const [apparatus, setApparatus] = useState<string>(Object.keys(APPARATUS_LABELS)[0]);

  function refresh() {
    getGymnasts().then(setGymnasts);
  }

  useEffect(() => {
    refresh();
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

  async function handleReorder(apparatus: string, orderedIds: string[]) {
    await setGymnastsPassageOrder(apparatus, orderedIds);
    refresh();
  }

  function orderFor(apparatusKey: string) {
    return [...members].sort((a, b) => {
      const ao = a.passageOrder?.[apparatusKey] ?? Infinity;
      const bo = b.passageOrder?.[apparatusKey] ?? Infinity;
      return ao - bo;
    });
  }

  const orderedForShare = useMemo(() => orderFor(apparatus), [members, apparatus]);

  async function handleShare() {
    const selected = teams.find((t) => t.key === teamKey);
    if (!selected) throw new Error("Équipe introuvable");
    const shareId = await createShare("passageOrder", {
      club: selected.club,
      team: selected.team,
      apparatus,
      apparatusLabel: APPARATUS_LABELS[apparatus] ?? apparatus,
      gymnasts: orderedForShare.map((g) => ({ firstName: g.firstName, lastName: g.lastName })),
    });
    return `/partage/ordre-passage/?id=${shareId}`;
  }

  async function handleShareAll() {
    const selected = teams.find((t) => t.key === teamKey);
    if (!selected) throw new Error("Équipe introuvable");
    const shareId = await createShare("passageOrderAll", {
      club: selected.club,
      team: selected.team,
      apparatuses: Object.entries(APPARATUS_LABELS).map(([key, label]) => ({
        apparatus: key,
        apparatusLabel: label,
        gymnasts: orderFor(key).map((g) => ({ firstName: g.firstName, lastName: g.lastName })),
      })),
    });
    return `/partage/ordres-passage/?id=${shareId}`;
  }

  // Les trois panneaux d'un coup : ordres des 4 agrès, notes de départ avec totaux, réglages du matériel.
  async function handleSharePanels() {
    const selected = teams.find((t) => t.key === teamKey);
    if (!selected) throw new Error("Équipe introuvable");
    // Relecture : les réglages sont saisis dans un autre panneau, qui a pu les modifier depuis le chargement.
    const fresh = await getGymnasts();
    const team = fresh.filter((g) => (g.club?.name ?? "Sans club") === selected.club && g.team === selected.team);
    const order = (key: string) =>
      [...team].sort((a, b) => (a.passageOrder?.[key] ?? Infinity) - (b.passageOrder?.[key] ?? Infinity));
    const notes = await computeTeamStartNotes(selected.team, team);
    const shareId = await createShare("teamPanels", {
      club: selected.club,
      team: selected.team,
      passageOrder: {
        club: selected.club,
        team: selected.team,
        apparatuses: Object.entries(APPARATUS_LABELS).map(([key, label]) => ({
          apparatus: key,
          apparatusLabel: label,
          gymnasts: order(key).map((g) => ({ firstName: g.firstName, lastName: g.lastName })),
        })),
      },
      notes: notes.evolution
        ? { evolution: notes.evolution, nbCompte: notes.nbCompte, gymnasts: notes.gymnasts, maxPerApparatus: notes.maxPerApparatus }
        : null,
      equipment: {
        club: selected.club,
        team: selected.team,
        gymnasts: team.map((g) => ({ name: `${g.firstName} ${g.lastName}`, settings: g.reglages ?? {} })),
      },
    });
    return `/partage/panneaux/?id=${shareId}`;
  }

  return (
    <div className="grid w-full max-w-[1400px] items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
    <div className="w-full min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Ordres de passage par équipe</h2>

      {!gymnasts ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune équipe trouvée. Renseignez le champ « Équipe » sur une gymnaste depuis l&apos;accueil.
        </p>
      ) : (
        <select
          value={teamKey}
          onChange={(e) => setTeamKey(e.target.value)}
          className="w-full rounded border border-border-strong bg-surface-alt px-3 py-2 text-sm text-foreground focus:border-accent-solid focus:outline-none"
        >
          <option value="">Sélectionner une équipe…</option>
          {teams.map((t) => (
            <option key={t.key} value={t.key}>
              {t.team} ({t.club})
            </option>
          ))}
        </select>
      )}

      {teamKey && members.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(APPARATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setApparatus(key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    apparatus === key
                      ? "border-border-strong bg-surface-alt text-white"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ShareLinkButton onCreate={handleShare} label={`Partager ${APPARATUS_LABELS[apparatus] ?? apparatus}`} />
              <ShareLinkButton
                onCreate={handleShareAll}
                label="Partager tous les agrès"
                className="rounded bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              />
              <ShareLinkButton
                onCreate={handleSharePanels}
                label="Partager les 3 panneaux"
                className="accent-gradient rounded px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              />
            </div>
          </div>
          <ApparatusOrderList apparatus={apparatus} members={members} onReorder={handleReorder} />
        </div>
      )}
    </div>
    <div className="space-y-8">
      <TeamStartNotesPanel teamName={teams.find((t) => t.key === teamKey)?.team ?? null} members={members} />
      <TeamEquipmentSettings />
    </div>
    </div>
  );
}
