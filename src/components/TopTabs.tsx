"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Accueil" },
  { href: "/generalites", label: "Généralités" },
  { href: "/sauvegarde", label: "Sauvegarde" },
];

export default function TopTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-center gap-2 border-b border-border-subtle bg-surface/80 px-4 py-3 backdrop-blur">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              active
                ? "border-border-strong bg-surface-alt font-semibold text-white"
                : "border-transparent font-medium text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
