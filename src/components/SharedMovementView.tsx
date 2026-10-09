"use client";

import { useState } from "react";
import type { MovementShareData } from "@/lib/shares";
import type { Diagnostic } from "@/engine/composition";
import type { SautDiagnostic } from "@/engine/saut";
import { getApparatusTips, getSautTips } from "@/lib/tips";
import { serieDe } from "@/lib/series";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

const PALIER_LABEL: Record<string, string> = {
  PREREQUIS: "Prérequis",
  PR1: "PR1",
  PR2: "PR2",
  PR3: "PR3",
  BASE: "Base",
  NOMADE: "Nomade",
};

const BRANCH_LABEL: Record<string, string> = {
  avant: "Renversement avant",
  lateral: "Renversement latéral",
  rondade: "Rondade",
  mains: "Saut de mains",
};

function isSautDiagnostic(d: Diagnostic | SautDiagnostic): d is SautDiagnostic {
  return "sautsRequired" in d;
}

export function movementHeaderSubtitle(data: MovementShareData) {
  return `${APPARATUS_LABELS[data.apparatus] ?? data.apparatus} · Évolution ${data.evolutionId}`;
}

type Status = "OK" | "MANQUANT" | "A_CONFIRMER";

function CheckLine({ ok, toConfirm, label }: { ok: boolean; toConfirm?: boolean; label: string }) {
  const icon = ok ? "✓" : toConfirm ? "⚠" : "✕";
  const color = ok ? "text-success" : toConfirm ? "text-warning" : "text-danger";
  return (
    <li className={color}>
      {icon} {label}
    </li>
  );
}

function StatusLine({ status, label }: { status: Status; label: string }) {
  return <CheckLine ok={status === "OK"} toConfirm={status === "A_CONFIRMER"} label={label} />;
}

