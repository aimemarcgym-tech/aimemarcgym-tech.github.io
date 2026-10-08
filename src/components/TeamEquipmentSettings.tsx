"use client";

import { useEffect, useMemo, useState } from "react";
import { getGymnasts, setGymnastEquipment } from "@/lib/data";
import type { EquipmentSettings } from "@/lib/idb";
import { createShare } from "@/lib/shares";
import ShareLinkButton from "@/components/ShareLinkButton";
import { champ } from "@/lib/styles";

type Gymnast = Awaited<ReturnType<typeof getGymnasts>>[number];

const FIELDS: { key: keyof EquipmentSettings; label: string; unit: string; hint: string }[] = [
  { key: "ecartBarres", label: "Écart des barres", unit: "cm", hint: "150" },
  { key: "tremplinCm", label: "Tremplin", unit: "cm", hint: "120" },
  { key: "tremplinPas", label: "Tremplin", unit: "pas", hint: "6" },
];

// Réglages du matériel de chaque gymnaste, à transmettre à un entraîneur remplaçant : écart des barres,
// position du tremplin par rapport à la table de saut (en cm et en pas). Enregistré à chaque saisie.
export default function TeamEquipmentSettings() {
  const [gymnasts, setGymnasts] = useState<Gymnast[] | null>(null);
  const [teamKey, setTeamKey] = useState("");

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

  const selected = teams.find((t) => t.key === teamKey);
  const members = useMemo(
    () =>
      selected && gymnasts
        ? gymnasts.filter((g) => (g.club?.name ?? "Sans club") === selected.club && g.team === selected.team)
        : [],
    [gymnasts, selected]
  );

  async function change(g: Gymnast, key: keyof EquipmentSettings, value: string) {
    setGymnasts((list) =>
      list ? list.map((x) => (x.id === g.id ? { ...x, reglages: { ...x.reglages, [key]: value } } : x)) : list
    );
    await setGymnastEquipment(g.id, { [key]: value });
  }

  // Une même valeur pour toute l'équipe : écrite chez chaque gymnaste (elles restent modifiables une à une).
  async function changeAll(key: keyof EquipmentSettings, value: string) {
    const ids = new Set(members.map((g) => g.id));
    setGymnasts((list) =>
      list ? list.map((x) => (ids.has(x.id) ? { ...x, reglages: { ...x.reglages, [key]: value } } : x)) : list
    );
    await Promise.all(members.map((g) => setGymnastEquipment(g.id, { [key]: value })));
  }

  // Valeur commune à toute l'équipe, vide si les gymnastes diffèrent.
  function commonValue(key: keyof EquipmentSettings) {
    const first = members[0]?.reglages?.[key] ?? "";
    return members.every((g) => (g.reglages?.[key] ?? "") === first) ? first : "";
  }

  async function share() {
    if (!selected) throw new Error("Équipe introuvable");
    const id = await createShare("equipment", {
      club: selected.club,
      team: selected.team,
      gymnasts: members.map((g) => ({ name: `${g.firstName} ${g.lastName}`, settings: g.reglages ?? {} })),
    });
    return `/partage/reglages/?id=${id}`;
  }

  return (
    <div className="w-full min-w-[320px] rounded-xl border border-border-subtle bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Réglages du matériel</h2>

      {!gymnasts ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune équipe trouvée. Renseignez le champ « Équipe » sur une gymnaste depuis l&apos;accueil.
        </p>
      ) : (
        <select value={teamKey} onChange={(e) => setTeamKey(e.target.value)} className={champ} aria-label="Équipe">
          <option value="">Sélectionner une équipe…</option>
          {teams.map((t) => (
            <option key={t.key} value={t.key}>
              {t.team} ({t.club})
            </option>
          ))}
        </select>
      )}

      {selected && members.length === 0 && <p className="mt-4 text-sm text-muted">Cette équipe n&apos;a pas encore de gymnaste.</p>}

      {selected && members.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-accent-solid/50 bg-accent-from/10 p-3">
            <div className="mb-2 text-sm font-medium text-foreground">Toute l&apos;équipe</div>
            <div className="grid grid-cols-3 gap-2">
              {FIELDS.map((f) => {
                const common = commonValue(f.key);
                const mixed = common === "" && members.some((g) => (g.reglages?.[f.key] ?? "") !== "");
                return (
                  <label key={f.key} className="block">
                    <span className="mb-1 block text-[11px] font-medium text-muted">
                      {f.label} ({f.unit})
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={common}
                      onChange={(e) => void changeAll(f.key, e.target.value)}
                      placeholder={mixed ? "différents" : f.hint}
                      aria-label={`${f.label} en ${f.unit} — toute l'équipe`}
                      className={`${champ} !px-2 !py-1.5`}
                    />
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Une valeur saisie ici est appliquée à toutes les gymnastes de l&apos;équipe.</p>
          </div>
          {members.map((g) => (
            <div key={g.id} className="rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
              <div className="mb-2 text-sm font-medium text-foreground">
                {g.firstName} {g.lastName}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-1 block text-[11px] font-medium text-muted">
                      {f.label} ({f.unit})
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={g.reglages?.[f.key] ?? ""}
                      onChange={(e) => void change(g, f.key, e.target.value)}
                      placeholder={f.hint}
                      aria-label={`${f.label} en ${f.unit} — ${g.firstName} ${g.lastName}`}
                      className={`${champ} !px-2 !py-1.5`}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted">
            Enregistré automatiquement pour chaque gymnaste. Le tremplin est mesuré à partir de la table de saut ; il est noté en
            centimètres et en pas.
          </p>
          <ShareLinkButton
            onCreate={share}
            label="Partager à un autre entraîneur"
            className="accent-gradient rounded px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          />
        </div>
      )}
    </div>
  );
}
