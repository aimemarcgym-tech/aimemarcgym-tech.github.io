import Link from "next/link";
import DeleteGymnastButton from "@/components/DeleteGymnastButton";

export default function GymnastRow({
  gymnastId,
  firstName,
  lastName,
  movementCount,
  onDeleted,
  individuelle,
}: {
  gymnastId: string;
  firstName: string;
  lastName: string;
  movementCount: number;
  onDeleted?: () => void;
  // Engagement en individuelle : « + Individuelle » pour l'ajouter, « Individuelle ✓ » quand elle y est déjà.
  individuelle?: { active: boolean; onMettre: () => void };
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-sm transition hover:border-accent-solid/60">
      <Link href={`/gymnaste/?id=${gymnastId}`} className="flex-1">
        <div className="font-medium text-foreground">
          {firstName} {lastName}
        </div>
        <div className="text-xs text-muted">{movementCount} mouvement(s)</div>
      </Link>
      <div className="flex items-center gap-3">
        {individuelle &&
          (individuelle.active ? (
            <span className="rounded border border-accent-solid/50 px-1.5 py-0.5 text-[11px] text-foreground">
              Individuelle ✓
            </span>
          ) : (
            <button
              onClick={individuelle.onMettre}
              className="rounded border border-border-strong px-1.5 py-0.5 text-[11px] text-muted hover:border-accent-solid/60 hover:text-foreground"
            >
              + Individuelle
            </button>
          ))}
        <Link href={`/gymnaste/?id=${gymnastId}`} className="text-sm accent-gradient-text font-medium">
          Ouvrir →
        </Link>
        <DeleteGymnastButton gymnastId={gymnastId} gymnastName={`${firstName} ${lastName}`} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
