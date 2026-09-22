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
    <nav className="flex justify-center gap-1 border-b border-border-subtle bg-surface/80 px-4 backdrop-blur">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-t px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-b-2 border-accent-solid text-foreground"
                : "border-b-2 border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
