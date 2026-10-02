"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getShare, type MovementShareData, type ShareDoc } from "@/lib/shares";
import SharedMovementView, { movementHeaderSubtitle } from "@/components/SharedMovementView";

function MovementPartagePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [share, setShare] = useState<ShareDoc | null | "not-found">(null);

  useEffect(() => {
    if (!id) {
      setShare("not-found");
      return;
    }
    getShare(id)
      .then((s) => setShare(s && s.type === "movement" ? s : "not-found"))
      .catch(() => setShare("not-found"));
  }, [id]);

  if (share === null) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-muted">Chargement…</p>
      </main>
    );
  }

  if (share === "not-found") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-muted">Ce lien de partage n&apos;existe pas ou plus.</p>
      </main>
    );
  }

  const data = share.data as MovementShareData;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <p className="text-sm text-muted">
            {data.gymnastFirstName} {data.gymnastLastName}
          </p>
          <h1 className="mt-1 text-xl font-bold text-foreground">
            <span className="accent-gradient-text">{data.label}</span>
          </h1>
          <p className="text-sm text-muted">{movementHeaderSubtitle(data)}</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <SharedMovementView data={data} />
        <p className="text-center text-xs text-muted">
          Lien de partage en lecture seule, généré depuis l&apos;application Gestion Compétitions &amp; Entraînements.
        </p>
      </main>
    </div>
  );
}

export default function MovementPartagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <MovementPartagePageInner />
    </Suspense>
  );
}
