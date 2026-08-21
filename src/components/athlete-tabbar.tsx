"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardCheck, Trophy, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/prenota", label: "Prenota", icon: CalendarDays },
  { href: "/le-mie-prenotazioni", label: "Prenotazioni", icon: ClipboardCheck },
  { href: "/traguardi", label: "Traguardi", icon: Trophy },
  { href: "/profilo", label: "Profilo", icon: CircleUserRound },
];

export function AthleteTabBar({ hasUnread = false }: { hasUnread?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-4 py-2">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-1 text-[10.5px] font-medium",
                active ? "text-ocean" : "text-muted",
              )}
            >
              <t.icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.8} />
              {t.href === "/prenota" && hasUnread && (
                <span className="absolute right-[28%] top-0 h-2 w-2 rounded-full bg-leaf" />
              )}
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
