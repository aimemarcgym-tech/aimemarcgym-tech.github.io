import Link from "next/link";
import DeleteGymnastButton from "@/components/DeleteGymnastButton";

export default function GymnastRow({
  gymnastId,
  firstName,
  lastName,
  movementCount,
  onDeleted,
}: {
  gymnastId: string;
  firstName: string;
  lastName: string;
  movementCount: number;
  onDeleted?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-sm transition hover:border-accent-solid/60">
      <Link href={`/gymnaste?id=${gymnastId}`} className="min-w-0">
        <div className="whitespace-nowrap font-medium text-foreground">
          {firstName} {lastName}
        </div>
        <div className="text-xs text-muted">{movementCount} mouvement(s)</div>
      </Link>
      <div className="flex items-center gap-3">
        <Link href={`/gymnaste?id=${gymnastId}`} className="text-sm accent-gradient-text font-medium">
          Ouvrir →
        </Link>
        <DeleteGymnastButton gymnastId={gymnastId} gymnastName={`${firstName} ${lastName}`} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