function Tips({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-sm text-muted">
      {tips.map((tip, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="shrink-0">💡</span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  );
}

function NoteCard({
  label,
  hint,
  note,
  noteMax,
  children,
}: {
  label: string;
  hint: string;
  note: number;
  noteMax?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="accent-gradient rounded px-4 py-3 text-white shadow-lg shadow-accent-from/20">
      <div className="flex items-center justify-between text-xs uppercase text-white/70">
        <span>{label}</span>
        <span className="normal-case text-white/60">{hint}</span>
      </div>
      <div className="text-3xl font-bold">
        {note.toFixed(1)}
        {typeof noteMax === "number" && (
          <span className="text-lg font-semibold text-white/70">/{noteMax.toFixed(1)} max</span>
        )}
      </div>
      <div className="mt-1 space-y-1 text-xs text-white/85">{children}</div>
    </div>
  );
}

// Affichage en lecture seule d'un mouvement partagé, reproduisant les deux
// panneaux du constructeur ("Mon mouvement" et "Analyse", résultat déplié,
// astuces dessous), commun à la page d'un mouvement seul et à celle des 4 agrès.
function SharedMovementBody({ data }: { data: MovementShareData }) {
  const diagnostic = data.diagnostic;

  if (isSautDiagnostic(diagnostic)) {
    const groups: { code: string; count: number; saut: (typeof diagnostic.sauts)[number] }[] = [];
    for (const s of diagnostic.sauts) {
      const g = groups.find((x) => x.code === s.code);
      if (g) g.count++;
      else groups.push({ code: s.code, count: 1, saut: s });
    }
    const penalite = data.penaliteMateriel ?? 0;
    const noteFinale = Math.max(0, diagnostic.noteDepart - penalite);
    const valorisations = diagnostic.valorisations.some((v) => v.status === "OK")
      ? diagnostic.valorisations.filter((v) => v.status === "OK")
      : diagnostic.valorisations;

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Mon/mes saut(s)</h2>
          {groups.length === 0 ? (
            <p className="text-sm text-muted">Aucun saut.</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.code} className="rounded-lg border border-border-subtle bg-surface-alt p-3">
                  <div className={`mb-1 text-xs font-semibold ${g.saut.horsPalierAutorise ? "text-danger" : "text-muted"}`}>
                    [{PALIER_LABEL[g.saut.palier] ?? g.saut.palier}]{" "}
                    {g.saut.branch ? BRANCH_LABEL[g.saut.branch] ?? g.saut.branch : ""}
                    {g.count > 1 && <span className="ml-1 accent-gradient-text">×{g.count}</span>}
                  </div>
                  <div className="text-sm text-foreground">{g.saut.name}</div>
                  <div className="mt-1 text-xs accent-gradient-text font-semibold">Valeur : {g.saut.value.toFixed(1)}</div>
                  {g.saut.horsPalierAutorise && (
                    <div className="mt-1 text-xs text-danger">⚠ Palier non autorisé pour cette évolution</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border-subtle bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Analyse</h2>
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Tronc commun</span>
              <span className={diagnostic.troncCommunOk ? "text-success" : "text-danger"}>
                {diagnostic.troncCommunOk ? "✓ complet" : "incomplet"}
              </span>
            </div>
            <p className={`text-sm ${diagnostic.troncCommunOk ? "text-success" : "text-danger"}`}>
              {diagnostic.troncCommunOk ? "✓" : "✕"} {diagnostic.troncCommunMessage}
            </p>
            {diagnostic.sautsRequired >= 2 && (
              <p className={`mt-1 text-sm ${diagnostic.famillesDifferentes ? "text-success" : "text-muted"}`}>
                {diagnostic.famillesDifferentes ? "✓" : "○"} 2 sauts de familles de 1<sup>er</sup> envol différentes
              </p>
            )}
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Valorisation</span>
              <span className="text-xs text-muted">1 seule possible</span>
            </div>
            <ul className="space-y-1 text-sm">
              {valorisations.map((v) => (
                <StatusLine key={v.id} status={v.status} label={v.label} />
              ))}
            </ul>
          </div>

          <NoteCard
            label={penalite > 0 ? "Note finale" : "Note de départ"}
            hint="Meilleur saut retenu"
            note={noteFinale}
            noteMax={diagnostic.noteDepartMax}
          >
            {penalite > 0 && (
              <div>
                Note de départ {diagnostic.noteDepart.toFixed(1)} − {penalite.toFixed(1)} (pénalité matériel)
              </div>
            )}
            <div>Barème &quot;Valeur des sauts&quot; (palier du saut retenu).</div>
            <div className="text-white/60">
              La valorisation des 2 sauts différents est appliquée si les 2 sauts sont reconnus et que l&apos;un des
              deux se trouve dans les paliers valorisables. Si le meilleur saut est un nomade, alors les nomades
              n&apos;étant pas valorisables, pas de valorisation.
            </div>
          </NoteCard>

          <Tips tips={getSautTips(diagnostic.sautsRequired, data.evolutionId)} />
        </section>
      </div>
    );
  }

  const req = data.requirements;
  const valorisationResults =
    diagnostic.valorisations.choisir === 1 && diagnostic.valorisations.results.some((v) => v.status === "OK")
      ? diagnostic.valorisations.results.filter((v) => v.status === "OK")
      : diagnostic.valorisations.results;
  const horsAutorise = diagnostic.paliers?.horsAutorise ?? [];
  const dernierEnVariante = diagnostic.liaisons?.dernierEnVariante ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Mon mouvement</h2>
        {data.elements.length === 0 ? (
          <p className="text-sm text-muted">Aucun élément.</p>
        ) : (
          <ol className="space-y-2">
            {data.elements.map((el, i) => (
              <li key={`${el.code}-${i}`} className="rounded border border-border-subtle bg-surface-alt p-2">
                <div className="text-xs text-muted">
                  {i + 1}. {el.archeName} {el.palier ? `· ${PALIER_LABEL[el.palier] ?? el.palier}` : ""}
                </div>
                <div className="text-sm font-medium text-foreground">{el.name}</div>
                {serieDe(el.serie) && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                    <span
                      style={{ boxShadow: `0 0 3px 0 ${serieDe(el.serie)!.lueur}` }}
                      className={`inline-block h-[6px] w-[6px] rounded-full ${serieDe(el.serie)!.plein}`}
                    />
                    {serieDe(el.serie)!.label}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Analyse</h2>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
            <span>Tronc commun</span>
            <span className={diagnostic.troncCommun.complete ? "text-success" : "text-muted"}>
              {diagnostic.troncCommun.complete ? "✓ complet" : "incomplet"}
            </span>
          </div>
          <ul className="space-y-1 text-sm">
            <CheckLine
              ok={diagnostic.troncCommun.archesOk}
              label={`${diagnostic.archesCount} arche(s)${req ? ` (${req.arches} requises)` : ""}`}
            />
            <CheckLine
              ok={diagnostic.troncCommun.countOk}
              label={`${diagnostic.elementCount} élément(s) dans le mouvement${
                req ? ` (${req.elementsMin}–${req.elementsMax} requis)` : ""
              }`}
            />
            {diagnostic.troncCommun.exigences.map((ex) => (
              <StatusLine key={ex.id} status={ex.status} label={ex.label} />
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
            <span>Paliers</span>
          </div>
          {horsAutorise.length === 0 ? (
            <p className="text-xs text-success">✓ Tous les éléments sont dans les paliers autorisés</p>
          ) : (
            <ul className="space-y-1 text-xs text-danger">
              {horsAutorise.map((h) => (
                <li key={h.code}>
                  ✕ {data.elements.find((e) => e.code === h.code)?.name ?? h.code} — palier {h.palier} non autorisé à
                  ce niveau
                </li>
              ))}
            </ul>
          )}
        </div>

        {dernierEnVariante.length > 0 && (
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Liaisons</span>
            </div>
            <ul className="space-y-1 text-xs text-danger">
              {dernierEnVariante.map((v) => (
                <li key={v.code}>
                  ✕ {data.elements.find((e) => e.code === v.code)?.name ?? v.name} — ne peut pas terminer une liaison
                  en variante (le dernier élément de la série doit être la forme de base)
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold text-foreground">
            <span>Valorisations</span>
            <span className={`text-xs ${diagnostic.valorisations.validatedCount >= diagnostic.valorisations.choisir ? "font-semibold text-success" : "text-muted"}`}>
              retenues : {Math.min(diagnostic.valorisations.validatedCount, diagnostic.valorisations.choisir)}/
              {diagnostic.valorisations.choisir} (parmi {diagnostic.valorisations.parmi})
            </span>
          </div>
          <ul className="space-y-1 text-sm">
            {valorisationResults.map((v) => (
              <StatusLine
                key={v.id}
                status={v.status}
                label={`${v.label} ${v.pondere ? "★" : ""} (+${v.points} pts)`}
              />
            ))}
          </ul>
        </div>

        <NoteCard
          label="Note de départ"
          hint="Tronc commun + Valorisations"
          note={diagnostic.noteDepart}
          noteMax={diagnostic.noteDepartMax}
        >
          <div>Tronc commun : {diagnostic.troncCommun.points} pts</div>
          <div>Valorisations : {diagnostic.valorisations.points} pts</div>
          <div className="text-white/60">
            ⚠ Les exigences marquées « à confirmer » nécessitent votre validation (liaisons avec envol, combinaisons
            spécifiques non déductibles automatiquement des données numérisées).
          </div>
        </NoteCard>

        <Tips tips={getApparatusTips(data.apparatus)} />
      </section>
    </div>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

// Mouvement partagé + ses versions enregistrées (instantanés) en lecture seule : en haut, la rangée
// « Mouvements créés » permet d'afficher la version actuelle ou n'importe quelle version précédente.
export default function SharedMovementView({ data }: { data: MovementShareData }) {
  const [version, setVersion] = useState<number | null>(null);
  const snapshots = data.snapshots ?? [];
  const snapshot = version !== null ? snapshots[version] : null;
  const shown = snapshot ? { ...data, elements: snapshot.elements, diagnostic: snapshot.diagnostic } : data;
  const chip = (active: boolean) =>
    `rounded border px-3 py-1.5 text-xs font-medium ${
      active ? "border-accent-solid text-white" : "border-border-strong text-muted hover:text-foreground"
    }`;

  return (
    <div className="space-y-6">
      {snapshots.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Mouvements créés</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setVersion(null)} className={chip(version === null)}>
              Version actuelle
            </button>
            {snapshots.map((s, i) => (
              <button key={i} type="button" onClick={() => setVersion(i)} className={chip(version === i)}>
                {s.name || formatDate(s.createdAt)} · Note {s.noteDepart.toFixed(1).replace(".", ",")}
              </button>
            ))}
          </div>
        </div>
      )}

      <SharedMovementBody key={version ?? -1} data={shown} />
    </div>
  );
}
