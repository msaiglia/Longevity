"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/session";

const links = [
  { href: "/admin", label: "Panoramica" },
  { href: "/admin/utenti", label: "Iscrizioni" },
  { href: "/admin/slot", label: "Sessioni" },
  { href: "/admin/messaggi", label: "Comunicazioni" },
  { href: "/admin/magazine", label: "Magazine" },
];

export function AdminNav() {
  const active = usePathname();
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-navy md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="px-5 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-display text-[16px] font-semibold text-white">Longevity</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-sky">
            staff
          </span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
              active === l.href || (l.href !== "/admin" && active?.startsWith(l.href))
                ? "bg-white/10 text-white"
                : "text-sky/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-5 py-3.5">
        <Link href="/prenota" className="text-[12.5px] text-sky/80 hover:text-white">
          Vista atleta
        </Link>
        <form action={signOutAction}>
          <Button variant="secondary" size="sm" type="submit" className="!bg-white/10 !text-white !border-white/10 hover:!bg-white/20">
            Esci
          </Button>
        </form>
      </div>
    </aside>
  );
}
