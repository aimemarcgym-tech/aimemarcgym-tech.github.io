"use client";

import { getRegulation } from "@/regulation/loader";
import type { Evolution } from "@/regulation/types";

// Tableaux « Décomposition de la note » du programme technique (un par agrès) : une colonne par évolution,
// avec le tronc commun, les paliers autorisés et valorisables, puis les valorisations. Tout vient des
// données réglementaires de l'appli (src/regulation/data/*/decomposition.json).

// Une teinte par évolution, prise dans la palette de l'application (bleu ciel, turquoise, vert, jaune,
// orange, rose, violets) : dégradé du plus doux (A1) au plus soutenu (C3).
const COULEURS: Record<string, string> = {
  A1: "#38bdf8",
  A2: "#2dd4bf",
  B1: "#34d399",
  B2: "#fbbf24",
  B3: "#fb923c",
  C1: "#ec4899",
  C2: "#a855f7",
  C3: "#8b5cf6",
};
const couleurDe = (id: string) => COULEURS[id] ?? "#a855f7";

const PALIERS_GRILLE = ["PR", "P1", "P2", "P3", "P4", "P5", "P6", "P7"] as const;

const norm = (p: string) => (p === "PREREQUIS" ? "PR" : p);

// Version adoucie d'une couleur d'évolution (translucide sur le fond sombre).
const doux = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

function Barre({ couleur, children }: { couleur: string; children: React.ReactNode }) {
  return (
    <div className="px-1 py-1 text-center text-[12px] font-semibold text-foreground" style={{ background: doux(couleur, 14), borderTop: `2px solid ${doux(couleur, 45)}` }}>
      {children}
    </div>
  );
}

const cellule = "h-[2.8rem] border-b border-r border-border-subtle px-1.5 py-1 text-center align-middle text-[12px] leading-tight text-foreground last:border-r-0";

// Ligne de titre colorée (une case par évolution).
function LigneBarre({ evolutions, children }: { evolutions: Evolution[]; children: React.ReactNode }) {
  return (
    <tr>
      {evolutions.map((e) => (
        <td key={e.id} className="p-0">
          <Barre couleur={couleurDe(e.id)}>{children}</Barre>
        </td>
      ))}
    </tr>
  );
}

// Ligne de texte : une case par évolution, grisée quand elle est vide.
function LigneTexte({ evolutions, texte }: { evolutions: Evolution[]; texte: (e: Evolution) => string | undefined }) {
  return (
    <tr>
      {evolutions.map((e) => {
        const t = texte(e);
        return (
          <td key={e.id} className={`${cellule} ${t ? "" : "bg-surface-alt/60"}`}>
            {t}
          </td>
        );
      })}
    </tr>
  );
}

function GrillePaliers({ actifs, couleur, grille = PALIERS_GRILLE }: { actifs: string[]; couleur: string; grille?: readonly string[] }) {
  const set = new Set(actifs.map(norm));
  return (
    <div className="grid gap-px p-1" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
      {grille.map((p) => {
        const ok = set.has(p);
        return (
          <span
            key={p}
            className="flex h-5 items-center justify-center text-[11px] font-semibold"
            style={
              ok
                ? { background: doux(couleur, 22), color: "var(--foreground)" }
                : {
                    background: "repeating-linear-gradient(45deg, transparent 0 3px, var(--color-border-strong, #555) 3px 4px)",
                    color: "transparent",
                  }
            }
            title={ok ? p : `${p} non concerné`}
          >
            {ok ? p : "·"}
          </span>
        );
      })}
    </div>
  );
}

function libelleValo(label: string, pondere: boolean) {
  return pondere ? `(*) ${label}` : label;
}

// Grille des paliers du Saut : A1 à B2 listent PR1 à PR4 puis P1 à P4 ; B3 à C3 gardent « PR » puis P1 à P7.
const GRILLE_SAUT_PR = ["PR1", "PR2", "PR3", "PR4", "P1", "P2", "P3", "P4"];
const estPrSaut = (p: string) => /^PR[1-4]$/.test(p);

// Définition des sauts en PR (pile de tapis), d'après les pages d'arches et la page « Saut » du programme.
const DEFINITION_PR: Record<string, string> = {
  PR1: "Saut droit",
  PR2: "Lune plat dos",
  PR3: "Rondade arrivée plat ventre",
  PR4: "Rondade arrivée debout sur tapis de 80 cm, ou rondade sur tremplin et saut extension",
};

// Détail des PR d'une évolution, tiré des données (paliers autorisés et valorisables).
function detailsPr(e: Evolution): { pr: string; texte: string; statut: string }[] {
  return e.paliersAutorises
    .filter(estPrSaut)
    .map((pr) => ({
      pr,
      texte: DEFINITION_PR[pr],
      statut: e.paliersValorisables.includes(pr) ? "VALORISABLE" : "AUTORISÉ",
    }));
}

