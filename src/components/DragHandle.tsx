"use client";

// Poignée de glisser-déposer partagée (gestion d'équipe, musiques, ordres de
// passage, séquences de mouvement...). Zone tactile élargie (40x40) et icône
// agrandie : la poignée d'origine (texte simple, ~16px) était trop petite
// pour être visée au doigt sur mobile.
export default function DragHandle(props: React.HTMLAttributes<HTMLSpanElement>) {
  const { className = "", ...rest } = props;
  return (
    <span
      {...rest}
      title="Glisser pour réordonner"
      className={`flex h-10 w-10 shrink-0 cursor-grab select-none items-center justify-center rounded text-2xl leading-none text-muted active:cursor-grabbing active:bg-accent-from/10 ${className}`}
    >
      ⠿
    </span>
  );
}
