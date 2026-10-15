"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAvailableApparatuses, getElement, getArche, getRegulation } from "@/regulation/loader";
import { analyzeMovement, type CheckResult } from "@/engine/composition";
import { analyzeSaut } from "@/engine/saut";
import { getExemples, type ExempleMouvement } from "@/lib/exemples";
import { getSautTips } from "@/lib/tips";
import { serieDe } from "@/lib/series";
import { champ } from "@/lib/styles";

const APPARATUS_LABELS: Record<string, string> = {
  SOL: "Sol",
  BARRES_ASYM: "Barres asymétriques",
  POUTRE: "Poutre",
  SAUT: "Saut",
};

function nomElement(apparatus: string, code: string) {
  return getElement(apparatus, code)?.name ?? code;
}

// Une exigence ou valorisation, avec les éléments de l'exemple qui la valident.
function Ligne({
  apparatus,
  ok,
  label,
  info,
  codes,
}: {
  apparatus: string;
  ok: boolean;
  label: string;
  info?: string;
  codes?: string[];
}) {
  return (
    <li className="rounded-lg border border-border-subtle bg-surface-alt/40 p-2.5">
      <div className={`text-sm ${ok ? "text-success" : "text-muted"}`}>
        {ok ? "✓" : "○"} {label} {info && <span className="text-xs text-muted">{info}</span>}
      </div>
      {codes && codes.length > 0 && (
        <ul className="mt-1 space-y-0.5 pl-5 text-xs text-muted">
          {codes.map((c) => (
            <li key={c} className="list-disc">
              {nomElement(apparatus, c)}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Exemple({ exemple }: { exemple: ExempleMouvement }) {
  const { apparatus, evolutionId } = exemple;
  const diagnostic = useMemo(
    () =>
      analyzeMovement(
        apparatus,
        evolutionId,
        exemple.elements.map((e) => ({ code: e.code, role: "ELEMENT" as const, serie: e.serie })),
        new Set(exemple.confirmations)
      ),
    [exemple, apparatus, evolutionId]
  );
  const evolution = getRegulation(apparatus).evolutions.find((e) => e.id === evolutionId)!;
  const parId = (r: CheckResult) => exemple.validations[r.id];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{exemple.titre}</h2>
            <p className="text-xs text-muted">
              {diagnostic.elementCount} élément(s) · {diagnostic.archesCount} arche(s) utilisée(s)
            </p>
          </div>
          <div className="accent-gradient rounded px-4 py-2 text-white">
            <div className="text-[11px] uppercase text-white/70">Note de départ</div>
            <div className="text-2xl font-bold">
              {diagnostic.noteDepart.toFixed(1)}
              <span className="text-base font-semibold text-white/70">/{diagnostic.noteDepartMax.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <ol className="mt-4 space-y-1.5">
          {exemple.elements.map((e, i) => {
            const el = getElement(apparatus, e.code);
            const arche = el ? getArche(apparatus, el.archeId) : undefined;
            const serie = serieDe(e.serie ?? "");
            return (
              <li key={`${e.code}-${i}`} className="rounded-lg border border-border-subtle bg-surface-alt/40 p-2.5">
                <div className="text-xs text-muted">
                  {i + 1}. {arche?.name} {el?.palier ? `· ${el.palier}` : ""}
                  {serie && <span className="ml-2">● {serie.label}</span>}
                </div>
                <div className="text-sm font-medium text-foreground">{el?.name ?? e.code}</div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border-subtle bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Validé dans le tronc commun</h2>
          <ul className="space-y-2">
            <Ligne
              apparatus={apparatus}
              ok={diagnostic.troncCommun.archesOk}
              label={`${diagnostic.archesCount} arche(s) (${evolution.troncCommun.arches} requises)`}
            />
            <Ligne
              apparatus={apparatus}
              ok={diagnostic.troncCommun.countOk}
              label={`${diagnostic.elementCount} élément(s) (${evolution.troncCommun.elementsMin}–${evolution.troncCommun.elementsMax} requis)`}
            />
            {diagnostic.troncCommun.exigences.map((r) => (
              <Ligne key={r.id} apparatus={apparatus} ok={r.status === "OK"} label={r.label} codes={parId(r)} />
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Validé dans les valorisations</h2>
            <span className="text-xs text-muted">
              retenues : {Math.min(diagnostic.valorisations.validatedCount, diagnostic.valorisations.choisir)}/
              {diagnostic.valorisations.choisir} (parmi {diagnostic.valorisations.parmi})
            </span>
          </div>
          <ul className="space-y-2">
            {diagnostic.valorisations.results.map((r) => (
              <Ligne
                key={r.id}
                apparatus={apparatus}
                ok={r.status === "OK"}
                label={`${r.pondere ? "★ " : ""}${r.label}`}
                info={`(+${r.points} pts)`}
                codes={parId(r)}
              />
            ))}
          </ul>
          {(diagnostic.valorisations.avertissements?.length ?? 0) > 0 && (
            <ul className="mt-3 space-y-1 rounded border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              {diagnostic.valorisations.avertissements!.map((w) => (
                <li key={w}>⚠ {w}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {exemple.remarques && exemple.remarques.length > 0 && (
        <section className="rounded-xl border border-border-subtle bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Remarques</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {exemple.remarques.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Saut : un saut (valeur fixe selon son palier) plus la valorisation confirmée à la main.
function ExempleSaut({ exemple }: { exemple: ExempleMouvement }) {
  const { apparatus, evolutionId } = exemple;
  const d = useMemo(
    () =>
      analyzeSaut(
        evolutionId,
        exemple.elements.map((e) => ({ code: e.code, role: "ELEMENT" as const })),
        new Set(exemple.confirmations)
      ),
    [exemple, evolutionId]
  );
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{exemple.titre}</h2>
          {d.sauts.map((s) => (
            <p key={s.code} className="mt-1 text-xs text-muted">
              {s.name} · {s.palier} · valeur {s.value}
            </p>
          ))}
        </div>
        <div className="accent-gradient rounded px-4 py-2 text-white">
          <div className="text-[11px] uppercase text-white/70">Note de départ</div>
          <div className="text-2xl font-bold">
            {d.noteDepart.toFixed(1)}
            <span className="text-base font-semibold text-white/70">/{d.noteDepartMax.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Validé dans le tronc commun</h3>
          <ul className="space-y-2">
            <Ligne apparatus={apparatus} ok={d.troncCommunOk} label={d.troncCommunMessage} codes={exemple.elements.map((e) => e.code)} />
          </ul>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Validé dans les valorisations</h3>
            <span className="text-xs text-muted">1 seule possible</span>
          </div>
          <ul className="space-y-2">
            {d.valorisations.map((v) => (
              <Ligne
                key={v.id}
                apparatus={apparatus}
                ok={v.status === "OK"}
                label={v.label}
                info={`(+${v.points} pts)`}
                codes={exemple.validations[v.id]}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border-subtle bg-surface-alt/40 p-3">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Matériel / pénalités (pour info)</h3>
        <ul className="mb-1 space-y-0.5 text-xs text-foreground">
          <li>☐ Trampo-tremp utilisé</li>
          <li>☐ Mini trampoline utilisé</li>
          <li>☐ Gymnaste de 13 ans ou plus</li>
        </ul>
        <p className="text-xs text-muted">
          À partir de 13 ans, le trampo-tremp entraîne -1 point. Le mini trampoline entraîne -1 point quel que soit l&apos;âge
          (saison 2026-2027).
        </p>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-muted">
        {getSautTips(d.sautsRequired, evolutionId).map((t) => (
          <li key={t}>💡 {t}</li>
        ))}
      </ul>

      {exemple.remarques && exemple.remarques.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-muted">
          {exemple.remarques.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ExemplesPage() {
  const apparatuses = getAvailableApparatuses();
  const [apparatus, setApparatus] = useState(apparatuses[0]);
  const evolutions = useMemo(() => [...getRegulation(apparatus).evolutions].sort((a, b) => a.ordre - b.ordre), [apparatus]);
  const [evolutionId, setEvolutionId] = useState("A1");
  const exemples = getExemples(apparatus, evolutionId);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <Link href="/" className="text-sm accent-gradient-text font-medium">
            ← Accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">Exemples de mouvements</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Un mouvement type par niveau et par agrès, construit pour viser la note de départ maximale.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 px-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Niveau</span>
            <select value={evolutionId} onChange={(e) => setEvolutionId(e.target.value)} className={champ} aria-label="Niveau">
              {evolutions.map((e) => (
                <option key={e.id} value={e.id}>
                  Évolution {e.id}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Agrès</span>
            <select value={apparatus} onChange={(e) => setApparatus(e.target.value)} className={champ} aria-label="Agrès">
              {apparatuses.map((a) => (
                <option key={a} value={a}>
                  {APPARATUS_LABELS[a] ?? a}
                </option>
              ))}
            </select>
          </label>
        </div>

        {exemples.length > 0 ? (
          exemples.map((exemple, i) =>
            exemple.apparatus === "SAUT" ? (
              <ExempleSaut key={`${apparatus}-${evolutionId}-${i}`} exemple={exemple} />
            ) : (
              <Exemple key={`${apparatus}-${evolutionId}-${i}`} exemple={exemple} />
            )
          )
        ) : (
          <section className="rounded-xl border border-border-subtle bg-surface p-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              {APPARATUS_LABELS[apparatus] ?? apparatus} — Évolution {evolutionId}
            </h2>
            <p className="text-sm text-muted">Aucun exemple pour l&apos;instant : ils seront ajoutés prochainement.</p>
          </section>
        )}
      </main>
    </div>
  );
}
