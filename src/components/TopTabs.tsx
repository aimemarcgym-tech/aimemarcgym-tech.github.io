"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
  { href: "/", label: "Accueil" },
  { href: "/generalites", label: "Généralités" },
];

const COMPETITION_ITEMS = [
  { href: "/competition/categories-age", label: "Catégories d'âges" },
  { href: "/competition/calendrier", label: "Calendrier" },
  { href: "/competition/musiques", label: "Musiques" },
  { href: "/competition/ordres-passage", label: "Ordres de passage" },
  { href: "/competition/resultats", label: "Résultats" },
];

const MEDIA_ITEMS = [
  { href: "/media/photos", label: "Photos" },
  { href: "/media/videos", label: "Vidéos" },
];

const LAST_TABS = [
  { href: "/sauvegarde", label: "Sauvegarde" },
  { href: "/table", label: "Table" },
];

const tabClasses = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded-lg border px-4 py-2 text-sm transition-colors ${
    active
      ? "border-border-strong bg-surface-alt font-semibold text-white"
      : "border-transparent font-medium text-muted hover:text-foreground"
  }`;

// Le menu est rendu via un portail (document.body) plutôt qu'en `absolute`
// dans la barre <nav> (display:flex) : un élément positionné en absolute
// à l'intérieur d'un conteneur flex se retrouvait rendu flou par certains
// navigateurs (bug de compositing constaté en test), le portail contourne
// le problème en sortant complètement le menu de ce conteneur.
function TabDropdown({
  pathname,
  label,
  basePath,
  items,
}: {
  pathname: string;
  label: string;
  basePath: string;
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = pathname.startsWith(basePath);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open || !wrapperRef.current) return;
    const update = () => {
      const rect = wrapperRef.current!.getBoundingClientRect();
      setCoords({ left: rect.left, top: rect.bottom + 8 });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`${tabClasses(active)} inline-flex items-center gap-1.5`}
      >
        {label}
        <svg
          viewBox="0 0 12 12"
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ left: coords.left, top: coords.top }}
            className="fixed z-50 min-w-[12rem] rounded-lg border border-border-strong bg-surface-alt py-1 shadow-lg"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 text-sm transition-colors ${
                  pathname.startsWith(item.href)
                    ? "font-semibold text-white"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

// Même principe que TabDropdown : rendu via un portail plutôt qu'en
// `absolute` dans la barre <nav> (overflow-x-auto), sinon la bulle est
// coupée par le conteneur scrollable de la barre.
function EmailReveal({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        bubbleRef.current &&
        !bubbleRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open || !wrapperRef.current) return;
    const update = () => {
      const rect = wrapperRef.current!.getBoundingClientRect();
      setCoords({ left: rect.left + rect.width / 2 + 12, top: rect.bottom + 6 });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="inline-flex">
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? "Masquer l'email" : "Afficher l'email"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-xs font-semibold uppercase text-muted hover:border-accent-solid/60 hover:text-foreground"
      >
        {email[0] ?? "?"}
      </button>
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={bubbleRef}
            style={{ left: coords.left, top: coords.top, transform: "translateX(-50%)" }}
            className="fixed z-50 whitespace-nowrap rounded border border-border-strong bg-surface-alt px-2 py-1 text-xs text-muted shadow-lg"
          >
            {email}
          </div>,
          document.body
        )}
    </div>
  );
}

export default function TopTabs() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <nav className="relative flex flex-nowrap items-center justify-start gap-2 overflow-x-auto border-b border-border-subtle bg-surface px-4 py-3 md:justify-center">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={tabClasses(active)}>
            {tab.label}
          </Link>
        );
      })}
      <TabDropdown pathname={pathname} label="Compétition" basePath="/competition" items={COMPETITION_ITEMS} />
      <Link
        href="/entrainement"
        className={tabClasses(pathname.startsWith("/entrainement"))}
      >
        Entraînement
      </Link>
      <TabDropdown pathname={pathname} label="Média" basePath="/media" items={MEDIA_ITEMS} />
      {LAST_TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={tabClasses(active)}>
            {tab.label}
          </Link>
        );
      })}
      {user && (
        <div className="ml-2 flex shrink-0 items-center gap-2 text-xs text-muted 2xl:absolute 2xl:right-4 2xl:top-1/2 2xl:ml-0 2xl:-translate-y-1/2">
          {/* Grand écran PC uniquement : email toujours visible dans le bandeau.
              Les tablettes (même larges, en paysage) restent sous ce seuil pour
              éviter tout chevauchement avec les onglets. */}
          <span className="hidden 2xl:inline">{user.email}</span>
          {/* Mobile/tablette/petit PC : bouton avatar + bulle en dessous (via
              portail, pour éviter la coupure par le défilement horizontal de la nav). */}
          <span className="2xl:hidden">{user.email && <EmailReveal email={user.email} />}</span>
          <button
            onClick={() => signOut()}
            className="rounded border border-border-strong px-2 py-1 text-muted hover:border-accent-solid/60 hover:text-foreground"
          >
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