const VALEUR_SAUTS: { palier: string; valeur: number }[] = [
  { palier: "PR1", valeur: 9 },
  { palier: "PR2", valeur: 10 },
  { palier: "PR3", valeur: 10 },
  { palier: "PR4", valeur: 11 },
  { palier: "P1", valeur: 12 },
  { palier: "P2", valeur: 12 },
  { palier: "P3", valeur: 13 },
  { palier: "P4", valeur: 13 },
  { palier: "P5", valeur: 13 },
  { palier: "P6", valeur: 14 },
  { palier: "P7", valeur: 14 },
  { palier: "Nomades", valeur: 12 },
];

export default function DecompositionNote({ apparatus }: { apparatus: string }) {
  const regulation = getRegulation(apparatus);
  const evolutions: Evolution[] = [...regulation.evolutions].sort((a, b) => a.ordre - b.ordre);
  const saut = apparatus === "SAUT";
  const poutre = apparatus === "POUTRE";

  // Poutre : les valorisations « Poutre mousse : … » forment une ligne à part, en bas du tableau.
  const parEvolution = evolutions.map((e) => {
    const options = e.valorisations.options;
    const mousse = poutre ? options.find((o) => o.label.toLowerCase().startsWith("poutre mousse")) : undefined;
    return { e, options: options.filter((o) => o !== mousse), mousse: mousse?.label.replace(/^poutre mousse\s*:\s*/i, "") };
  });
  const nbLignes = Math.max(...parEvolution.map((x) => x.options.length));
  const nbTcLignes = Math.max(0, ...evolutions.map((e) => e.troncCommun.exigences.length));
  const mousseUtile = parEvolution.some((x) => x.mousse);
  const pileDeTapis = evolutions.map((e) => ({ e, lignes: detailsPr(e) })).filter((x) => x.lignes.length > 0);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[1100px] table-fixed border-collapse">
          <colgroup>
            {evolutions.map((e) => (
              <col key={e.id} style={{ width: `${100 / evolutions.length}%` }} />
            ))}
          </colgroup>
          <tbody>
            <tr>
              {parEvolution.map(({ e }) => (
                <td key={e.id} className="border-r border-border-subtle py-3 text-center last:border-r-0">
                  <span
                    className="mx-auto flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full border-4 text-center text-[12px] font-bold leading-tight text-foreground"
                    style={{ borderColor: doux(couleurDe(e.id), 70) }}
                  >
                    <span>Évolution</span>
                    <span className="text-[17px]">{e.id}</span>
                  </span>
                  <span className="mt-1 block text-[11px] text-muted">{e.genre}</span>
                </td>
              ))}
            </tr>

            {!saut && (
              <>
                <LigneBarre evolutions={evolutions}>Tronc commun</LigneBarre>
                <LigneTexte evolutions={evolutions} texte={(e) => `${e.troncCommun.arches} arches (min.)`} />
                <LigneTexte
                  evolutions={evolutions}
                  texte={(e) => `${e.troncCommun.elementsMin} à ${e.troncCommun.elementsMax} éléments`}
                />
                {Array.from({ length: nbTcLignes }, (_, i) => (
                  <LigneTexte key={i} evolutions={evolutions} texte={(e) => e.troncCommun.exigences[i]?.label} />
                ))}
              </>
            )}

            <LigneBarre evolutions={evolutions}>Paliers autorisés</LigneBarre>
            <tr>
              {evolutions.map((e) => (
                <td key={e.id} className="border-r border-border-subtle last:border-r-0">
                  <GrillePaliers actifs={e.paliersAutorises} couleur={couleurDe(e.id)} grille={saut && e.paliersAutorises.some(estPrSaut) ? GRILLE_SAUT_PR : PALIERS_GRILLE} />
                </td>
              ))}
            </tr>
            <LigneBarre evolutions={evolutions}>Paliers valorisables</LigneBarre>
            <tr>
              {evolutions.map((e) => (
                <td key={e.id} className="border-r border-border-subtle last:border-r-0">
                  <GrillePaliers actifs={e.paliersValorisables} couleur={couleurDe(e.id)} grille={saut && e.paliersAutorises.some(estPrSaut) ? GRILLE_SAUT_PR : PALIERS_GRILLE} />
                </td>
              ))}
            </tr>

            <LigneBarre evolutions={evolutions}>Valorisations</LigneBarre>
            {Array.from({ length: nbLignes }, (_, i) => (
              <LigneTexte
                key={i}
                evolutions={evolutions}
                texte={(e) => {
                  const opts = parEvolution.find((x) => x.e === e)?.options ?? [];
                  // Saut : valorisations alignées en bas du tableau, comme dans le programme.
                  const o = opts[saut ? i - (nbLignes - opts.length) : i];
                  return o ? libelleValo(o.label, o.pondere) : undefined;
                }}
              />
            ))}

            {mousseUtile && (
              <>
                <LigneBarre evolutions={evolutions}>POUTRE MOUSSE</LigneBarre>
                <LigneTexte evolutions={evolutions} texte={(e) => parEvolution.find((x) => x.e === e)?.mousse} />
              </>
            )}

            {!saut && (
              <tr>
                {evolutions.map((e) => (
                  <td
                    key={e.id}
                    className="px-1 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted"
                  >
                    {e.valorisations.choisir === 4 && e.valorisations.parmi > 4
                      ? `Choisir ${e.valorisations.choisir} valorisations parmi les ${e.valorisations.parmi}`
                      : ""}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] text-muted">
        (*) Valorisation pondérée. Les cases hachurées ne sont pas concernées par l&apos;évolution. Source : programme technique
        UFOLEP du 20 octobre 2026, « Décomposition de la note ».
      </p>

      {saut && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border-subtle p-4">
            <h2 className="mb-1 text-[15px] font-semibold text-foreground">Sauts en PR (avec pile de tapis)</h2>
            <p className="mb-2 text-[13px] font-semibold text-danger">
              Autorisés seulement en filière régionale, jeunes et groupe.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-muted">
                    {pileDeTapis.map(({ e }) => (
                      <th key={e.id} className="px-2 py-1 font-semibold" style={{ color: couleurDe(e.id) }}>
                        {e.id} — détails des PR
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="align-top">
                    {pileDeTapis.map(({ e, lignes }) => (
                      <td key={e.id} className="space-y-1.5 border-t border-border-subtle px-2 py-2">
                        {lignes.map((l, i) => (
                          <div key={i} className="text-foreground">
                            <span className="font-semibold">{l.pr}</span> = {l.texte}{" "}
                            <span className={l.statut === "VALORISABLE" ? "text-success" : "text-muted"}>{l.statut}</span>
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border-subtle p-4">
            <h2 className="mb-2 text-[15px] font-semibold text-foreground">Valeur des sauts</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center text-[13px]">
                <thead>
                  <tr className="bg-surface-alt text-muted">
                    <th className="px-2 py-1 text-left font-semibold">Paliers</th>
                    {VALEUR_SAUTS.map((v) => (
                      <th key={v.palier} className="px-1.5 py-1 font-semibold">
                        {v.palier}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border-subtle text-foreground">
                    <td className="px-2 py-1 text-left font-semibold">Valeurs</td>
                    {VALEUR_SAUTS.map((v) => (
                      <td key={v.palier} className="px-1.5 py-1 font-semibold">
                        {v.valeur}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <h3 className="mb-1 mt-4 text-[15px] font-semibold text-foreground">Généralités</h3>
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-muted">
              <li>Chaque gymnaste peut présenter 2 sauts (identiques ou différents). La meilleure note est prise en considération.</li>
              <li>Le saut doit être annoncé avant d&apos;être exécuté (pas de pénalité en cas d&apos;absence d&apos;annonce).</li>
              <li>Pour les sauts avec rondade sur tremplin, la protection tremplin est obligatoire (autrement saut non reconnu).</li>
              <li>Seuls les sauts en Tsukahara peuvent avoir une pose de mains alternative.</li>
              <li>
                Pour les sauts avec salto et rotation longitudinale, celle-ci peut être réalisée n&apos;importe quand (ex. : lune salto
                avant demi = lune demi salto arrière).
              </li>
            </ul>
            <h3 className="mb-1 mt-4 text-[15px] font-semibold text-foreground">Précisions</h3>
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-muted">
              <li>Chaque gymnaste peut valider une des valorisations au choix dans son niveau et obtenir 2 points supplémentaires.</li>
              <li>
                Je note chaque saut, puis j&apos;applique les fautes, je calcule la note finale PUIS j&apos;ajoute la valorisation
                sur la meilleure des deux notes.
              </li>
              <li>À partir de 13 ans, trampo-tremp autorisé avec déduction d&apos;un point.</li>
              <li>Mini trampoline autorisé pour la saison 2026-2027 avec une pénalité de 1 point.</li>
            </ul>
            <p className="mt-2 text-[13px] italic text-muted">Le tremplin-trampoline = tremplin pour les moins de 13 ans.</p>
          </section>
        </div>
      )}
    </div>
  );
}
